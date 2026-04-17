'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'DONE' | 'ERROR'>('IDLE');
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus('UPLOADING');
    setResult(null);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (storageError) throw storageError;

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      // 3. Save to Database AND get the generated ID back
      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert([{ file_url: publicUrl }])
        .select() // This asks Supabase to return the newly created row
        .single();

      if (dbError) throw dbError;

      // 4. Trigger the AI Pipeline!
      setStatus('PROCESSING');
      
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentId: dbData.id, 
          fileUrl: publicUrl 
        })
      });

      const aiData = await response.json();

      if (!response.ok) {
        throw new Error(aiData.error || 'AI Processing failed');
      }

      // 5. Display the result
      setStatus('DONE');
      setResult(aiData.data);
      
    } catch (error) {
      console.error('Pipeline Error:', error);
      setStatus('ERROR');
      alert('Something went wrong. Check the console.');
    }
  };

  return (
    <main className="p-10 font-sans">
      <h1 className="text-3xl font-bold mb-2">DocFlow Engine</h1>
      <p className="text-gray-600 mb-8">Japanese Invoice Localization Pipeline</p>
      
      <form onSubmit={handleUpload} className="flex flex-col gap-4 max-w-sm mb-8">
        <input 
          type="file" 
          accept="image/jpeg, image/png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-2 rounded"
        />
        <button 
          type="submit" 
          disabled={!file || status === 'UPLOADING' || status === 'PROCESSING'}
          className="bg-blue-600 text-white p-3 rounded font-medium disabled:bg-gray-400 transition-colors"
        >
          {status === 'IDLE' && 'Upload & Process Invoice'}
          {status === 'UPLOADING' && '1. Uploading to Storage...'}
          {status === 'PROCESSING' && '2. AI Extracting & Translating...'}
          {status === 'DONE' && 'Process Complete!'}
          {status === 'ERROR' && 'Try Again'}
        </button>
      </form>

      {/* Display the AI Result */}
      {result && (
        <div className="mt-8 border rounded-lg p-6 bg-gray-50 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-green-700">Structured English Data</h2>
          <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}