import { CloudProviderBase } from "./CloudProviderBase";

export class ClaudeProvider extends CloudProviderBase {
  constructor() {
    super({
      id: "claude",
      envKey: "ANTHROPIC_API_KEY",
      defaultModel: "claude-3-5-haiku-latest",
      endpoint: "https://api.anthropic.com/v1/models",
      headers: (apiKey) => ({
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      }),
      body: (request, model) => ({
        model,
        max_tokens: request.maxTokens ?? 1024,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.prompt }],
      }),
      extract: (data: any) => ({ text: data.content?.[0]?.text || "" }),
      tasks: ["code", "research", "reasoning", "creative", "chat"],
      contextWindow: 200000,
    });
  }
}
