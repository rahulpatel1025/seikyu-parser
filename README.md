# 📄 DocFlow Engine (Japanese Invoice AI Pipeline)

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database_&_Storage-3ECF8E?style=for-the-badge&logo=supabase)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Shadcn UI](https://img.shields.io/badge/Shadcn_UI-Nova-black?style=for-the-badge)

A full-stack, serverless application designed to automate the extraction, translation, and categorization of Japanese business invoices (請求書) and receipts (レシート). 

Built specifically to showcase a zero-cost, multi-agent AI architecture handling non-English OCR and structured data generation.

---

## ✨ Key Features

* **Intelligent Data Extraction:** Upload raw images of Japanese invoices, and the pipeline automatically extracts the Vendor Name, Total Amount, Date, and Category.
* **Native Translation:** Automatically localizes complex Japanese accounting terminology into structured English JSON.
* **Serverless AI Pipeline:** Decouples the OCR reading process (Tesseract) from the reasoning and structuring engine (Gemini 1.5) for a highly scalable backend architecture.
* **Interactive Dashboard:** A beautiful, responsive workspace built with Shadcn UI to review processed documents, complete with an interactive side-by-side data verification sheet.
* **Real-time Analytics:** Tracks total expenditure and processing volume across the entire database.
* **Cloud Storage & Database:** Utilizes Supabase for secure image bucket storage and PostgreSQL row management.

## 🏗️ Architecture & System Design

This project utilizes a multi-step backend pipeline to ensure high accuracy while keeping server costs at zero:
1. **Client:** User uploads an image (`.jpg`/`.png`).
2. **Storage:** Image is secured in a Supabase Storage Bucket.
3. **Trigger:** The public URL and Database ID are sent to the Next.js API Route.
4. **OCR (The Eyes):** Tesseract.js processes the image buffer in `jpn` mode to extract raw characters.
5. **LLM (The Brain):** Google's Gemini 1.5 Flash receives the raw Japanese text with a strict system prompt, translating and structuring the data into a strict JSON schema.
6. **Persistence:** The English JSON is saved back to Supabase PostgreSQL, and the frontend Dashboard is revalidated.

