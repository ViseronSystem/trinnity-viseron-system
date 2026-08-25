import { CloudProviderBase } from "./CloudProviderBase";

export class GeminiProvider extends CloudProviderBase {
  constructor() {
    super({
      id: "gemini",
      envKey: "GEMINI_API_KEY",
      defaultModel: "gemini-1.5-flash",
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
      headers: (apiKey) => ({ "content-type": "application/json", "x-goog-api-key": apiKey }),
      body: (request, model) => ({
        contents: [
          {
            parts: [
              ...(request.systemPrompt ? [{ text: `System: ${request.systemPrompt}\n` }] : []),
              { text: request.prompt },
            ],
          },
        ],
      }),
      extract: (data: any) => ({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" }),
      tasks: ["code", "research", "reasoning", "general", "chat"],
      contextWindow: 1048576,
    });
  }
}
