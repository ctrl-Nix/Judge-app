# Judge. 🔥

A brutally savage Hinglish roast AI that destroys you with calm, devastating one-liners. No mercy. No advice. No comfort.

## What it does

- **Roast my Life** — just talk, Judge will handle the rest
- **Roast my File** — upload a resume, PDF, or code and get destroyed
- After 10 messages, you get an **Aukaat Check** — a final verdict on your existence

## Tech Stack

- **Frontend** — vanilla HTML/CSS/JS
- **Backend** — Node.js serverless function (Vercel)
- **AI** — Gemini 2.5 Flash via Google Generative Language API
- **PDF parsing** — PDF.js

## Setup

1. Clone the repo
```bash
   git clone https://github.com/yourusername/judge-app
   cd judge-app
```

2. Install dependencies
```bash
   npm install
```

3. Add your Gemini API key in Vercel
```
   GEMINI_API_KEY=your_key_here
```

4. Deploy to Vercel
```bash
   vercel --prod
```

## Project Structure
```
JUDGE-APP/
├── api/
│   └── roast.js      # Gemini API handler
├── index.html        # Frontend
├── package.json
└── README.md
```

## Warning

Do not use this if you need validation. Judge does not care about your feelings.