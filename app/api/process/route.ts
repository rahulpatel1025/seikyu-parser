import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize backend Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { documentId, fileUrl } = await req.json();

    if (!documentId || !fileUrl) {
      return NextResponse.json({ error: 'Missing document info' }, { status: 400 });
    }

    console.log(`Processing Document ID: ${documentId}`);

    // 1. Fetch the image file as a Buffer from Supabase
    const imageResponse = await fetch(fileUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Run Tesseract OCR (Japanese mode)
    console.log('Starting Tesseract OCR...');
    const { data: { text: rawText } } = await Tesseract.recognize(
      buffer,
      'jpn', 
      { logger: m => console.log(`Tesseract Status: ${m.status}`) } 
    );
    
    console.log('OCR Complete. Extracted characters:', rawText.length);

    // 3. Pass raw Japanese text to Gemini for Translation & Structuring
    console.log('Sending to Gemini...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      You are a precise data extraction assistant for a Japanese company.
      I have extracted the following raw Japanese text from an invoice using OCR.
      Translate the key details to English and format them exactly as a JSON object.
      
      Required JSON structure:
      {
        "vendorName": "Translated name of the company/store",
        "totalAmount": 1234, // The final total number only
        "date": "YYYY-MM-DD",
        "category": "One of: IT, Travel, Office Supplies, Meals, Other"
      }
      
      Raw Japanese OCR Text:
      ${rawText}
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" } 
    });

    const structuredData = JSON.parse(result.response.text());
    console.log('Gemini Extraction Success:', structuredData);

    // 4. Save the English JSON back to Supabase
    const { error: dbError } = await supabase
      .from('documents')
      .update({ 
        extracted_data: structuredData,
        status: 'COMPLETED' 
      })
      .eq('id', documentId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, data: structuredData });

  } catch (error) {
    console.error('Processing Failed:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}