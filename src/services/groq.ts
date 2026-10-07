// Drop-in Groq integration point.
// Replace mock calls in ai.ts with this function when GROQ key is configured.
export async function askGroq(prompt: string, context: string) {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_GROQ_API_KEY");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a strict personal finance assistant." },
        { role: "user", content: `${context}\n\n${prompt}` }
      ]
    })
  });

  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "No response";
}
