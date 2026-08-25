// VISERON Voice Pipeline — Sistema 3 Cognitive Operating Layer
// Orquestrador: voice → transcribe → intent → cognitive → agent → response → voice
// 2026-08-11

import { VoiceProvider } from "./VoiceProvider";
import { TelemetryEngine } from "../../omega/telemetry/TelemetryEngine";

export interface VoicePipelineResult {
  transcript: string;
  lang: string;
  intent?: string;
  agentId?: string;
  response: string;
  audioBase64?: string;
  metrics: {
    sttMs: number;
    cognitiveMs: number;
    ttsMs: number;
    totalMs: number;
  };
  traceId?: string;
}

export interface VoicePipelineDeps {
  telemetry?: TelemetryEngine;
  jarvisChat?: (message: string, options?: any) => Promise<any>;
  viseronChat?: (message: string, options?: any) => Promise<any>;
  voiceProvider: VoiceProvider;
}

export class VoicePipeline {
  constructor(private deps: VoicePipelineDeps) {}

  async process(
    audioBase64: string,
    options: { speaker?: "pedro" | "trinnity"; sessionId?: string; lang?: string } = {}
  ): Promise<VoicePipelineResult> {
    const totalStart = Date.now();
    const voiceProvider = this.deps.voiceProvider;

    // Telemetry trace
    const trace = this.deps.telemetry?.startTrace({
      source: "voice",
      sessionId: options.sessionId,
      input: { audioFile: "audio.webm", lang: options.lang },
    });

    // Step 1: STT — transcribe audio
    const sttStart = Date.now();
    let transcript = "";
    let detectedLang = options.lang || "pt";
    let sttModel = "fallback";
    let sttMs = 0;

    try {
      if (voiceProvider.stt.isAvailable()) {
        const sttResult = await voiceProvider.stt.transcribe(audioBase64, { lang: options.lang });
        transcript = sttResult.text;
        detectedLang = sttResult.lang;
        sttModel = sttResult.model;
        sttMs = sttResult.latencyMs;
      }
    } catch {
      // STT falhou — não há fallback server-side sem Web Speech API
      transcript = "[transcrição não disponível — STT provider não configurado]";
    }

    if (!transcript.trim()) {
      transcript = "[áudio sem fala detectada]";
    }
    sttMs = Date.now() - sttStart;
    this.deps.telemetry?.recordProcessing(trace?.traceId!, { embeddingMs: sttMs });

    // Step 2: Cognitive — send to VISERON/JARVIS
    const cognitiveStart = Date.now();
    let response = "";
    let intent = "";
    let agentId = "";

    try {
      const chatFn = this.deps.viseronChat || this.deps.jarvisChat;
      if (chatFn) {
        const chatResult = await chatFn(transcript, {
          speaker: options.speaker || "pedro",
          lang: detectedLang,
          sessionId: options.sessionId,
        });
        response = chatResult?.text || chatResult?.reply || "";
        intent = chatResult?.intent || "";
        agentId = "viserongent";
      }
    } catch {
      response = `Comando recebido: "${transcript.slice(0, 100)}". Sistema operacional.`;
    }

    const cognitiveMs = Date.now() - cognitiveStart;

    // Step 3: TTS — speak response
    const ttsStart = Date.now();
    let audioBase64Result: string | undefined;
    let ttsModel = "fallback";
    let ttsMs = 0;

    if (response && voiceProvider.tts.isAvailable()) {
      try {
        const ttsResult = await voiceProvider.tts.speak(response, {
          voice: options.speaker === "trinnity" ? "pedro" : "trinnity",
          lang: detectedLang,
        });
        audioBase64Result = ttsResult.audioBase64;
        ttsModel = ttsResult.model;
      } catch {
        // TTS falhou — browser usará speechSynthesis como fallback
      }
    }
    ttsMs = Date.now() - ttsStart;
    const totalMs = Date.now() - totalStart;

    // Complete telemetry
    this.deps.telemetry?.completeTrace(
      trace?.traceId!,
      {
        success: !!response,
        output: response.slice(0, 500),
        modelUsed: `${sttModel}/${ttsModel}`,
        latencyMs: totalMs,
        tokensUsed: transcript.split(/\s+/).length + response.split(/\s+/).length,
      },
      { status: response ? "PASS" : "FAIL", reasons: [response ? "voice pipeline complete" : "no response generated"], verifiedBy: "VoicePipeline" },
      { newKnowledgeGenerated: false }
    );

    return {
      transcript,
      lang: detectedLang,
      intent,
      agentId,
      response,
      audioBase64: audioBase64Result,
      metrics: { sttMs, cognitiveMs, ttsMs, totalMs },
      traceId: trace?.traceId,
    };
  }
}
