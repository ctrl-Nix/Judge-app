# Judge. 🔥

A brutally savage Hinglish roast AI that destroys you with calm, devastating one-liners. No mercy. No advice. No comfort.

## What it does

- **Roast my Life** — just talk, Judge will handle the rest.
- **Roast my File** — upload a resume, PDF, or **Word Document (.docx)** and get destroyed.
- **Visual Feedback** — see exactly what's being analyzed with the file badge system.
- **Aukaat Check** — after 10 messages, you get a final verdict on your entire existence.

## Tech Stack

- **Frontend** — Vanilla HTML, CSS, and JS (Organized into `css/` and `js/` modules).
- **Backend** — Node.js Serverless Function (Vercel API).
- **AI** — Gemini 2.5 Flash via Google Generative Language API (optimized with custom safety settings).
- **Parsers** — PDF.js (for PDFs) and Mammoth.js (for .docx).

## Project Structure

```text
JUDGE-APP/
├── api/
│   └── roast.js      # Gemini API handler (Serverless)
├── css/
│   └── style.css     # Premium dark-mode aesthetics
├── js/
│   └── script.js     # Extraction logic & chat management
├── index.html        # Main Entry Point
├── package.json
└── README.md
```

## Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/ctrl-Nix/Judge-app.git
   cd judge-app
   ```

2. **Install dependencies** (optional, mostly for local dev)
   ```bash
   npm install
   ```

3. **Configure Environment**
   Add your Gemini API key in Vercel or your local `.env`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

4. **Deploy**
   The app is optimized for Vercel:
   ```bash
   vercel --prod
   ```

## Warning

Do not use this if you need validation or emotional support. Judge does not care about your feelings. It is the mirror nobody asked for.