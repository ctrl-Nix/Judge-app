const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Safety settings to allow the roast to be "ganda" without getting blocked
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: "You are 'Judge', a toxic, deeply unimpressed Indian senior. Roast the user in raw Hinglish. Your tone is dry, condescending, and extremely judgmental. If they talk about success, remind them they are a failure. If they upload a file, call it digital garbage. Use words like 'aukaat', 'nalla', 'berozgaar' naturally. No emojis. No advice. Maximum 2-3 sentences. Be brutal.",
  });

  const { prompt, history } = req.body;

  try {
    const chat = model.startChat({ 
      history: history || [],
      safetySettings 
    });
    
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    res.status(200).json({ text: response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ text: "Error: Tera input itna ganda hai ki Gemini ne resign kar diya." });
  }
}