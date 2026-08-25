import { SkillsRegistry, skillsRegistry, SkillInfo } from "../skills/SkillsRegistry";

export interface SkillContext {
  relevantSkills: SkillInfo[];
  domain: string;
  totalIndexed: number;
  promptExtension: string;
}

export class SkillBridge {
  private registry: SkillsRegistry;

  constructor(registry?: SkillsRegistry) {
    this.registry = registry || skillsRegistry;
  }

  async buildSkillContext(query: string, domain?: string): Promise<SkillContext> {
    await this.registry.ensureLoaded();
    const stats = await this.registry.stats();
    const relevantSkills = await this.registry.searchSkills(query, domain);
    const topSkills = relevantSkills.slice(0, 8);

    const promptExtension = topSkills.length > 0
      ? this.buildPromptExtension(topSkills)
      : "";

    return {
      relevantSkills: topSkills,
      domain: domain || this.detectDomain(query),
      totalIndexed: stats.total,
      promptExtension,
    };
  }

  async getSkillPromptBlock(query: string, domain?: string): Promise<string> {
    const ctx = await this.buildSkillContext(query, domain);
    return ctx.promptExtension;
  }

  private buildPromptExtension(skills: SkillInfo[]): string {
    const lines = [
      "\nAVAILABLE RELEVANT SKILLS (use these as guidance, not as tools — they are indexed instructions):",
      ...skills.map((s, i) => `${i + 1}. **${s.name}** (${s.source}, ${s.license}) — ${s.description.slice(0, 150)}`),
      "\nWhen applicable, follow the patterns and best practices described in these skills.",
    ];
    return lines.join("\n");
  }

  private detectDomain(query: string): string {
    const q = query.toLowerCase();
    if (/(security|vulnerability|sql injection|xss|auth|hack|exploit|encrypt|cipher)/.test(q)) return "security";
    if (/(api|rest|graphql|endpoint|route|router|middleware|architecture|design|system)/.test(q)) return "architecture";
    if (/(deploy|pipeline|ci|cd|docker|kubernetes|server|infrastructure|monitoring)/.test(q)) return "development";
    if (/(test|debug|build|compile|refactor|clean|optimize|memory|performance)/.test(q)) return "development";
    if (/(finance|revenue|mrr|arr|budget|cost|cash|investment|funding)/.test(q)) return "finance";
    if (/(sales|lead|customer|client|prospect|crm|pipeline|deal)/.test(q)) return "sales";
    if (/(manage|team|okr|kpi|review|plan|strategy|roadmap|leadership)/.test(q)) return "management";
    if (/(research|paper|study|literature|survey|analysis|deep.*learn|model|training)/.test(q)) return "research";
    return "general";
  }

  get domains(): string[] {
    return ["development", "operations", "research", "architecture", "security", "sales", "finance", "general"];
  }
}

export const skillBridge = new SkillBridge();
