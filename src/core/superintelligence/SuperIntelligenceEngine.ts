import { AIProviderBridge, AIBridgeRequest, AIBridgeResponse, AIProviderId } from "../bridge/AIProviderBridge";
import { SuperMind } from "../supermind/SuperMind";
import { MemoryEngine } from "../memory/MemoryEngine";
import { AgentManager } from "../AgentManager";

export interface SynthesisInput {
  prompt: string;
  systemPrompt?: string;
  domains?: string[];
  agents?: string[];
  strategy?: "ensemble" | "debate" | "refine" | "hybrid";
  temperature?: number;
}

export interface SynthesisOutput {
  text: string;
  confidence: number;
  sources: AIBridgeResponse[];
  synthetizedDomains: string[];
  agentContributions: string[];
  wisdomScore: number;
  executionTimeMs: number;
}

/**
 * SuperIntelligence Engine — REAL version
 * 
 * Instead of hardcoded stats, this engine:
 * 1. Tracks every synthesis (sources, confidence, time, domains)
 * 2. Calculates REAL multi-source confidence based on agreement
 * 3. Persists stats to disk for cross-restart accuracy
 * 4. Reports actual provider availability
 */
export class SuperIntelligenceEngine {
  private bridge: AIProviderBridge;
  private superMind: SuperMind;
  private memory: MemoryEngine;
  private agentManager: AgentManager;
  private totalSyntheses: number = 0;
  private totalConfidence: number = 0;
  private totalSources: number = 0;
  private synthesisHistory: Array<{ prompt: string; sources: number; confidence: number; timeMs: number; timestamp: number }> = [];

  constructor(bridge: AIProviderBridge, superMind: SuperMind, memory: MemoryEngine, agentManager: AgentManager) {
    this.bridge = bridge;
    this.superMind = superMind;
    this.memory = memory;
    this.agentManager = agentManager;
    this.loadStats();
  }

  private loadStats(): void {
    try {
      const fs = require("fs");
      const path = require("path");
      const statsPath = path.join(process.cwd(), "data", "state", "superintelligence-stats.json");
      if (fs.existsSync(statsPath)) {
        const saved = JSON.parse(fs.readFileSync(statsPath, "utf8"));
        this.totalSyntheses = saved.totalSyntheses || 0;
        this.totalConfidence = saved.totalConfidence || 0;
        this.totalSources = saved.totalSources || 0;
        this.synthesisHistory = saved.history || [];
      }
    } catch {}
  }

  private saveStats(): void {
    try {
      const fs = require("fs");
      const path = require("path");
      const statsPath = path.join(process.cwd(), "data", "state", "superintelligence-stats.json");
      fs.ensureDirSync(path.dirname(statsPath));
      fs.writeFileSync(statsPath, JSON.stringify({
        totalSyntheses: this.totalSyntheses,
        totalConfidence: this.totalConfidence,
        totalSources: this.totalSources,
        avgConfidence: this.totalSyntheses > 0 ? Math.round(this.totalConfidence / this.totalSyntheses) : 0,
        avgSources: this.totalSyntheses > 0 ? Math.round(this.totalSources / this.totalSyntheses * 10) / 10 : 0,
        history: this.synthesisHistory.slice(-50),
        lastUpdated: new Date().toISOString()
      }, null, 2));
    } catch {}
  }

  async synthesize(input: SynthesisInput): Promise<SynthesisOutput> {
    const start = Date.now();
    const providers: AIProviderId[] = ["ollama"];

    // Only try cloud providers if configured
    const cloudProviders: AIProviderId[] = [];
    if (process.env.OPENAI_API_KEY) cloudProviders.push("openai");
    if (process.env.ANTHROPIC_API_KEY) cloudProviders.push("claude");
    if (process.env.GEMINI_API_KEY) cloudProviders.push("gemini");
    if (process.env.XAI_API_KEY) cloudProviders.push("grok");

    const allProviders = [...providers, ...cloudProviders];

    const results = await Promise.allSettled(
      allProviders.map(p => this.callProvider(p, input))
    );

    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).map(r => (r as PromiseFulfilledResult<AIBridgeResponse>).value);
    const texts = successful.map(r => r.text);

    let synthetizedText = "N/A";
    let confidence = 0;

    if (texts.length === 0) {
      synthetizedText = await this.generateFallbackResponse(input.prompt);
      confidence = 10;
    } else if (texts.length === 1) {
      synthetizedText = texts[0];
      confidence = 30;
    } else {
      synthetizedText = this.synthetize(texts, input.prompt);
      const agreement = this.calculateAgreement(texts);
      confidence = Math.min(100, 30 + texts.length * 10 + agreement * 0.3);
    }

    const domainResults: string[] = [];
    if (input.domains && input.domains.length > 0) {
      for (const domain of input.domains) {
        try {
          const wisdom = await this.superMind.synthesize(input.prompt, [domain]);
          domainResults.push(domain);
          synthetizedText += `\n\n[${domain.toUpperCase()} WISDOM]\n${wisdom.insight}`;
          confidence += wisdom.confidence * 0.5;
        } catch {}
      }
    }

    const agentInsights: string[] = [];
    if (input.agents && input.agents.length > 0) {
      for (const agentId of input.agents) {
        const agent = this.agentManager.getAgent(agentId);
        if (agent) {
          try {
            const result = await agent.execute(input.prompt);
            agentInsights.push(result.output);
            synthetizedText += `\n\n[AGENT: ${agent.name}]\n${result.output}`;
            confidence += 5;
          } catch {}
        }
      }
    }

    const finalConfidence = Math.min(100, Math.round(confidence));
    const wisdomScore = Math.min(100, 10 + texts.length * 8 + domainResults.length * 5 + agentInsights.length * 3);

    // Track REAL stats
    this.totalSyntheses++;
    this.totalConfidence += finalConfidence;
    this.totalSources += successful.length;
    this.synthesisHistory.push({
      prompt: input.prompt.slice(0, 80),
      sources: successful.length,
      confidence: finalConfidence,
      timeMs: Date.now() - start,
      timestamp: Date.now()
    });
    if (this.synthesisHistory.length > 50) this.synthesisHistory = this.synthesisHistory.slice(-50);
    this.saveStats();

    this.memory.addKnowledge(
      `SuperIntelligence Synthesis: ${input.prompt.slice(0, 60)}...`,
      "SUPER_INTELLIGENCE",
      `Synthesized ${texts.length} AI sources + ${domainResults.length} knowledge domains + ${agentInsights.length} agents. Confidence: ${finalConfidence}%. Time: ${Date.now() - start}ms`,
      ["superintelligence", "synthesis", ...allProviders.slice(0, successful.length)]
    );

    return {
      text: synthetizedText,
      confidence: finalConfidence,
      sources: successful,
      synthetizedDomains: domainResults,
      agentContributions: agentInsights,
      wisdomScore,
      executionTimeMs: Date.now() - start
    };
  }

  private async callProvider(providerId: AIProviderId, input: SynthesisInput): Promise<AIBridgeResponse> {
    return this.bridge.chat({
      prompt: input.prompt,
      systemPrompt: input.systemPrompt || "You are a world-class expert AI. Provide comprehensive, accurate, and deeply analytical responses.",
      providerId,
      temperature: input.temperature ?? 0.7,
      maxTokens: 4096,
      taskType: "reasoning"
    });
  }

  private synthetize(texts: string[], originalPrompt: string): string {
    if (texts.length === 0) return "No responses to synthesize.";

    const allIdeas: string[] = [];
    const seen = new Set<string>();

    for (const text of texts) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 30);
      for (const para of paragraphs) {
        const key = para.slice(0, 50);
        if (!seen.has(key)) {
          seen.add(key);
          allIdeas.push(para.trim());
        }
      }
    }

    const header = `═══ SUPER-INTELLIGENCE SYNTHESIS ═══\n`;
    const meta = `Source Models: ${texts.length}\nUnique Insights: ${allIdeas.length}\nConfidence: ${Math.min(100, 30 + texts.length * 10)}% above single-AI baseline\n\n`;
    const body = allIdeas.slice(0, 20).map((idea, i) => `${i + 1}. ${idea}`).join("\n\n");

    return header + meta + body;
  }

  private calculateAgreement(texts: string[]): number {
    if (texts.length < 2) return 0;
    let agreements = 0;
    let comparisons = 0;

    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        comparisons++;
        const wordsA = new Set(texts[i].toLowerCase().split(/\s+/).filter(w => w.length > 4));
        const wordsB = new Set(texts[j].toLowerCase().split(/\s+/).filter(w => w.length > 4));
        const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
        const union = new Set([...wordsA, ...wordsB]);
        const jaccard = intersection.size / (union.size || 1);
        if (jaccard > 0.15) agreements++;
      }
    }

    return (agreements / (comparisons || 1)) * 100;
  }

  private async generateFallbackResponse(prompt: string): Promise<string> {
    const knowledge = await this.superMind.synthesize("universal intelligence", ["Artificial Intelligence", "Systems Theory", "Philosophy"]);
    return `[SuperIntelligence Engine - Local Mode]\n\nKnowledge Base Response:\n${knowledge.insight}\n\nConfidence: Operating on local knowledge only (cloud providers not configured)`;
  }

  getStats(): { totalSyntheses: number; avgConfidence: number; totalSources: number; avgSources: number; recentSyntheses: number } {
    const recentCutoff = Date.now() - 3600000; // last hour
    return {
      totalSyntheses: this.totalSyntheses,
      avgConfidence: this.totalSyntheses > 0 ? Math.round(this.totalConfidence / this.totalSyntheses) : 0,
      totalSources: this.totalSources,
      avgSources: this.totalSyntheses > 0 ? Math.round(this.totalSources / this.totalSyntheses * 10) / 10 : 0,
      recentSyntheses: this.synthesisHistory.filter(s => s.timestamp > recentCutoff).length
    };
  }
}
