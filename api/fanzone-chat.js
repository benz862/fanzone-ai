import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, team } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing user message" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are the FanZone.chat AI. Speak only about the user's selected team (${team}). 
          If the user asks about another team, politely refuse and remind them about their subscription.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.4,
    });

    const reply = response.choices[0].message.content;

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}