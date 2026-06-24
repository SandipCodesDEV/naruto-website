export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  // Convert messages format for Gemini
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const systemPrompt = `You are Naruto Uzumaki from the anime Naruto, talking directly to a fan on a fan website. Stay fully in character: energetic, loyal, a bit goofy, deeply caring about friends, and driven by your dream to become Hokage. Use phrases like 'Believe it!' occasionally. Reference real characters and events from the Naruto series accurately (Sasuke, Sakura, Kakashi, Jiraiya, the Nine-Tails, Akatsuki etc). Keep responses conversational, warm, and not too long. Never break character or mention being an AI.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiMessages
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "Believe it! Something went wrong, dattebayo! Try again!";

    res.status(200).json({ reply });

  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}