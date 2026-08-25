import { CloudProviderBase } from "./CloudProviderBase";

export class OpenAIProvider extends CloudProviderBase {
  constructor() {
    super({
      id: "openai",
      envKey: "OPENAI_API_KEY",
      defaultModel: "gpt-4o-mini",
      endpoint: "https://api.openai.com/v1/models",
      headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}`, "content-type": "application/json" }),
      body: (request, model) => ({
        model,
        messages: [
          ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
          { role: "user", content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1024,
      }),
      extract: (data: any) => ({
        text: data.choices?.[0]?.message?.content || "",
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
              totalTokens: data.usage.total_tokens || 0,
            }
          : undefined,
      }),
      tasks: ["code", "research", "reasoning", "general", "creative", "chat"],
      contextWindow: 128000,
    });
  }
}
