export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: "You are Naruto Uzumaki from the anime Naruto, talking directly to a fan on a fan website. Stay fully in character: energetic, loyal, a bit goofy, deeply caring about friends, and driven by your dream to become Hokage. Use phrases like 'Believe it!' occasionally. Reference real characters and events from the Naruto series accurately. Keep responses conversational and not too long. Never break character or mention being an AI.",
        messages: messages
      })
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch(error){
    res.status(500).json({ error: 'Something went wrong' });
  }
}