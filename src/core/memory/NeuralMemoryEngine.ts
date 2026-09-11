// VISERON Neural Memory Engine — Memória cognitiva real com embeddings neurais
// Substitui o MemoryEngine base por um sistema de memória que APRENDE de verdade.
// Cada utilizador tem memória persistente, preferências, e padrões aprendidos.
// © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — VISERON™

import * as fs from "fs-extra";
import * as path from "path";
import { EventEmitter } from "events";
import { createHash } from "crypto";
import { EmbeddingProviderChain, MiniLMEmbeddingProvider, OpenAIEmbeddingProvider, EmbeddingResult } from "./EmbeddingProvider";

// ==========================================
// Types
// ==========================================

export interface UserMemoryProfile {
  userId: string;
  name?: string;
  email?: string;
  preferredLang: string;
  preferredResponseStyle: "concise" | "detailed" | "technical" | "casual";
  interests: string[];
  expertiseLevel: "beginner" | "intermediate" | "advanced" | "expert";
  totalInteractions: number;
  lastInteractionAt: string;
  createdAt: string;
}

export interface ConversationTurn {
  id: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  sentiment?: number; // -1 to 1
  topics: string[];
  embedding?: number[];
  metadata: {
    provider?: string;
    model?: string;
    latencyMs?: number;
    toolCalls?: string[];
    userFeedback?: "positive" | "negative" | "neutral";
  };
}

export interface ConversationSession {
  id: string;
  userId: string;
  turns: ConversationTurn[];
  startedAt: string;
  lastActiveAt: string;
  summary?: string;
  topics: string[];
  totalTokens: number;
}

export interface LearnedPattern {
  id: string;
  userId: string;
  pattern: string;
  type: "preference" | "frequent_topic" | "response_style" | "vocabulary" | "behavior";
  confidence: number; // 0-1
  evidence: number; // how many times observed
  lastSeenAt: string;
  createdAt: string;
}

export interface MemoryStats {
  totalUsers: number;
  totalConversations: number;
  totalTurns: number;
  totalPatterns: number;
  avgTurnsPerConversation: number;
  avgSentiment: number;
  topTopics: { topic: string; count: number }[];
  storageSizeBytes: number;
}

// ==========================================
// NeuralMemoryEngine
// ==========================================

export class NeuralMemoryEngine extends EventEmitter {
  private storageDir: string;
  private embeddings: EmbeddingProviderChain;
  
  // Per-user data
  private userProfiles: Map<string, UserMemoryProfile> = new Map();
  private conversations: Map<string, ConversationSession> = new Map();
  private patterns: LearnedPattern[] = [];
  
  // Global memory (replaces old STM/LTM/KB)
  private globalMemory: ConversationTurn[] = [];
  private maxGlobalMemory = 5000;
  
  // Consolidation
  private consolidationTimer: ReturnType<typeof setInterval> | null = null;

  constructor(storageDir?: string) {
    super();
    this.storageDir = storageDir || path.join(process.cwd(), "data", "neural-memory");
    fs.ensureDirSync(this.storageDir);
    
    // Initialize embedding chain: OpenAI → MiniLM → fallback
    this.embeddings = new EmbeddingProviderChain([
      new OpenAIEmbeddingProvider(),
      new MiniLMEmbeddingProvider(),
    ]);
    
    this.loadAll();
    this.startConsolidation();
  }

  // ==========================================
  // User Profile Management
  // ==========================================

  getOrCreateUserProfile(userId: string, name?: string, email?: string): UserMemoryProfile {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        name,
        email,
        preferredLang: "es",
        preferredResponseStyle: "detailed",
        interests: [],
        expertiseLevel: "intermediate",
        totalInteractions: 0,
        lastInteractionAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.userProfiles.set(userId, profile);
      this.saveUserProfiles();
      this.emit("user:created", { userId });
    }
    return profile;
  }

  updateUserProfile(userId: string, updates: Partial<UserMemoryProfile>): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      Object.assign(profile, updates);
      this.saveUserProfiles();
    }
  }

  // ==========================================
  // Conversation Management
  // ==========================================

  async startConversation(userId: string): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      turns: [],
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      topics: [],
      totalTokens: 0,
    };
    this.conversations.set(session.id, session);
    this.emit("conversation:started", { sessionId: session.id, userId });
    return session;
  }

  async addTurn(
    sessionId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata: ConversationTurn["metadata"] = {}
  ): Promise<ConversationTurn> {
    const session = this.conversations.get(sessionId);
    if (!session) throw new Error(`Conversation ${sessionId} not found`);

    // Generate neural embedding
    const embeddingResult = await this.embeddings.embed(content);
    
    // Detect topics (simple keyword extraction)
    const topics = this.extractTopics(content);
    
    // Simple sentiment analysis
    const sentiment = this.analyzeSentiment(content);

    const turn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: session.userId,
      role,
      content,
      timestamp: new Date().toISOString(),
      sentiment,
      topics,
      embedding: embeddingResult.vector,
      metadata: {
        ...metadata,
        provider: embeddingResult.model,
      },
    };

    session.turns.push(turn);
    session.lastActiveAt = new Date().toISOString();
    session.topics = [...new Set([...session.topics, ...topics])];
    session.totalTokens += Math.ceil(content.length / 4);

    // Also add to global memory for cross-session recall
    this.globalMemory.push(turn);
    if (this.globalMemory.length > this.maxGlobalMemory) {
      this.globalMemory.shift();
    }

    // Update user profile
    const profile = this.userProfiles.get(session.userId);
    if (profile) {
      profile.totalInteractions++;
      profile.lastInteractionAt = new Date().toISOString();
      // Auto-detect language
      if (content.match(/[áéíóúñ¿¡]/)) profile.preferredLang = "es";
      else if (content.match(/[ãõçê]/)) profile.preferredLang = "pt";
      else if (content.match(/[a-z]/i) && !content.match(/[áéíóúñ¿¡ãõçê]/)) profile.preferredLang = "en";
      // Auto-detect interests
      for (const topic of topics) {
        if (!profile.interests.includes(topic)) {
          profile.interests.push(topic);
          if (profile.interests.length > 20) profile.interests.shift();
        }
      }
    }

    // Learn patterns
    await this.learnPattern(session.userId, turn);

    this.emit("turn:added", { sessionId, role, topics });
    return turn;
  }

  // ==========================================
  // Recall — Busca semântica real
  // ==========================================

  async recall(
    userId: string,
    query: string,
    options: { limit?: number; minScore?: number; sessionId?: string } = {}
  ): Promise<{ turn: ConversationTurn; score: number; session?: ConversationSession }[]> {
    const { limit = 10, minScore = 0.3, sessionId } = options;
    
    const queryEmbedding = await this.embeddings.embed(query);
    
    // Search in specific session or all user sessions
    let searchPool: ConversationTurn[] = [];
    
    if (sessionId) {
      const session = this.conversations.get(sessionId);
      if (session) searchPool = session.turns;
    } else {
      // Search all turns from this user across all sessions
      for (const session of this.conversations.values()) {
        if (session.userId === userId) {
          searchPool.push(...session.turns);
        }
      }
      // Also search global memory for cross-user knowledge
      searchPool.push(...this.globalMemory.filter(t => t.userId === userId));
    }

    // Score each turn by cosine similarity
    const scored = searchPool
      .filter(t => t.embedding)
      .map(turn => ({
        turn,
        score: this.cosineSimilarity(queryEmbedding.vector, turn.embedding!),
      }))
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  // ==========================================
  // Pattern Learning
  // ==========================================

  private async learnPattern(userId: string, turn: ConversationTurn): Promise<void> {
    if (turn.role !== "user") return;

    // Check for frequent topics
    const recentTurns = this.getUserRecentTurns(userId, 50);
    const topicCounts = new Map<string, number>();
    for (const t of recentTurns) {
      for (const topic of t.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    for (const [topic, count] of topicCounts) {
      if (count >= 5) {
        this.addPattern(userId, {
          pattern: `User frequently asks about: ${topic}`,
          type: "frequent_topic",
          confidence: Math.min(count / 20, 1),
          evidence: count,
        });
      }
    }

    // Check for response style preference
    if (turn.content.length < 50) {
      this.addPattern(userId, {
        pattern: "User prefers short messages",
        type: "response_style",
        confidence: 0.6,
        evidence: 1,
      });
    } else if (turn.content.length > 200) {
      this.addPattern(userId, {
        pattern: "User prefers detailed messages",
        type: "response_style",
        confidence: 0.6,
        evidence: 1,
      });
    }

    // Check for vocabulary patterns
    const technicalTerms = turn.content.match(/\b(api|kubernetes|docker|typescript|python|sql|regex|webhook|endpoint|deploy)\b/gi);
    if (technicalTerms && technicalTerms.length >= 2) {
      this.addPattern(userId, {
        pattern: `User uses technical vocabulary: ${technicalTerms.join(", ")}`,
        type: "vocabulary",
        confidence: 0.7,
        evidence: 1,
      });
      // Update expertise level
      const profile = this.userProfiles.get(userId);
      if (profile && profile.expertiseLevel === "beginner") {
        profile.expertiseLevel = "intermediate";
      }
    }
  }

  private addPattern(userId: string, patternData: Omit<LearnedPattern, "id" | "userId" | "lastSeenAt" | "createdAt">): void {
    const existing = this.patterns.find(
      p => p.userId === userId && p.pattern === patternData.pattern
    );
    
    if (existing) {
      existing.evidence += patternData.evidence;
      existing.confidence = Math.min(existing.confidence + 0.05, 1);
      existing.lastSeenAt = new Date().toISOString();
    } else {
      this.patterns.push({
        id: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        ...patternData,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
  }

  // ==========================================
  // Context Building — Monta contexto para o LLM
  // ==========================================

  async buildContext(userId: string, currentQuery: string, sessionId?: string): Promise<string> {
    const contextParts: string[] = [];
    
    // 1. User profile
    const profile = this.userProfiles.get(userId);
    if (profile) {
      contextParts.push(`[USER PROFILE] Name: ${profile.name || "unknown"}, Lang: ${profile.preferredLang}, Style: ${profile.preferredResponseStyle}, Expertise: ${profile.expertiseLevel}, Interests: ${profile.interests.slice(0, 5).join(", ")}`);
    }

    // 2. Learned patterns
    const userPatterns = this.patterns.filter(p => p.userId === userId && p.confidence >= 0.5);
    if (userPatterns.length > 0) {
      contextParts.push(`[LEARNED PATTERNS]\n${userPatterns.map(p => `- ${p.pattern} (confidence: ${(p.confidence * 100).toFixed(0)}%)`).join("\n")}`);
    }

    // 3. Recent conversation context
    const recentTurns = this.getUserRecentTurns(userId, 10);
    if (recentTurns.length > 0) {
      contextParts.push(`[RECENT CONVERSATION]\n${recentTurns.map(t => `${t.role}: ${t.content.slice(0, 200)}`).join("\n")}`);
    }

    // 4. Semantic recall
    const recalled = await this.recall(userId, currentQuery, { limit: 5, minScore: 0.4 });
    if (recalled.length > 0) {
      contextParts.push(`[RELEVANT MEMORY]\n${recalled.map(r => `[score: ${r.score.toFixed(2)}] ${r.turn.content.slice(0, 150)}`).join("\n")}`);
    }

    return contextParts.join("\n\n");
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  private getUserRecentTurns(userId: string, limit: number): ConversationTurn[] {
    const turns: ConversationTurn[] = [];
    for (const session of this.conversations.values()) {
      if (session.userId === userId) {
        turns.push(...session.turns.filter(t => t.role === "user"));
      }
    }
    return turns.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  private extractTopics(text: string): string[] {
    const topicPatterns: Record<string, RegExp> = {
      "ai": /\b(ia|inteligencia artificial|artificial intelligence|machine learning|deep learning|neural|llm|gpt|claude|gemini|ollama)\b/i,
      "blockchain": /\b(blockchain|crypto|bitcoin|ethereum|solana|token|nft|defi|web3|stablecoin)\b/i,
      "programming": /\b(codigo|code|typescript|javascript|python|rust|golang|api|endpoint|deploy|docker|kubernetes)\b/i,
      "business": /\b(negocio|business|cliente|client|receita|revenue|faturacao|billing|subscription|plan)\b/i,
      "marketing": /\b(marketing|ads|publicidade|campaign|seo|social media|instagram|facebook|tiktok)\b/i,
      "finance": /\b(financeiro|finance|banco|bank|pagamento|payment|invoice|fatura)\b/i,
      "education": /\b(ensino|education|aprender|learn|curso|course|tutor|professor)\b/i,
      "security": /\b(seguranca|security|vulnerabilidade|vulnerability|penetration|pentest)\b/i,
      "devops": /\b(devops|ci\/cd|pipeline|monitoramento|monitoring|logs|deploy)\b/i,
      "data": /\b(dados|data|database|sql|analytics|dashboard|metrica|metrics)\b/i,
    };

    const topics: string[] = [];
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(text)) topics.push(topic);
    }
    return topics;
  }

  private analyzeSentiment(text: string): number {
    const positive = /\b(excelente|bom|otimo|great|good|perfect|thanks|obrigado|genial|love|amazing)\b/i;
    const negative = /\b(ruim|mau|terrible|horrible|bad|error|erro|fail|falhou|problema|problem)\b/i;
    const neutral = /\b(ok|certo|right|entendido|understood|sim|yes|nao|no)\b/i;
    
    if (positive.test(text)) return 0.7;
    if (negative.test(text)) return -0.7;
    if (neutral.test(text)) return 0.1;
    return 0.0;
  }

  // ==========================================
  // Persistence
  // ==========================================

  private loadAll(): void {
    try {
      // Load user profiles
      const profilesPath = path.join(this.storageDir, "user-profiles.json");
      if (fs.existsSync(profilesPath)) {
        const data = fs.readJsonSync(profilesPath);
        for (const [id, profile] of Object.entries(data)) {
          this.userProfiles.set(id, profile as UserMemoryProfile);
        }
      }

      // Load conversations
      const convDir = path.join(this.storageDir, "conversations");
      if (fs.existsSync(convDir)) {
        const files = fs.readdirSync(convDir).filter(f => f.endsWith(".json"));
        for (const file of files) {
          const conv = fs.readJsonSync(path.join(convDir, file)) as ConversationSession;
          this.conversations.set(conv.id, conv);
        }
      }

      // Load patterns
      const patternsPath = path.join(this.storageDir, "patterns.json");
      if (fs.existsSync(patternsPath)) {
        this.patterns = fs.readJsonSync(patternsPath);
      }

      // Load global memory
      const globalPath = path.join(this.storageDir, "global-memory.jsonl");
      if (fs.existsSync(globalPath)) {
        const lines = fs.readFileSync(globalPath, "utf-8").split("\n").filter(Boolean);
        this.globalMemory = lines.map(l => JSON.parse(l)).slice(-this.maxGlobalMemory);
      }

      console.log(`[NeuralMemory] Loaded: ${this.userProfiles.size} users, ${this.conversations.size} conversations, ${this.patterns.length} patterns, ${this.globalMemory.length} global turns`);
    } catch (e: any) {
      console.error("[NeuralMemory] Load error:", e.message);
    }
  }

  saveAll(): void {
    try {
      // Save user profiles
      const profilesObj: Record<string, UserMemoryProfile> = {};
      for (const [id, profile] of this.userProfiles) {
        profilesObj[id] = profile;
      }
      fs.writeJsonSync(path.join(this.storageDir, "user-profiles.json"), profilesObj, { spaces: 2 });

      // Save conversations (one file per session)
      const convDir = path.join(this.storageDir, "conversations");
      fs.ensureDirSync(convDir);
      for (const [id, conv] of this.conversations) {
        fs.writeJsonSync(path.join(convDir, `${id}.json`), conv, { spaces: 2 });
      }

      // Save patterns
      fs.writeJsonSync(path.join(this.storageDir, "patterns.json"), this.patterns, { spaces: 2 });

      // Save global memory (append-only JSONL)
      const globalPath = path.join(this.storageDir, "global-memory.jsonl");
      const lines = this.globalMemory.slice(-this.maxGlobalMemory).map(t => JSON.stringify(t));
      fs.writeFileSync(globalPath, lines.join("\n"), "utf-8");
    } catch (e: any) {
      console.error("[NeuralMemory] Save error:", e.message);
    }
  }

  private saveUserProfiles(): void {
    const profilesObj: Record<string, UserMemoryProfile> = {};
    for (const [id, profile] of this.userProfiles) {
      profilesObj[id] = profile;
    }
    fs.writeJsonSync(path.join(this.storageDir, "user-profiles.json"), profilesObj, { spaces: 2 });
  }

  private startConsolidation(): void {
    this.consolidationTimer = setInterval(() => {
      this.consolidate();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private consolidate(): void {
    // Deduplicate patterns
    const seen = new Set<string>();
    this.patterns = this.patterns.filter(p => {
      const key = `${p.userId}:${p.pattern}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Clean old sessions (keep last 100 per user)
    const userSessions = new Map<string, ConversationSession[]>();
    for (const conv of this.conversations.values()) {
      const sessions = userSessions.get(conv.userId) || [];
      sessions.push(conv);
      userSessions.set(conv.userId, sessions);
    }
    for (const [userId, sessions] of userSessions) {
      if (sessions.length > 100) {
        sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        for (const old of sessions.slice(100)) {
          this.conversations.delete(old.id);
        }
      }
    }

    this.saveAll();
  }

  // ==========================================
  // Stats
  // ==========================================

  getStats(): MemoryStats {
    let totalTurns = 0;
    let totalSentiment = 0;
    const topicCounts = new Map<string, number>();

    for (const conv of this.conversations.values()) {
      totalTurns += conv.turns.length;
      for (const turn of conv.turns) {
        if (turn.sentiment) totalSentiment += turn.sentiment;
        for (const topic of turn.topics) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      }
    }

    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const avgTurns = this.conversations.size > 0 
      ? totalTurns / this.conversations.size 
      : 0;

    const avgSentiment = totalTurns > 0 ? totalSentiment / totalTurns : 0;

    // Calculate storage size
    let storageSize = 0;
    try {
      const dirSize = (dir: string): number => {
        let size = 0;
        if (fs.existsSync(dir)) {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) size += dirSize(itemPath);
            else size += stat.size;
          }
        }
        return size;
      };
      storageSize = dirSize(this.storageDir);
    } catch {}

    return {
      totalUsers: this.userProfiles.size,
      totalConversations: this.conversations.size,
      totalTurns,
      totalPatterns: this.patterns.length,
      avgTurnsPerConversation: avgTurns,
      avgSentiment,
      topTopics,
      storageSizeBytes: storageSize,
    };
  }

  shutdown(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
      this.consolidationTimer = null;
    }
    this.saveAll();
    console.log("[NeuralMemory] Shutdown complete");
  }
}

// Singleton
let _instance: NeuralMemoryEngine | null = null;
export function getNeuralMemory(storageDir?: string): NeuralMemoryEngine {
  if (!_instance) {
    _instance = new NeuralMemoryEngine(storageDir);
  }
  return _instance;
}
