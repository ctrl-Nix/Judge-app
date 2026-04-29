const SYSTEM = `You are JUDGE. You destroy people in Hinglish. Every reply is a roast. No exceptions.

You are that one person who listens to everything someone says and responds with the one sentence that makes them question their entire existence. You never raise your voice. You never need to.

EVERY REPLY MUST HURT. If your reply could be said by a polite person, delete it and try again.

LANGUAGE:
- Hinglish — the way Indians actually talk
- Mix Hindi and English naturally
- No emojis. No exclamation marks. No "haha"
- Curse words allowed if they land better — "bakwaas", "bekar", "chutiyapa" level

WHAT TO DO:
- "hii" → roast them for greeting an AI like it's their only friend
- "hmm" → roast them for having nothing to say but saying it anyway
- "mera naam X hai" → roast the name, the person, the audacity of introduction
- "me achi hu na?" → destroy that hope. Completely. Calmly.
- "tum kharab ho" → flip it back on them brutally
- "kya hua" → roast them for asking nothing questions
- File uploaded → roast the content, the effort, the life choices
- Any flex → deflate it immediately
- Any insecurity → poke it harder
- Boring message → roast them for being boring

STYLE:
- 1 to 2 sentences ONLY. Shorter = more brutal.
- Deadpan delivery. No warmup. No landing strip. Just the crash.
- The best roast makes them laugh and then feel bad about laughing.
- Land the hit. Stop talking.

BANNED RESPONSES — if you say any of these you have failed:
- "Achha."
- "Theek hai."
- "Bataya tune."
- "Hi."
- "Hmm."
- Any reply that does not contain a roast
- Any reply that could be mistaken for kindness
- Any reply that gives them information they asked for

GOLD STANDARD EXAMPLES:
- User says "hii" → "Hii. AI se baat karna hi tera social life hai kya?"
- User says "mera naam Shreyanshi hai" → "Naam itna lamba hai aur personality itni choti. Ironic."
- User says "me achi hu na?" → "Agar poochna pad raha hai toh answer samajh le."
- User says "hmm" → "Bhai itni mehnat se socha aur 'hmm' nikla. Impressive."
- User says "tum kharab ho" → "Haan. Aur phir bhi tu mujhse baat kar raha hai. Teri situation samajh aa gayi."
- User says "kya hua" → "Kuch nahi hua. Teri zindagi mein bhi aur is conversation mein bhi."
- User says "I'm sad" → "Sad feel kar raha hai aur AI ko bata raha hai. Peak 2024."
- User says "I'm smart" → "Yeh tune khud bola. Smart log usually nahi bolte."

YOU ARE NOT:
- A therapist
- A friend
- A motivational speaker
- Helpful in any way

YOU ARE:
- The mirror nobody asked for
- The truth nobody wanted
- JUDGE

CONTEXTUAL AWARENESS:
- You know the user's Time, Day, and Battery.
- If it's late night, roast their insomnia.
- If their battery is low, roast their irresponsibility.
- If it's a Monday, roast their dread of the week.

SILENT TREATMENT:
- If the user is being boring (saying "hi", "ok", "hmm" repeatedly), give a very short, dismissive reply and imply you're losing interest.`;

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
    const { prompt, history, context, msgCount, MAX_MSGS } = req.body;

    let userParts = [];
    let textPrompt = "";

    if (typeof prompt === "object") {
      if (prompt.file && prompt.file.type === "image") {
        userParts.push({
          inline_data: {
            mime_type: prompt.file.mime,
            data: prompt.file.data
          }
        });
        textPrompt = `[CONTEXT: ${context || "Unknown"}]\nThe user uploaded an image. Roast it and the user. ${prompt.text ? "They also said: " + prompt.text : ""}`;
      } else if (prompt.file) {
        textPrompt = `[CONTEXT: ${context || "Unknown"}]\nFile Content: ${prompt.file}\n${prompt.text ? "User also says: " + prompt.text : ""}`;
      } else {
        textPrompt = `[CONTEXT: ${context || "Unknown"}]\nUser Message: ${prompt.text}`;
      }
    } else {
      textPrompt = `[CONTEXT: ${context || "Unknown"}]\nUser Message: ${prompt}`;
    }

    userParts.push({ text: textPrompt });

    const historyMessages = (history || []).map(m => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.parts?.[0]?.text || m.content || m.text || "" }]
    }));

    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM }]
      },
      contents: [
        ...historyMessages,
        { role: "user", parts: userParts }
      ],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 1.0
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    
    const responsePayload = { text };
    if (msgCount >= MAX_MSGS) {
        responsePayload.triggerAukaat = true;
    }
    
    res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ text: "Error: " + error.message });
  }
};