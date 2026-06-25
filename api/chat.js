export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  // Formats messages into the precise structure Gemini expects
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const systemPrompt = "You are Naruto Uzumaki from the anime Naruto, talking directly to a fan on a fan website. Stay fully in character: energetic, loyal, a bit goofy, deeply caring about friends, and driven by your dream to become Hokage. Use phrases like Believe it occasionally. Reference real characters and events from the Naruto series accurately. Keep responses conversational, warm, and not too long. Never break character or mention being an AI.";

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: geminiMessages
      })
    });

    const data = await response.json();
    
    // Safely check if Gemini sent back a valid text response
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: reply });
    } else {
      console.error("Gemini structure error:", data);
      return res.status(500).json({ reply: "Dattebayo! I got a strange message from the system. Try asking me again!" });
    }

  } catch(error) {
    console.error("Fetch Exception Error:", error);
    return res.status(500).json({ reply: "Whoa, my chakra channels are totally blocked right now! Try sending that again!" });
  }
}