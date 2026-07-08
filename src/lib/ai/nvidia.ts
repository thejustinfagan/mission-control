// NVIDIA NIM client — OpenAI-compatible chat completions at integrate.api.nvidia.com.
// Requires NVIDIA_API_KEY in environment. Never log or commit the key.

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "meta/llama-3.1-8b-instruct";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NvidiaChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Override API key (defaults to process.env.NVIDIA_API_KEY). */
  apiKey?: string;
}

export function getNvidiaApiKey(): string | undefined {
  return process.env.NVIDIA_API_KEY?.trim() || undefined;
}

export function isNvidiaConfigured(): boolean {
  return Boolean(getNvidiaApiKey());
}

export async function nvidiaChat(
  messages: ChatMessage[],
  options: NvidiaChatOptions = {}
): Promise<string> {
  const apiKey = options.apiKey ?? getNvidiaApiKey();
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }

  const res = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model ?? process.env.NVIDIA_MODEL ?? DEFAULT_MODEL,
      messages,
      max_tokens: options.maxTokens ?? 1200,
      temperature: options.temperature ?? 0.3,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NVIDIA API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("NVIDIA API returned empty response");
  }
  return content;
}
