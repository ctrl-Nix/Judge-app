import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messages, system } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: system,
    });

    // Convert messages format from Anthropic style → Gemini style
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: Array.isArray(m.content)
        ? m.content.map(c => {
            if (c.type === 'text') return { text: c.text };
            if (c.type === 'image') return {
              inlineData: { mimeType: c.source.media_type, data: c.source.data }
            };
            return { text: '[file]' };
          })
        : [{ text: m.content }]
    }));

    const lastMsg = messages[messages.length - 1];
    const lastParts = Array.isArray(lastMsg.content)
      ? lastMsg.content.map(c => {
          if (c.type === 'text') return { text: c.text };
          if (c.type === 'image') return {
            inlineData: { mimeType: c.source.media_type, data: c.source.data }
          };
          return { text: '[file]' };
        })
      : [{ text: lastMsg.content }];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastParts);
    const text = result.response.text();

    // Return in same shape the frontend expects
    res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}