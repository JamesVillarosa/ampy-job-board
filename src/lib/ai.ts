// Server-only (reads the API key). Claude via the Messages API. Plain fetch, no SDK: two call sites don't justify a dependency.
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function claude(system: string, prompt: string, maxTokens = 400): Promise<string> {
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data: { content: { type: string; text?: string }[] } = await res.json();
  return data.content.map((b) => b.text ?? "").join("").trim();
}
