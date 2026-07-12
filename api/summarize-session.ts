import type { VercelRequest, VercelResponse } from "@vercel/node";

async function summarizeSession(name: string, oldMemory: string, transcript: { role: string, text: string }[]): Promise<string> {
  const formattedTranscript = transcript
    .map(t => `${t.role === "user" ? name : "Juno"}: ${t.text}`)
    .join("\n");

  const prompt = `You are a memory-compactor for an AI companion named Juno.
Given the previous memory: "${oldMemory || 'None (New User)'}"
And the new conversation transcript between the user (${name}) and Juno:
${formattedTranscript}

Write a concise, updated summary of what Juno remembers about ${name} (maximum 3 short sentences).
Focus on: preferences, names of friends/family mentioned, favorite subjects, mood/feelings during the talk, or active topics.
Format it like: "Ashley is Mukesh's girlfriend. She likes horror movies and was testing the app. She felt happy."
Do not include metadata like dates, and do not say "Here is the summary" - return ONLY the summary sentences.`;

  // Try Cerebras
  if (process.env.CEREBRAS_API_KEY) {
    try {
      const resp = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3.1-8b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 150
        })
      });
      if (resp.ok) {
        const json: any = await resp.json();
        const content = json.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (e) {
      console.warn("Cerebras summarization failed:", e);
    }
  }

  // Try OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-2-9b-it:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 150
        })
      });
      if (resp.ok) {
        const json: any = await resp.json();
        const content = json.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (e) {
      console.warn("OpenRouter summarization failed:", e);
    }
  }

  // Try Venice AI
  if (process.env.VENICE_API_KEY) {
    try {
      const resp = await fetch("https://api.venice.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.VENICE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 150
        })
      });
      if (resp.ok) {
        const json: any = await resp.json();
        const content = json.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (e) {
      console.warn("Venice AI summarization failed:", e);
    }
  }

  // Fallback
  const userLines = transcript.filter(t => t.role === "user").map(t => t.text);
  if (userLines.length > 0) {
    return `${name} said: "${userLines[userLines.length - 1]}"`;
  }
  return oldMemory || `Spoke with ${name}.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, oldMemory, transcript } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const summary = await summarizeSession(name, oldMemory, transcript);
    res.status(200).json({ summary });
  } catch (err) {
    console.error("Summarization endpoint error:", err);
    res.status(500).json({ error: "Failed to summarize session." });
  }
}
