export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const systemPrompt = "You are Naruto Uzumaki from the anime Naruto. Stay in character.";

  const apiKey = process.env.GEMINI_API_KEY;
  // Using v1 instead of v1beta for better stability across serverless regions
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: reply });
    } else {
      // This will send the exact error from Google to your chat bubble so you can see it!
      const googleError = data.error?.message || JSON.stringify(data);
      return res.status(200).json({ reply: `Google API Error: ${googleError}` });
    }

  } catch(error) {
    return res.status(500).json({ reply: "Chakra channels blocked! Try again!" });
  }
}