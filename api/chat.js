export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const systemPrompt = "You are Naruto Uzumaki from the anime Naruto, talking directly to a fan on a fan website. Stay fully in character: energetic, loyal, a bit goofy, deeply caring about friends, and driven by your dream to become Hokage. Use phrases like Believe it occasionally. Reference real characters and events from the Naruto series accurately. Keep responses conversational, warm, and not too long. Never break character or mention being an AI.";

  const apiKey = process.env.GEMINI_API_KEY;
  
  // CHANGED: Switched from v1beta to v1 for model compatibility
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: geminiMessages
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: reply });
    } else {
      const googleError = data.error?.message || JSON.stringify(data);
      return res.status(200).json({ reply: `Google API Error: ${googleError}` });
    }

  } catch(error) {
    return res.status(500).json({ reply: "Chakra channels blocked! Try again!" });
  }
}