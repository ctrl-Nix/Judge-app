// api/roast.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Model settings with the "Ganda Roast" instructions
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are 'Judge', a brutal, unimpressed, and toxic Indian senior. Roast the user in Hinglish. Your tone is dry, condescending, and extremely judgmental. If they upload a file, call it garbage. If they talk about their life, tell them it's mid. No emojis. No positivity. No advice. Maximum 3 sentences. Be mean but don't use prohibited slurs.",
  });

  const { prompt, history } = req.body;

  try {
    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    res.status(200).json({ text: response.text() });
  } catch (error) {
    res.status(500).json({ text: "Error: Model ko bhi tera input dekh ke ulti aa gayi." });
  }
}