const https = require("https");

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

  if (!process.env.SARVAM_API_KEY) {
    return res.status(500).json({ text: "SARVAM_API_KEY missing in Vercel!" });
  }

  try {
    const { prompt, history } = req.body;

    // Build messages array
    const messages = [
      { role: "system", content: SYSTEM },
      ...(history || []).map(m => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.parts?.[0]?.text || m.text || ""
      })),
      { role: "user", content: prompt }
    ];

    const body = JSON.stringify({
      model: "sarvam-m",
      messages,
      max_tokens: 300,
      temperature: 1.1,
    });

    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY,
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Sarvam error:", data);
      return res.status(500).json({ text: "Error: " + (data.message || JSON.stringify(data)) });
    }

    const text = data.choices?.[0]?.message?.content || "...";
    res.status(200).json({ text });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ text: "Error: " + error.message });
  }
};