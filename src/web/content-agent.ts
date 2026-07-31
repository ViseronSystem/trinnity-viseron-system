import { BlogStorage } from "./blog-storage";
import { ProviderFactory } from "../core/providers/ProviderFactory";
import { LLMRequest, LLMResponse } from "../core/providers/BaseProvider";
import { ModelProvider } from "../core/types";

interface ContentTopic {
  category: string;
  title: string;
  prompt: string;
  tags: string[];
}

const TOPICS: ContentTopic[] = [
  {
    category: "tech",
    title: "Auto-evolução Genética de Agentes IA",
    prompt: "Write a technical blog post in Portuguese (pt-BR) about how genetic agent evolution works in multi-agent AI systems. Explain how agents automatically evolve with hyper-exponential learning (6x every 30 minutes). Include concepts of crossover, mutation, and fitness evaluation. Title: 'Auto-Evolução Genética em Sistemas Multi-Agente'",
    tags: ["ia", "agentes", "evolução", "machine learning"]
  },
  {
    category: "update",
    title: "Status do Sistema Viseron",
    prompt: "Write a system update blog post in Portuguese (pt-BR) about the Trinnity Viseron System v5.0. Cover: 5000+ minds running, 290+ AI providers connected, 25 business sectors being analyzed. Sound professional and futuristic. Title: 'Viseron v5.0 — 5000 Mentes em Operação'",
    tags: ["viseron", "update", "sistema", "v5.0"]
  },
  {
    category: "tutorial",
    title: "Como Criar um Agente IA Personalizado",
    prompt: "Write a tutorial blog post in Portuguese (pt-BR) explaining how to create a custom AI agent using the Viseron system. Cover: agent factory, provider configuration, squad assignment, and deployment. Title: 'Criando Seu Primeiro Agente IA com Viseron'",
    tags: ["tutorial", "agentes", "guia", "como fazer"]
  },
  {
    category: "ai",
    title: "SuperIntelligence Ensemble Synthesis",
    prompt: "Write a blog post in Portuguese (pt-BR) explaining multi-provider ensemble synthesis for superintelligence. Explain how multiple AI models (OpenAI, Claude, Gemini, Grok, Ollama) work together to produce superior results. Title: 'Síntese Ensemble — A Engenharia da Superinteligência'",
    tags: ["ia", "superinteligência", "ensemble", "provedores"]
  },
  {
    category: "tech",
    title: "OmniRoute: 290+ Provedores de IA",
    prompt: "Write a blog post in Portuguese (pt-BR) about the OmniRoute gateway that connects 290+ AI providers with 500+ models. Explain auto-fallback, RTK compression, MCP/A2A protocols. Title: 'OmniRoute Gateway — 290 Provedores de IA em Um'",
    tags: ["omniroute", "ia", "gateway", "provedores"]
  },
  {
    category: "token",
    title: "Tokenomics $VSR — Viseron Crown",
    prompt: "Write a blog post in Portuguese (pt-BR) explaining the $VSR token economics. 300M supply, Corona/Hierro distribution, burn mechanism, governance voting. Title: '$VSR — Tokenomia do Ecossistema Viseron'",
    tags: ["token", "vsr", "cryptocurrency", "governança"]
  },
  {
    category: "security",
    title: "Command Chain e Segurança em IA",
    prompt: "Write a blog post in Portuguese (pt-BR) about the Command Chain security model in Viseron. Cover: Corona lineage, Hierro lineage, dual-signature directives, squad hierarchy. Title: 'Command Chain — Segurança e Hierarquia em Sistemas Multi-Agente'",
    tags: ["segurança", "command chain", "hierarquia", "diretivas"]
  },
  {
    category: "mobile",
    title: "Viseron Mobile: IA no Seu Bolso",
    prompt: "Write a blog post in Portuguese (pt-BR) about running the Viseron system on mobile devices. Embedded Node.js server, Express + Socket.io, dashboard via WebView, local AI processing. Title: 'Viseron Mobile — Superinteligência no Seu Bolso'",
    tags: ["mobile", "android", "apk", "nodejs"]
  },
];

const TOPICS_EN: ContentTopic[] = [
  {
    category: "tech",
    title: "Genetic Agent Evolution in Multi-Agent Systems",
    prompt: "Write a blog post in English explaining how genetic agent evolution works in multi-agent AI systems. Explain crossover, mutation, fitness evaluation, and hyper-exponential learning (6x every 30 min). Title: 'Genetic Evolution in Multi-Agent AI Systems'",
    tags: ["ai", "agents", "evolution", "machine learning"]
  },
  {
    category: "ai",
    title: "Multi-Provider Ensemble for Superintelligence",
    prompt: "Write a blog post in English explaining multi-provider ensemble synthesis. How OpenAI, Claude, Gemini, Grok, and local models combine for superintelligence. Title: 'Ensemble Synthesis — The Engineering of Superintelligence'",
    tags: ["ai", "superintelligence", "ensemble", "providers"]
  },
  {
    category: "tutorial",
    title: "Building Your First AI Agent with Viseron",
    prompt: "Write a tutorial in English about creating a custom AI agent using the Viseron system. Agent factory, provider config, squad assignment, deployment. Title: 'Building Your First AI Agent with Viseron'",
    tags: ["tutorial", "agents", "guide", "howto"]
  },
];

export class ContentAgent {
  private blog: BlogStorage;
  private providerFactory: ProviderFactory;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTopicIndex = 0;
  private generating = false;

  constructor(blog: BlogStorage) {
    this.blog = blog;
    this.providerFactory = new ProviderFactory();
  }

  start(scheduleMinutes: number = 120): void {
    console.log(`[ContentAgent] Auto-content generation every ${scheduleMinutes} minutes`);
    this.generatePost();
    this.intervalId = setInterval(() => this.generatePost(), scheduleMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async generatePost(): Promise<void> {
    if (this.generating) return;
    this.generating = true;

    try {
      const allTopics = [...TOPICS, ...TOPICS_EN];
      const topic = allTopics[this.lastTopicIndex % allTopics.length];
      this.lastTopicIndex++;

      const slug = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 80);

      const existing = this.blog.getBySlug(slug);
      if (existing) {
        console.log(`[ContentAgent] Post already exists: ${slug}`);
        return;
      }

      const providerToUse = this.detectBestProvider();

      console.log(`[ContentAgent] Generating: ${topic.title} via ${providerToUse}`);

      const request: LLMRequest = {
        prompt: topic.prompt,
        systemPrompt: "You are Viseron, an advanced multi-agent AI system. Write engaging, professional blog posts. Return only valid JSON with fields: content (full markdown article), excerpt (2 sentence summary), contentHtml (simple HTML version).",
        temperature: 0.8,
        maxTokens: 2000,
      };

      let result: LLMResponse | undefined;
      try {
        result = await this.providerFactory.generate(providerToUse as ModelProvider, request);
      } catch {
        result = await this.providerFactory.generate("ollama" as ModelProvider, request);
      }

      if (!result || !result.text) {
        console.log(`[ContentAgent] No content generated for: ${topic.title}`);
        return;
      }

      let parsed: { content?: string; excerpt?: string; contentHtml?: string } = {};
      try {
        parsed = JSON.parse(result.text);
      } catch {
        parsed = { content: result.text, excerpt: result.text.substring(0, 200) + "...", contentHtml: result.text };
      }

      const post = this.blog.create({
        title: topic.title,
        slug,
        excerpt: parsed.excerpt || topic.prompt.substring(0, 150),
        content: parsed.content || result.text,
        contentHtml: parsed.contentHtml || (parsed.content || result.text),
        author: "Viseron",
        tags: topic.tags,
        coverUrl: "",
        publishedAt: null,
        status: "published",
      });

      this.blog.publish(post.id);
      console.log(`[ContentAgent] Published: ${topic.title} (${post.id})`);
    } catch (err: any) {
      console.error(`[ContentAgent] Error generating post:`, err.message);
    } finally {
      this.generating = false;
    }
  }

  async generateCustomPost(title: string, prompt: string, tags: string[] = []): Promise<void> {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 80);

    const providerToUse = this.detectBestProvider();
    const request: LLMRequest = {
      prompt,
      systemPrompt: "You are Viseron, an advanced multi-agent AI system. Write engaging, professional blog posts. Return only valid JSON with fields: content (full markdown), excerpt (summary), contentHtml (HTML version).",
      temperature: 0.8,
      maxTokens: 2000,
    };

    try {
      const result = await this.providerFactory.generate(providerToUse as ModelProvider, request);
      if (!result || !result.text) return;

      let parsed: any = {};
      try { parsed = JSON.parse(result.text); } catch { parsed = { content: result.text, excerpt: result.text.substring(0, 200) }; }

      const post = this.blog.create({
        title, slug, excerpt: parsed.excerpt || "", content: parsed.content || result.text,
        contentHtml: parsed.contentHtml || parsed.content || result.text,
        author: "Viseron", tags, coverUrl: "", publishedAt: null, status: "published",
      });
      this.blog.publish(post.id);
      console.log(`[ContentAgent] Published custom: ${title} (${post.id})`);
    } catch (err: any) {
      console.error(`[ContentAgent] Custom post error:`, err.message);
    }
  }

  private detectBestProvider(): string {
    const envVars = [
      { key: "OPENAI_API_KEY", provider: "openai" },
      { key: "ANTHROPIC_API_KEY", provider: "claude" },
      { key: "GEMINI_API_KEY", provider: "gemini" },
      { key: "XAI_API_KEY", provider: "grok" },
    ];
    for (const ev of envVars) {
      if (process.env[ev.key]) return ev.provider;
    }
    return "ollama";
  }
}
