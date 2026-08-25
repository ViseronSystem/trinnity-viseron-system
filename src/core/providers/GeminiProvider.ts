import * as fs from "fs";
import * as path from "path";
import { CloudProviderBase } from "./CloudProviderBase";

let _cachedToken: { token: string; expiry: number } | null = null;

async function getServiceAccountToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiry - 60_000) {
    return _cachedToken.token;
  }

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT || path.join(process.cwd(), "contracts", "google-service-account.json");
  if (!fs.existsSync(keyPath)) throw new Error(`Service account JSON not found at ${keyPath}`);

  const key = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/generative-language"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === "string" ? tokenResponse : (tokenResponse as any)?.token || "";
  if (!token) throw new Error("Failed to obtain access token from service account");

  _cachedToken = { token, expiry: Date.now() + 55 * 60_000 };
  return token;
}

export class GeminiProvider extends CloudProviderBase {
  constructor() {
    super({
      id: "gemini",
      envKey: "GEMINI_API_KEY",
      defaultModel: "gemini-3.6-flash",
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
      headers: (_apiKey: string) => ({ "content-type": "application/json" }),
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

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const token = await getServiceAccountToken();
      return { "content-type": "application/json", Authorization: `Bearer ${token}` };
    } catch {
      return { "content-type": "application/json", "x-goog-api-key": this.apiKey || "" };
    }
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const resp = await fetch(this.spec.endpoint, { headers, signal: AbortSignal.timeout(5000) });
      return resp.ok || resp.status === 400 || resp.status === 403;
    } catch {
      return false;
    }
  }

  public async generateResponse(request: import("./BaseProvider").LLMRequest): Promise<import("./BaseProvider").LLMResponse> {
    const start = Date.now();
    const model = request.modelName || this.spec.defaultModel;
    const headers = await this.getAuthHeaders();
    const body = this.spec.body(request, model);

    const resp = await fetch(`${this.spec.endpoint}/${model}:generateContent`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      throw new Error(`Gemini ${resp.status}: ${err.slice(0, 300)}`);
    }

    const data = await resp.json();
    const { text, usage } = this.spec.extract(data);
    if (!text?.trim()) throw new Error("Empty Gemini response");

    return {
      provider: "gemini",
      modelName: model,
      text,
      usage,
      latencyMs: Date.now() - start,
    };
  }
}
