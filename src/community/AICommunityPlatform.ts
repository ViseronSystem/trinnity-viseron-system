import { AIProviderBridge, AIProviderId, AIModelCompareResult, AIBridgeRequest, AIBridgeResponse } from "../core/bridge/AIProviderBridge";
import { MemoryEngine } from "../core/memory/MemoryEngine";

export interface CommunityUser {
  id: string;
  username: string;
  email: string;
  role: "free" | "premium" | "vip" | "admin";
  tokens: number;
  joinedAt: number;
  apiKeys: Record<string, string>;
  favoriteModels: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  providerId: AIProviderId;
  createdAt: number;
  cost: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  modelId?: string;
  providerId?: AIProviderId;
}

export interface CommunityAgent {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  systemPrompt: string;
  modelId: string;
  providerId: AIProviderId;
  category: string;
  tags: string[];
  price: number;
  usageCount: number;
  rating: number;
  createdAt: number;
  approved: boolean;
}

export interface AgentReview {
  agentId: string;
  userId: string;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface MonetizationPlan {
  tier: string;
  priceUSD: number;
  priceTRIN: number;
  features: string[];
  requestsPerDay: number;
  models: string[];
  agentCreation: boolean;
}

export class AICommunityPlatform {
  private bridge: AIProviderBridge;
  private memory: MemoryEngine;
  private users: Map<string, CommunityUser> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private agents: Map<string, CommunityAgent> = new Map();
  private reviews: AgentReview[] = [];
  private totalRevenue: number = 0;

  static readonly MONETIZATION: MonetizationPlan[] = [
    { tier: "Free", priceUSD: 0, priceTRIN: 0, features: ["3 requests/day", "Basic models", "Community chat"],
      requestsPerDay: 3, models: ["gpt-4o-mini", "gemini-2.5-flash", "mistral-small"], agentCreation: false },
    { tier: "Premium", priceUSD: 29, priceTRIN: 290, features: ["100 requests/day", "All models", "Model comparison", "Agent creation", "Priority support"],
      requestsPerDay: 100, models: ["gpt-4o", "claude-sonnet-4-20250514", "gemini-2.5-pro", "grok-3", "mistral-large"], agentCreation: true },
    { tier: "VIP", priceUSD: 99, priceTRIN: 990, features: ["Unlimited requests", "All models + preview", "Ensemble mode", "Custom fine-tuning", "API access", "Dedicated support", "Early features"],
      requestsPerDay: 999999, models: ["gpt-4o", "claude-sonnet-4-20250514", "claude-opus-4-20250514", "gemini-2.5-pro", "grok-3", "mistral-large", "deepseek-chat", "command-a"], agentCreation: true },
    { tier: "Enterprise", priceUSD: 499, priceTRIN: 4990, features: ["Unlimited everything", "Private deployment", "Custom models", "SLA 99.9%", "White label", "Team accounts", "Priority feature requests"],
      requestsPerDay: 999999, models: ["*"], agentCreation: true },
  ];

  constructor(bridge: AIProviderBridge, memory?: MemoryEngine) {
    this.bridge = bridge;
    this.memory = memory || new MemoryEngine();
    this.seedDefaultAgents();
  }

  private seedDefaultAgents(): void {
    const defaultAgents: CommunityAgent[] = [
      { id: "agent_coder", name: "CodeMaster", description: "Expert software engineer. Writes, debugs & optimizes code in any language.", creatorId: "system", creatorName: "TVS", systemPrompt: "You are an expert software engineer. Write clean, efficient code.", modelId: "claude-sonnet-4-20250514", providerId: "claude", category: "development", tags: ["code", "programming", "debug"], price: 0, usageCount: 0, rating: 5, createdAt: Date.now(), approved: true },
      { id: "agent_writer", name: "ContentCreator", description: "Professional writer for articles, blogs, marketing copy & creative content.", creatorId: "system", creatorName: "TVS", systemPrompt: "You are a professional writer. Create engaging, high-quality content.", modelId: "gpt-4o", providerId: "openai", category: "content", tags: ["writing", "content", "creative"], price: 0, usageCount: 0, rating: 5, createdAt: Date.now(), approved: true },
      { id: "agent_researcher", name: "DeepResearcher", description: "Deep research assistant. Analyzes topics with comprehensive multi-source insights.", creatorId: "system", creatorName: "TVS", systemPrompt: "You are a research assistant. Provide thorough, well-sourced analysis.", modelId: "gemini-2.5-pro", providerId: "gemini", category: "research", tags: ["research", "analysis", "learning"], price: 0, usageCount: 0, rating: 5, createdAt: Date.now(), approved: true },
      { id: "agent_business", name: "BizStrategist", description: "Business strategist. Helps with planning, marketing, fundraising & growth.", creatorId: "system", creatorName: "TVS", systemPrompt: "You are a business strategy consultant. Provide actionable business advice.", modelId: "grok-3", providerId: "grok", category: "business", tags: ["business", "strategy", "marketing"], price: 0, usageCount: 0, rating: 5, createdAt: Date.now(), approved: true },
      { id: "agent_creative", name: "VisionForge", description: "Creative ideator. Brainstorms innovative ideas for products, content & campaigns.", creatorId: "system", creatorName: "TVS", systemPrompt: "You are a creative director. Generate innovative, actionable ideas.", modelId: "claude-opus-4-20250514", providerId: "claude", category: "creative", tags: ["creative", "ideas", "innovation"], price: 0, usageCount: 0, rating: 5, createdAt: Date.now(), approved: true },
      { id: "agent_data", name: "DataAnalyzer", description: "Data analysis expert. Interprets data, creates visualizations & extracts insights.", creatorId: "system", creatorName: "TVS", systemPrompt: "You are a data scientist. Analyze data and provide clear insights.", modelId: "gpt-4o", providerId: "openai", category: "data", tags: ["data", "analytics", "visualization"], price: 0, usageCount: 0, rating: 5, createdAt: Date.now(), approved: true },
    ];
    for (const agent of defaultAgents) {
      this.agents.set(agent.id, agent);
    }
  }

  registerUser(username: string, email: string, role: CommunityUser["role"] = "free"): CommunityUser {
    const user: CommunityUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      username, email, role, tokens: role === "vip" ? 10000 : role === "premium" ? 1000 : 50,
      joinedAt: Date.now(), apiKeys: {}, favoriteModels: [],
    };
    this.users.set(user.id, user);
    this.memory.addKnowledge(`New user: ${username}`, "COMMUNITY_USERS",
      `${email} joined as ${role}`, ["community", "user", role]);
    return user;
  }

  createSession(userId: string, modelId?: string, providerId?: AIProviderId): ChatSession {
    const session: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId, title: "New Chat",
      messages: [{ role: "system", content: "Welcome to Trinnity Viseron AI Community!", timestamp: Date.now() }],
      modelId: modelId || "gpt-4o",
      providerId: providerId || "openai",
      createdAt: Date.now(), cost: 0,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async sendMessage(sessionId: string, userId: string, content: string): Promise<ChatMessage | null> {
    const session = this.sessions.get(sessionId);
    const user = this.users.get(userId);
    if (!session || !user) return null;

    const userMessage: ChatMessage = { role: "user", content, timestamp: Date.now() };
    session.messages.push(userMessage);

    const request: AIBridgeRequest = {
      prompt: content,
      systemPrompt: session.messages.find(m => m.role === "system")?.content,
      modelId: session.modelId,
      providerId: session.providerId,
      taskType: "chat",
    };

    const response = await this.bridge.chat(request);
    session.cost += response.cost;

    const assistantMessage: ChatMessage = {
      role: "assistant", content: response.text, timestamp: Date.now(),
      modelId: response.model, providerId: response.provider,
    };
    session.messages.push(assistantMessage);

    if (!session.title || session.title === "New Chat") {
      session.title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
    }

    return assistantMessage;
  }

  async compareModelsAcrossProviders(prompt: string, modelIds: string[]): Promise<AIModelCompareResult[]> {
    this.memory.addKnowledge(`Model comparison: ${modelIds.length} models`, "COMMUNITY_COMPARE",
      `Comparing ${modelIds.join(", ")}`, ["community", "compare"]);
    return await this.bridge.compareModels({ prompt, taskType: "general" }, modelIds);
  }

  createAgent(name: string, description: string, creatorId: string, systemPrompt: string, modelId: string, providerId: AIProviderId, category: string, tags: string[], price: number = 0): CommunityAgent {
    const agent: CommunityAgent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name, description, creatorId, creatorName: this.users.get(creatorId)?.username || "Unknown",
      systemPrompt, modelId, providerId, category, tags, price, usageCount: 0, rating: 0, createdAt: Date.now(), approved: false,
    };
    this.agents.set(agent.id, agent);
    this.memory.addKnowledge(`Agent created: ${name}`, "COMMUNITY_AGENTS",
      `${description} [${category}] by ${agent.creatorName}`, ["community", "agent", category]);
    return agent;
  }

  useAgent(agentId: string, userId: string, prompt: string): Promise<AIBridgeResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error("Agent not found");

    agent.usageCount++;
    const request: AIBridgeRequest = {
      prompt,
      systemPrompt: agent.systemPrompt,
      modelId: agent.modelId,
      providerId: agent.providerId,
      taskType: "general",
    };
    this.memory.addKnowledge(`Agent used: ${agent.name}`, "AGENT_USAGE",
      `${agent.name} used by ${userId}`, ["community", "agent", agent.category]);
    return this.bridge.chat(request);
  }

  getAgentsByCategory(category: string): CommunityAgent[] {
    return Array.from(this.agents.values()).filter(a => a.category === category && a.approved);
  }

  getTopAgents(limit: number = 10): CommunityAgent[] {
    return Array.from(this.agents.values())
      .filter(a => a.approved)
      .sort((a, b) => (b.rating * b.usageCount) - (a.rating * a.usageCount))
      .slice(0, limit);
  }

  getPlans(): MonetizationPlan[] { return AICommunityPlatform.MONETIZATION; }

  purchasePlan(userId: string, tier: string, paymentMethod: "usd" | "trin"): boolean {
    const user = this.users.get(userId);
    const plan = AICommunityPlatform.MONETIZATION.find(p => p.tier.toLowerCase() === tier.toLowerCase());
    if (!user || !plan) return false;

    if (paymentMethod === "trin") {
      if (user.tokens < plan.priceTRIN) return false;
      user.tokens -= plan.priceTRIN;
    }
    this.totalRevenue += paymentMethod === "usd" ? plan.priceUSD : 0;
    user.role = plan.tier.toLowerCase() as CommunityUser["role"];
    this.memory.addKnowledge(`Purchase: ${user.username} -> ${tier}`, "COMMUNITY_REVENUE",
      `$${plan.priceUSD} / ${plan.priceTRIN} TRIN`, ["community", "revenue", tier]);
    return true;
  }

  addReview(agentId: string, userId: string, rating: number, comment: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    this.reviews.push({ agentId, userId, rating, comment, timestamp: Date.now() });
    const agentReviews = this.reviews.filter(r => r.agentId === agentId);
    agent.rating = agentReviews.reduce((a, r) => a + r.rating, 0) / agentReviews.length;
    return true;
  }

  getUserChatHistory(userId: string): ChatSession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  getCommunityStats(): { totalUsers: number; totalSessions: number; totalAgents: number; totalMessages: number; totalRevenue: number; activeUsers: number; topAgents: CommunityAgent[] } {
    let totalMessages = 0;
    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
    }
    return {
      totalUsers: this.users.size,
      totalSessions: this.sessions.size,
      totalAgents: this.agents.size,
      totalMessages,
      totalRevenue: this.totalRevenue,
      activeUsers: this.users.size,
      topAgents: this.getTopAgents(),
    };
  }
}
