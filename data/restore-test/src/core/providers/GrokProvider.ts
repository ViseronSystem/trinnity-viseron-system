import { CloudProviderBase } from "./CloudProviderBase";

export class GrokProvider extends CloudProviderBase {
  constructor() {
    super({
      id: "grok",
      envKey: "XAI_API_KEY",
      defaultModel: "grok-3",
      endpoint: "https://api.x.ai/v1/models",
      headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}`, "content-type": "application/json" }),
      body: (request, model) => ({
        model,
        messages: [
          ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
          { role: "user", content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
      }),
      extract: (data: any) => ({ text: data.choices?.[0]?.message?.content || "" }),
      tasks: ["research", "creative", "reasoning", "chat"],
      contextWindow: 131072,
    });
  }
}
