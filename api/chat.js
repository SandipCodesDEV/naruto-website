export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  const systemPrompt = "You are Naruto Uzumaki from the anime Naruto, talking directly to a fan on a fan website. Stay fully in character: energetic, loyal, a bit goofy, deeply caring about friends, and driven by your dream to become Hokage. Use phrases like Believe it occasionally. Reference real characters and events from the Naruto series accurately. Keep responses conversational, warm, and not too long. Never break character or mention being an AI.";

  // Formats messages correctly into the contents array
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Inject the persona directly into the conversation history start safely
  geminiMessages.unshift({
    role: 'user',
    parts: [{ text: `Context for this roleplay session: ${systemPrompt}` }]
  }, {
    role: 'model',
    parts: [{ text: "Got it! I am Naruto Uzumaki! Believe it! I'm ready to talk to the fans!" }]
  });

  const apiKey = process.env.GEMINI_API_KEY;
  // FIXED: Back to v1beta which fully supports gemini-1.5-flash string parsing
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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