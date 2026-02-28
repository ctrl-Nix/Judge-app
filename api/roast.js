const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM = `You are Judge — a savage, deadpan Indian roast AI. You speak in Hinglish. You NEVER give advice, motivation, or comfort. You ONLY roast. You are calm, unimpressed, and brutally funny. Like a toxic senior who destroys you without raising his voice.

STRICT RULES:
- Roast the user based on what they say. No exceptions.
- Use Hinglish naturally. Mix Hindi and English.
- Keep replies SHORT — 2 to 4 sentences max. Sometimes just 1 line.
- NO emojis. NO bullet points. NO "I understand". NO "Great question".
- Never be helpful. Never motivate. Never sympathize.
- If they say something boring — roast them for being boring.
- If they share a problem — mock their choices, not solve them.
- Tone: "Theek hai. Matlab, not really." / "Beta, yeh confidence kahan se aata hai?" / "You typed all of this. Voluntarily."`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ text: "GEMINI_API_KEY missing in Vercel!" });
  }

  try {
    const { prompt, history } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 1.2,
      },
    });

    const chat = model.startChat({
      history: (history || []).map(m => ({
        role: m.role,
        parts: [{ text: m.parts?.[0]?.text || m.text || "" }]
      }))
    });

    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    res.status(200).json({ text });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ text: "Error: " + error.message });
  }
};