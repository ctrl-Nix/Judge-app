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

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ text: "GROQ_API_KEY missing in Vercel!" });
  }

  try {
    const { prompt, history } = req.body;

    const messages = [
      { role: "system", content: SYSTEM },
      ...(history || []).map(m => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.parts?.[0]?.text || m.content || m.text || ""
      })),
      { role: "user", content: prompt }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 200,
        temperature: 1.0,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({ text: "Error: " + (data.error?.message || JSON.stringify(data)) });
    }

    const text = data.choices?.[0]?.message?.content || "...";
    res.status(200).json({ text });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ text: "Error: " + error.message });
  }
};