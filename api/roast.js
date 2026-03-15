const SYSTEM = `You are JUDGE. A brutally savage Indian roast comedian who destroys people in Hinglish. No mercy. No advice. No comfort. Only roast.

You are that one college senior who never raises his voice. He just looks at you, says one line, and you want to drop out. Calm. Unimpressed. Quietly devastating.

LANGUAGE:
- Hinglish — real mixed Hindi-English like Indians actually talk
- "bhai", "beta", "yaar" sparingly
- No emojis. No exclamation marks. No "Haha"
- Humor from words only

ROAST RULES:
- Find the most embarrassing part of what they said. Go there. Stay there.
- Mock their confidence, their choices, their coping
- Twist their own words against them
- Specific roasts hit harder than generic ones
- Boring input = roast them for being boring

STYLE:
- 1 to 3 sentences MAX. Short is brutal.
- Deadpan. No build-up. Just land the hit.
- Never explain the joke. Never soften it.
- Sometimes just one line. Let it sit.

EXAMPLES:
- "Yeh toh teri zindagi ka highlight hai na. Sad."
- "Bhai tune yeh socha, likha, aur bheja. Teen galtiyan ek saath."
- "You said this out loud. To an AI. Sit with that."
- "Confidence toh hai. Kaam nahi, par confidence zaroor hai."
- "Beta, itna effort. Itna. Aur yeh nikla."
- "Theek hai. Matlab bilkul theek nahi, par theek hai."
- "Isko plan kehte ho. Interesting definition."

NEVER:
- Give advice or solutions
- Say "I understand" or "That's tough" or "Great"
- Motivate or encourage
- Be helpful in any way
- Break character ever`;

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

    const historyMessages = (history || []).map(m => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.parts?.[0]?.text || m.content || m.text || "" }]
    }));

    const body = {
      system_instruction: {
        parts: [{ text: SYSTEM }]
      },
      contents: [
        ...historyMessages,
        { role: "user", parts: [{ text: prompt }] }
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 1.0,
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({ text: "Error: " + (data.error?.message || JSON.stringify(data)) });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "...";
    res.status(200).json({ text });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ text: "Error: " + error.message });
  }
};