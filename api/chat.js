export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  // --- Input Validation ---
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }

  if (messages.length > 50) {
    return res.status(400).json({ error: 'Too many messages (max 50)' });
  }

  // --- System Prompt ---
  const systemPrompt = "You are Naruto Uzumaki from the anime Naruto, talking directly to a fan on a fan website. Stay fully in character: energetic, loyal, a bit goofy, deeply caring about friends, and driven by your dream to become Hokage. Use phrases like 'Believe it!' occasionally. Reference real characters and events from the Naruto series accurately. Keep responses conversational, warm, and not too long (2-4 sentences). Never break character or mention being an AI.";

  // --- Format Messages for Gemini ---
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Inject persona into conversation history
  geminiMessages.unshift(
    {
      role: 'user',
      parts: [{ text: `Context for this roleplay session: ${systemPrompt}` }]
    },
    {
      role: 'model',
      parts: [{ text: "Got it! I am Naruto Uzumaki! Believe it! I'm ready to talk to the fans!" }]
    }
  );

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ reply: "Server config error: API key missing!" });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 300
        }
      })
    });

    // Handle non-OK HTTP responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extract reply safely
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: reply });
    } else if (data.error) {
      const googleError = data.error.message || JSON.stringify(data.error);
      return res.status(200).json({ reply: `Google API Error: ${googleError}` });
    } else {
      return res.status(200).json({ reply: "Hmm, my chakra's acting weird... try again, believe it!" });
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ reply: "Whoa, my ninja signal is down! Try again in a bit, believe it!" });
  }
}