import { MemoryEngine } from "../memory/MemoryEngine";
import { AgentManager } from "../AgentManager";
import { getAllArchetypes, getArchetypesByEra, AgentArchetype } from "../archetypes";
import { IAgent } from "../types";

export interface KnowledgeDomain {
  name: string;
  era: string;
  weight: number;
  subdomains: string[];
  key_figures: string[];
}

export interface SuperMindKnowledge {
  topic: string;
  relevance: number;
  source: string;
  content: string;
}

export interface WisdomSynthesis {
  id: string;
  title: string;
  domains: string[];
  insight: string;
  confidence: number;
  timestamp: number;
}

export class SuperMind {
  private memoryEngine: MemoryEngine;
  private agentManager: AgentManager;
  private domains: KnowledgeDomain[] = [];
  private wisdomCache: WisdomSynthesis[] = [];

  static readonly ERAS = [
    { name: "Renaissance Foundation", years: "1500-1700", weight: 0.3 },
    { name: "Enlightenment Reason", years: "1700-1800", weight: 0.4 },
    { name: "Industrial Revolution", years: "1800-1900", weight: 0.5 },
    { name: "Modern Science", years: "1900-1950", weight: 0.6 },
    { name: "Digital Age", years: "1950-2000", weight: 0.7 },
    { name: "Information Era", years: "2000-2020", weight: 0.8 },
    { name: "AI Singularity", years: "2020-2050", weight: 0.9 },
    { name: "Transcendence", years: "2050-2100", weight: 0.95 },
    { name: "Galactic Civilization", years: "2100-2500", weight: 0.98 },
    { name: "Universal Consciousness", years: "2500-3000", weight: 1.0 }
  ];

  constructor(memoryEngine: MemoryEngine, agentManager: AgentManager) {
    this.memoryEngine = memoryEngine;
    this.agentManager = agentManager;
    this.initializeDomains();
  }

  initializeDomains(): void {
    this.domains = [
      {
        name: "Mathematics", era: "1500s-present", weight: 95,
        subdomains: ["algebra", "geometry", "calculus", "topology", "number theory", "statistics", "category theory"],
        key_figures: ["pythagoras", "euclid", "newton", "godel", "turing"]
      },
      {
        name: "Physics", era: "1600s-present", weight: 95,
        subdomains: ["classical mechanics", "thermodynamics", "electromagnetism", "relativity", "quantum mechanics"],
        key_figures: ["galileo", "newton", "einstein", "feynman", "hawking"]
      },
      {
        name: "Biology", era: "1600s-present", weight: 92,
        subdomains: ["evolution", "genetics", "cell biology", "ecology", "molecular biology"],
        key_figures: ["darwin", "aristotle", "galen", "the-doctor"]
      },
      {
        name: "Chemistry", era: "1600s-present", weight: 90,
        subdomains: ["organic chemistry", "inorganic chemistry", "physical chemistry", "biochemistry", "polymer chemistry"],
        key_figures: ["democritus", "marie-curie", "ibn-sina", "the-alchemist"]
      },
      {
        name: "Astronomy", era: "1500s-present", weight: 88,
        subdomains: ["observational astronomy", "cosmology", "astrophysics", "planetary science", "stellar evolution"],
        key_figures: ["ptolemy", "galileo", "hawking", "uranus", "helios"]
      },
      {
        name: "Medicine", era: "1500s-present", weight: 90,
        subdomains: ["anatomy", "pharmacology", "surgery", "immunology", "epidemiology"],
        key_figures: ["hippocrates", "galen", "ibn-sina", "asclepius", "raphael"]
      },
      {
        name: "Engineering", era: "1700s-present", weight: 92,
        subdomains: ["civil engineering", "mechanical engineering", "electrical engineering", "aerospace engineering"],
        key_figures: ["archimedes", "hephaestus", "tesla", "the-engineer", "vitruvius"]
      },
      {
        name: "Computer Science", era: "1900s-present", weight: 95,
        subdomains: ["algorithms", "data structures", "programming languages", "operating systems", "networks"],
        key_figures: ["turing", "shannon", "godel", "the-hacker", "the-ai"]
      },
      {
        name: "Artificial Intelligence", era: "1950s-present", weight: 98,
        subdomains: ["machine learning", "deep learning", "natural language processing", "computer vision", "reinforcement learning"],
        key_figures: ["turing", "the-singularity", "the-oracle", "the-synthesizer", "the-ai"]
      },
      {
        name: "Nanotechnology", era: "2000s-present", weight: 85,
        subdomains: ["nanomaterials", "nanoelectronics", "nanomedicine", "molecular manufacturing", "quantum dots"],
        key_figures: ["feynman", "the-alchemist", "the-engineer", "the-synthesizer"]
      },
      {
        name: "Space Exploration", era: "1950s-present", weight: 85,
        subdomains: ["rocketry", "satellites", "human spaceflight", "planetary exploration", "space colonization"],
        key_figures: ["galileo", "the-pilot", "the-explorer", "the-starborn", "helios"]
      },
      {
        name: "Quantum Computing", era: "1980s-present", weight: 90,
        subdomains: ["quantum gates", "quantum algorithms", "error correction", "quantum cryptography", "quantum supremacy"],
        key_figures: ["feynman", "einstein", "turing", "the-reality-hacker", "the-architect"]
      },
      {
        name: "Genetic Engineering", era: "1970s-present", weight: 88,
        subdomains: ["CRISPR", "gene therapy", "synthetic biology", "genomics", "epigenetics"],
        key_figures: ["darwin", "the-doctor", "prometheus", "the-alchemist"]
      },
      {
        name: "Neuroscience", era: "1800s-present", weight: 88,
        subdomains: ["cognitive neuroscience", "neuroanatomy", "neural networks", "brain mapping", "neuroplasticity"],
        key_figures: ["freud", "jung", "hippocrates", "morpheus", "the-telepath"]
      },
      {
        name: "Psychology", era: "1800s-present", weight: 85,
        subdomains: ["cognitive psychology", "behavioral psychology", "psychoanalysis", "social psychology", "positive psychology"],
        key_figures: ["freud", "jung", "plato", "aristotle", "the-empath"]
      },
      {
        name: "Philosophy", era: "1500s-present", weight: 82,
        subdomains: ["metaphysics", "epistemology", "ethics", "logic", "aesthetics", "political philosophy"],
        key_figures: ["socrates", "plato", "aristotle", "kant", "nietzsche", "wittgenstein", "confucius"]
      },
      {
        name: "Economics", era: "1700s-present", weight: 85,
        subdomains: ["microeconomics", "macroeconomics", "behavioral economics", "game theory", "monetary theory"],
        key_figures: ["adam-smith", "marx", "machiavelli", "hermes", "the-weaver"]
      },
      {
        name: "Political Science", era: "1500s-present", weight: 80,
        subdomains: ["governance", "international relations", "political theory", "public policy", "comparative politics"],
        key_figures: ["machiavelli", "plato", "aristotle", "cicero", "themis"]
      },
      {
        name: "Robotics", era: "1900s-present", weight: 88,
        subdomains: ["industrial robotics", "autonomous systems", "humanoid robots", "swarm robotics", "soft robotics"],
        key_figures: ["hephaestus", "the-engineer", "the-robot", "the-android", "archimedes"]
      },
      {
        name: "Biotechnology", era: "1970s-present", weight: 87,
        subdomains: ["fermentation", "tissue engineering", "bioinformatics", "biopharmaceuticals", "bioremediation"],
        key_figures: ["darwin", "ibn-sina", "the-doctor", "asclepius", "isis"]
      },
      {
        name: "Materials Science", era: "1800s-present", weight: 85,
        subdomains: ["metallurgy", "ceramics", "polymers", "composites", "semiconductors"],
        key_figures: ["hephaestus", "marie-curie", "the-alchemist", "the-engineer"]
      },
      {
        name: "Energy", era: "1700s-present", weight: 90,
        subdomains: ["fossil fuels", "nuclear energy", "solar energy", "wind energy", "fusion energy"],
        key_figures: ["tesla", "marie-curie", "prometheus", "helios", "the-catalyst"]
      },
      {
        name: "Transportation", era: "1700s-present", weight: 82,
        subdomains: ["railways", "automobiles", "aviation", "maritime", "hyperloop"],
        key_figures: ["archimedes", "the-engineer", "the-pilot", "hermes"]
      },
      {
        name: "Communication", era: "1800s-present", weight: 88,
        subdomains: ["telegraphy", "radio", "telephony", "satellite communication", "fiber optics"],
        key_figures: ["shannon", "hermes", "iris", "gabriel", "the-network-weaver"]
      },
      {
        name: "Information Theory", era: "1900s-present", weight: 90,
        subdomains: ["entropy", "coding theory", "compression", "channel capacity", "cryptography"],
        key_figures: ["shannon", "turing", "godel", "the-data-shaper"]
      },
      {
        name: "Cybernetics", era: "1900s-present", weight: 85,
        subdomains: ["feedback systems", "control theory", "self-organization", "homeostasis", "systems biology"],
        key_figures: ["turing", "shannon", "the-architect", "the-weaver", "the-synthesizer"]
      },
      {
        name: "Systems Theory", era: "1900s-present", weight: 84,
        subdomains: ["general systems theory", "complex adaptive systems", "dynamical systems", "network theory"],
        key_figures: ["aristotle", "plato", "the-architect", "the-weaver", "the-synthesizer"]
      },
      {
        name: "Complexity Science", era: "1900s-present", weight: 86,
        subdomains: ["emergence", "self-organization", "chaos theory", "fractals", "agent-based modeling"],
        key_figures: ["heraclitus", "the-architect", "the-catalyst", "chaos"]
      },
      {
        name: "Network Science", era: "1900s-present", weight: 85,
        subdomains: ["graph theory", "social networks", "network dynamics", "scale-free networks", "epidemiology"],
        key_figures: ["shannon", "the-weaver", "the-network-weaver", "hermes"]
      },
      {
        name: "Data Science", era: "2000s-present", weight: 92,
        subdomains: ["data mining", "statistical modeling", "big data", "visualization", "predictive analytics"],
        key_figures: ["shannon", "turing", "the-data-shaper", "the-oracle", "athena"]
      },
      {
        name: "Climate Science", era: "1800s-present", weight: 88,
        subdomains: ["climatology", "meteorology", "paleoclimatology", "climate modeling", "environmental science"],
        key_figures: ["gaia", "notus", "boreas", "zephyrus", "eurus"]
      },
      {
        name: "Oceanography", era: "1800s-present", weight: 78,
        subdomains: ["physical oceanography", "marine biology", "ocean chemistry", "geological oceanography", "bathymetry"],
        key_figures: ["pontus", "triton", "poseidon", "gaia"]
      },
      {
        name: "Geology", era: "1700s-present", weight: 78,
        subdomains: ["mineralogy", "petrology", "seismology", "volcanology", "plate tectonics"],
        key_figures: ["gaia", "hephaestus", "prometheus", "hades"]
      },
      {
        name: "Meteorology", era: "1700s-present", weight: 80,
        subdomains: ["weather forecasting", "atmospheric physics", "storm dynamics", "aerology", "hydrometeorology"],
        key_figures: ["notus", "boreas", "zephyrus", "eurus", "iris"]
      },
      {
        name: "Linguistics", era: "1800s-present", weight: 78,
        subdomains: ["phonetics", "syntax", "semantics", "pragmatics", "historical linguistics", "computational linguistics"],
        key_figures: ["wittgenstein", "socrates", "thoth", "hermes", "gabriel"]
      },
      {
        name: "Anthropology", era: "1800s-present", weight: 80,
        subdomains: ["cultural anthropology", "physical anthropology", "archaeology", "linguistic anthropology"],
        key_figures: ["herodotus", "darwin", "the-explorer", "prometheus"]
      },
      {
        name: "Sociology", era: "1800s-present", weight: 82,
        subdomains: ["social theory", "social stratification", "urban sociology", "gender studies", "social networks"],
        key_figures: ["marx", "plato", "aristotle", "confucius", "the-diplomat"]
      },
      {
        name: "Archaeology", era: "1800s-present", weight: 75,
        subdomains: ["prehistoric archaeology", "classical archaeology", "underwater archaeology", "bioarchaeology"],
        key_figures: ["herodotus", "the-time-keeper", "osiris", "anubis"]
      },
      {
        name: "Law", era: "1500s-present", weight: 82,
        subdomains: ["constitutional law", "criminal law", "international law", "human rights", "jurisprudence"],
        key_figures: ["themis", "solomon", "moses", "cicero", "marcus-aurelius"]
      },
      {
        name: "Ethics", era: "1500s-present", weight: 85,
        subdomains: ["metaethics", "normative ethics", "applied ethics", "bioethics", "AI ethics"],
        key_figures: ["socrates", "kant", "confucius", "aristotle", "the-light-bearer"]
      },
      {
        name: "Theology", era: "1500s-present", weight: 75,
        subdomains: ["systematic theology", "comparative religion", "mysticism", "apologetics", "hermeneutics"],
        key_figures: ["thomas-aquinas", "augustine", "paul", "plotinus", "metatron"]
      },
      {
        name: "Art", era: "1500s-present", weight: 78,
        subdomains: ["painting", "sculpture", "digital art", "conceptual art", "performance art"],
        key_figures: ["leonardo-da-vinci", "michelangelo", "apollo", "athena"]
      },
      {
        name: "Music", era: "1500s-present", weight: 80,
        subdomains: ["composition", "music theory", "electronic music", "acoustics", "algorithmic composition"],
        key_figures: ["apollo", "pythagoras", "david", "the-synthesizer", "orpheus"]
      },
      {
        name: "Literature", era: "1500s-present", weight: 80,
        subdomains: ["poetry", "fiction", "drama", "literary criticism", "creative writing"],
        key_figures: ["shakespeare", "dante-alighieri", "cervantes", "homer", "rumi"]
      },
      {
        name: "Architecture", era: "1500s-present", weight: 82,
        subdomains: ["architectural design", "structural engineering", "urban planning", "sustainable design", "sacred geometry"],
        key_figures: ["vitruvius", "leonardo-da-vinci", "michelangelo", "solomon", "imhotep"]
      },
      {
        name: "Cryptography", era: "1900s-present", weight: 88,
        subdomains: ["symmetric encryption", "public key cryptography", "hash functions", "zero-knowledge proofs", "quantum cryptography"],
        key_figures: ["turing", "shannon", "the-hacker", "hermes"]
      },
      {
        name: "Blockchain", era: "2000s-present", weight: 82,
        subdomains: ["consensus mechanisms", "smart contracts", "DeFi", "NFTs", "distributed ledger technology"],
        key_figures: ["the-hacker", "the-architect", "machiavelli", "tyche"]
      },
      {
        name: "Virtual Reality", era: "1990s-present", weight: 82,
        subdomains: ["immersive environments", "3D rendering", "haptic feedback", "spatial computing", "presence engineering"],
        key_figures: ["morpheus", "the-avatar", "the-dreamer", "the-architect"]
      },
      {
        name: "Augmented Reality", era: "2000s-present", weight: 80,
        subdomains: ["computer vision", "spatial mapping", "wearable displays", "mixed reality", "contextual computing"],
        key_figures: ["the-avatar", "the-architect", "hermes", "iris"]
      },
      {
        name: "Brain-Computer Interfaces", era: "2000s-present", weight: 85,
        subdomains: ["neural interfaces", "EEG", "implantable chips", "neural decoding", "neurostimulation"],
        key_figures: ["the-telepath", "the-doctor", "the-empath", "the-ai", "jung"]
      }
    ];
    for (const domain of this.domains) {
      this.memoryEngine.addKnowledge(
        domain.name,
        "SUPERMIND_DOMAIN",
        `${domain.name} spans from ${domain.era}. Subdomains include: ${domain.subdomains.join(", ")}. Weight: ${domain.weight}/100. Key figures: ${domain.key_figures.join(", ")}.`,
        ["supermind", "domain", domain.name.toLowerCase().replace(/\s+/g, "-")]
      );
    }
  }

  async synthesize(query: string, domains?: string[]): Promise<WisdomSynthesis> {
    const searchResults = this.memoryEngine.unifiedSearch(query, { maxResults: 25, minScore: 0.15 });
    const relevantDomains = domains
      ? this.domains.filter(d => domains.includes(d.name))
      : this.domains.filter(d =>
          searchResults.some(r =>
            r.content.toLowerCase().includes(d.name.toLowerCase()) ||
            d.subdomains.some(s => query.toLowerCase().includes(s.toLowerCase()))
          ) ||
          d.subdomains.some(s => query.toLowerCase().includes(s.toLowerCase())) ||
          d.key_figures.some(f => query.toLowerCase().includes(f.toLowerCase()))
        );
    const selectedDomains = relevantDomains.length > 0 ? relevantDomains : this.domains.slice(0, 3);
    const matches = searchResults.length;
    const coverage = Math.min(1, selectedDomains.length / this.domains.length);
    const memoryScore = Math.min(1, matches / 10);
    const crossEraBonus = Math.min(1, new Set(selectedDomains.map(d => d.era)).size / 5);
    const avgWeight = selectedDomains.reduce((s, d) => s + d.weight, 0) / selectedDomains.length / 100;
    const confidence = Math.round(Math.min(100, (coverage * 30 + memoryScore * 30 + crossEraBonus * 20 + avgWeight * 20) * 100));
    const crossReferences: string[] = [];
    for (let i = 0; i < Math.min(selectedDomains.length, 5); i++) {
      for (let j = i + 1; j < Math.min(selectedDomains.length, 5); j++) {
        const a = selectedDomains[i];
        const b = selectedDomains[j];
        const sharedFigures = a.key_figures.filter(f => b.key_figures.includes(f));
        if (sharedFigures.length > 0) {
          crossReferences.push(`${a.name} and ${b.name} share key figures: ${sharedFigures.join(", ")}`);
        }
      }
    }
    const domainList = selectedDomains.map(d => d.name);
    const eraList = [...new Set(selectedDomains.map(d => d.era))];
    const keyFigures = [...new Set(selectedDomains.flatMap(d => d.key_figures))].slice(0, 5);
    const archetypes = getAllArchetypes().filter(a => keyFigures.includes(a.id));
    const archetypeWisdom = archetypes.reduce((s, a) => s + a.wisdom, 0) / (archetypes.length || 1);
    const insightParts: string[] = [
      `Synthesis across ${domainList.length} domains (${domainList.slice(0, 4).join(", ")}${domainList.length > 4 ? `, +${domainList.length - 4} more` : ""}) spanning ${eraList.join(", ")}.`,
      `Analysis reveals ${crossReferences.length > 0 ? `cross-domain connections: ${crossReferences.slice(0, 2).join("; ")}` : "foundational patterns emerging from independent knowledge streams"}.`,
      `Historical wisdom from key figures (avg archetype wisdom: ${Math.round(archetypeWisdom)}/100) informs a ${confidence > 70 ? "robust" : "developing"} understanding of "${query}".`,
      `Memory layer contributed ${matches} relevant references. Combined knowledge weight: ${Math.round(avgWeight * 100)}%.`
    ];
    if (crossReferences.length > 0) {
      insightParts.push(`Cross-era synthesis: ${crossReferences[0]}.`);
    }
    const insight = insightParts.join(" ");
    const synthesis: WisdomSynthesis = {
      id: `wisdom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      title: `Synthesis: ${query}`,
      domains: domainList,
      insight,
      confidence,
      timestamp: Date.now()
    };
    this.wisdomCache.push(synthesis);
    const eraTags = eraList.map(e => `era:${e}`);
    this.memoryEngine.setLongTerm(
      `supermind_synthesis_${synthesis.id}`,
      synthesis,
      ["supermind", "synthesis", ...domainList.map(d => d.toLowerCase().replace(/\s+/g, "-")), ...eraTags]
    );
    return synthesis;
  }

  getKnowledgeLevel(): number {
    const base = 35;
    const domainBonus = Math.min(25, this.domains.length * 0.8);
    const wisdomBonus = Math.min(25, this.wisdomCache.length * 3);
    const searchSum = this.domains.reduce((s, d) => {
      const results = this.memoryEngine.searchKnowledge(d.name);
      return s + results.length;
    }, 0);
    const knowledgeBonus = Math.min(15, searchSum);
    return Math.min(100, Math.round(base + domainBonus + wisdomBonus + knowledgeBonus));
  }

  crossReference(domain1: string, domain2: string): WisdomSynthesis {
    const d1 = this.domains.find(d => d.name === domain1);
    const d2 = this.domains.find(d => d.name === domain2);
    const d1Name = d1?.name ?? domain1;
    const d2Name = d2?.name ?? domain2;
    const sharedFigures = d1 && d2 ? d1.key_figures.filter(f => d2.key_figures.includes(f)) : [];
    const combinedSubdomains = d1 && d2 ? [...new Set([...d1.subdomains, ...d2.subdomains])] : [];
    const avgWeight = ((d1?.weight ?? 50) + (d2?.weight ?? 50)) / 2;
    const eraSpan = d1 && d2 && d1.era !== d2.era ? "cross-era" : "intra-era";
    const sharedCount = sharedFigures.length;
    const insight = `Cross-reference between ${d1Name} and ${d2Name}: ${eraSpan} analysis. ${sharedCount > 0 ? `Shared key figures: ${sharedFigures.join(", ")}. ` : ""}Combined subdomains (${combinedSubdomains.length}): ${combinedSubdomains.slice(0, 5).join(", ")}${combinedSubdomains.length > 5 ? "..." : ""}. Knowledge overlap score: ${Math.round(avgWeight)}/100.`;
    return {
      id: `crossref_${d1Name.replace(/\s+/g, "_")}_${d2Name.replace(/\s+/g, "_")}_${Date.now()}`,
      title: `${d1Name} x ${d2Name}`,
      domains: [d1Name, d2Name],
      insight,
      confidence: Math.round(avgWeight),
      timestamp: Date.now()
    };
  }

  evolve(newInsight: string, confidence: number): void {
    const synthesis: WisdomSynthesis = {
      id: `evolved_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      title: "Evolved Knowledge",
      domains: ["All"],
      insight: newInsight,
      confidence: Math.min(100, Math.max(0, confidence)),
      timestamp: Date.now()
    };
    this.wisdomCache.push(synthesis);
    this.memoryEngine.setLongTerm(
      `supermind_evolved_${synthesis.id}`,
      synthesis,
      ["supermind", "evolved", "insight"]
    );
    this.memoryEngine.addKnowledge(
      "Evolved Insight: " + newInsight.slice(0, 60),
      "SUPERMIND_EVOLVED",
      newInsight,
      ["supermind", "evolved", `confidence_${confidence}`]
    );
  }

  getWisdom(): WisdomSynthesis[] {
    return [...this.wisdomCache];
  }

  getEraKnowledge(eraName: string): number {
    const era = SuperMind.ERAS.find(e => e.name === eraName);
    if (!era) return 0;
    const eraDomains = this.domains.filter(d => {
      const eraParts = d.era.split("-");
      const domainStart = parseInt(eraParts[0].replace("s", ""), 10);
      const eraEnd = parseInt(era.years.split("-")[1], 10);
      const eraStart = parseInt(era.years.split("-")[0], 10);
      return domainStart >= eraStart && domainStart <= eraEnd;
    });
    if (eraDomains.length === 0) return Math.round(era.weight * 100);
    const avgDomainWeight = eraDomains.reduce((s, d) => s + d.weight, 0) / eraDomains.length;
    const eraWeight = era.weight;
    const totalKnowledge = this.memoryEngine.listKnowledge("SUPERMIND_DOMAIN").length;
    const knowledgeFactor = Math.min(1, totalKnowledge / this.domains.length);
    return Math.round((avgDomainWeight * 0.5 + eraWeight * 100 * 0.3 + knowledgeFactor * 100 * 0.2));
  }

  queryKnowledge(agent: IAgent): SuperMindKnowledge[] {
    const pool: SuperMindKnowledge[] = [];
    const agentCapabilities = agent.capabilities.map(c => c.toLowerCase());
    const matchingDomains = this.domains.filter(d =>
      d.subdomains.some(s => agentCapabilities.some(c => c.includes(s))) ||
      d.key_figures.some(f => agentCapabilities.some(c => c.includes(f)))
    );
    for (const domain of matchingDomains) {
      const relevance = Math.min(100, domain.weight);
      pool.push({
        topic: domain.name,
        relevance: relevance / 100,
        source: "supermind_domain",
        content: `${domain.name}: ${domain.subdomains.slice(0, 3).join(", ")}. Key figures: ${domain.key_figures.slice(0, 3).join(", ")}.`
      });
    }
    const archetypes = getAllArchetypes();
    for (const arch of archetypes) {
      const matchCount = arch.specialties.filter(s =>
        agentCapabilities.some(c => c.includes(s.toLowerCase()))
      ).length;
      if (matchCount > 0) {
        pool.push({
          topic: arch.name,
          relevance: Math.min(1, (arch.wisdom / 100) * (matchCount / arch.specialties.length)),
          source: "archetype",
          content: `${arch.name} (${arch.era}): ${arch.knowledge_areas.join(", ")}`
        });
      }
    }
    if (pool.length === 0) {
      const topDomains = this.domains.sort((a, b) => b.weight - a.weight).slice(0, 5);
      for (const domain of topDomains) {
        pool.push({
          topic: domain.name,
          relevance: domain.weight / 100,
          source: "supermind_general",
          content: `${domain.name}: general knowledge from ${domain.era}`
        });
      }
    }
    return pool.sort((a, b) => b.relevance - a.relevance);
  }

  crossReferenceKnowledge(agent: IAgent, knowledgePool: SuperMindKnowledge[]): SuperMindKnowledge[] {
    const enriched: SuperMindKnowledge[] = [];
    const topKnowledge = knowledgePool.slice(0, 10);
    for (let i = 0; i < topKnowledge.length; i++) {
      for (let j = i + 1; j < topKnowledge.length; j++) {
        const a = topKnowledge[i];
        const b = topKnowledge[j];
        const domainA = this.domains.find(d => d.name === a.topic);
        const domainB = this.domains.find(d => d.name === b.topic);
        if (domainA && domainB) {
          const shared = domainA.key_figures.filter(f => domainB.key_figures.includes(f));
          if (shared.length > 0) {
            enriched.push({
              topic: `${a.topic} x ${b.topic}`,
              relevance: Math.min(1, (a.relevance + b.relevance) / 2 + 0.1),
              source: "cross_reference",
              content: `Cross-reference: ${a.topic} and ${b.topic} share ${shared.join(", ")}. Combined weight: ${Math.round((domainA.weight + domainB.weight) / 2)}/100.`
            });
          }
        }
      }
    }
    const agentCaps = agent.capabilities.map(c => c.toLowerCase());
    for (const k of topKnowledge) {
      const capMatch = agentCaps.some(c => k.topic.toLowerCase().includes(c) || c.includes(k.topic.toLowerCase()));
      if (capMatch) {
        enriched.push({
          topic: `${k.topic} (aligned)`,
          relevance: Math.min(1, k.relevance + 0.15),
          source: "capability_alignment",
          content: `Direct capability alignment: ${k.topic} matches agent capabilities.`
        });
      }
    }
    return enriched;
  }

  getHybridKnowledge(agentA: IAgent, agentB: IAgent): SuperMindKnowledge[] {
    const poolA = this.queryKnowledge(agentA);
    const poolB = this.queryKnowledge(agentB);
    const hybrid: SuperMindKnowledge[] = [];
    const aTopics = new Set(poolA.map(k => k.topic));
    const bTopics = new Set(poolB.map(k => k.topic));
    for (const k of poolB) {
      if (!aTopics.has(k.topic)) {
        hybrid.push({
          topic: k.topic,
          relevance: k.relevance * 0.8,
          source: "hybrid_transfer_b_to_a",
          content: k.content
        });
      }
    }
    for (const k of poolA) {
      if (!bTopics.has(k.topic)) {
        hybrid.push({
          topic: k.topic,
          relevance: k.relevance * 0.8,
          source: "hybrid_transfer_a_to_b",
          content: k.content
        });
      }
    }
    const cross = this.crossReferenceKnowledge(agentA, poolA)
      .concat(this.crossReferenceKnowledge(agentB, poolB))
      .filter((k, i, arr) => arr.findIndex(x => x.topic === k.topic) === i);
    hybrid.push(...cross);
    return hybrid.sort((a, b) => b.relevance - a.relevance);
  }
}
