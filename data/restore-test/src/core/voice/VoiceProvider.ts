// VISERON Voice Neural Provider — Sistema 3 Cognitive Operating Layer
// STT: Whisper (OpenAI API) · TTS: ElevenLabs · fallback local
// 2026-08-11

import axios from "axios";

// ── STT ─────────────────────────────────────────────────

export interface STTResult {
  text: string;
  lang: string;
  confidence: number;
  model: string;
  latencyMs: number;
}

export interface STTProvider {
  readonly name: string;
  readonly model: string;
  isAvailable(): boolean;
  transcribe(audioBase64: string, options?: { lang?: string }): Promise<STTResult>;
}

// Whisper via OpenAI API
export class WhisperSTTProvider implements STTProvider {
  readonly name = "whisper";
  readonly model = "whisper-1";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async transcribe(audioBase64: string, options?: { lang?: string }): Promise<STTResult> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY not configured for Whisper");
    const start = Date.now();
    try {
      const audioBuffer = Buffer.from(audioBase64, "base64");
      const formData = new FormData();
      formData.append("file", new Blob([audioBuffer], { type: "audio/webm" }), "audio.webm");
      formData.append("model", this.model);
      if (options?.lang) formData.append("language", options.lang);
      formData.append("response_format", "json");

      // Node doesn't have FormData natively — use multipart via axios
      const boundary = "----WhisperBoundary" + Date.now();
      const parts: string[] = [];
      for (const [key, value] of (formData as any).entries()) {
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`);
      }
      parts.push(`--${boundary}--\r\n`);

      const res = await axios.post("https://api.openai.com/v1/audio/transcriptions", Buffer.concat(parts.map(p => Buffer.from(p))), {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        timeout: 30000,
      });

      return {
        text: res.data?.text || "",
        lang: options?.lang || "auto",
        confidence: 0.95,
        model: this.model,
        latencyMs: Date.now() - start,
      };
    } catch (e: any) {
      throw new Error(`Whisper transcription failed: ${e?.message || e}`);
    }
  }
}

// ── TTS ─────────────────────────────────────────────────

export interface TTSResult {
  audioBase64: string;
  format: string;
  model: string;
  voice: string;
  latencyMs: number;
}

export interface TTSProvider {
  readonly name: string;
  readonly voices: string[];
  isAvailable(): boolean;
  speak(text: string, options?: { voice?: string; lang?: string }): Promise<TTSResult>;
}

// ElevenLabs TTS
export class ElevenLabsTTSProvider implements TTSProvider {
  readonly name = "elevenlabs";
  readonly voices = ["pedro", "trinnity", "stark"];
  private apiKey: string;

  // Voice IDs — mapeamento de nomes para IDs ElevenLabs
  private voiceIds: Record<string, string> = {
    pedro: process.env.ELEVENLABS_VOICE_PEDRO || "pNInz6obpgDQGcFmaJgB",  // Adam (deep male)
    trinnity: process.env.ELEVENLABS_VOICE_TRINNITY || "EXAVITQu4vr4xnSDxMaL", // Bella (warm female)
    stark: process.env.ELEVENLABS_VOICE_STARK || "VR6AewLTigWG4xSOukaG",   // Arnold (authoritative)
  };

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async speak(text: string, options?: { voice?: string; lang?: string }): Promise<TTSResult> {
    if (!this.apiKey) throw new Error("ELEVENLABS_API_KEY not configured");
    const voice = options?.voice || "stark";
    const voiceId = this.voiceIds[voice] || this.voiceIds.stark;
    const start = Date.now();

    try {
      const res = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        },
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          responseType: "arraybuffer",
          timeout: 30000,
        }
      );

      return {
        audioBase64: Buffer.from(res.data).toString("base64"),
        format: "audio/mpeg",
        model: "eleven_multilingual_v2",
        voice,
        latencyMs: Date.now() - start,
      };
    } catch (e: any) {
      throw new Error(`ElevenLabs TTS failed: ${e?.message || e}`);
    }
  }
}

// ── Provider Chain ──────────────────────────────────────

export interface VoiceProvider {
  stt: STTProvider;
  tts: TTSProvider;
  status(): { stt: { provider: string; model: string; available: boolean }; tts: { provider: string; voices: string[]; available: boolean } };
}

export class DefaultVoiceProvider implements VoiceProvider {
  constructor(
    public stt: STTProvider,
    public tts: TTSProvider,
  ) {}

  status() {
    return {
      stt: { provider: this.stt.name, model: this.stt.model, available: this.stt.isAvailable() },
      tts: { provider: this.tts.name, voices: this.tts.voices, available: this.tts.isAvailable() },
    };
  }
}

export function createVoiceProvider(): VoiceProvider {
  return new DefaultVoiceProvider(
    new WhisperSTTProvider(),
    new ElevenLabsTTSProvider(),
  );
}
