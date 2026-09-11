import fs from "fs";
import path from "path";

// TVS — MARKETPLACE (skills, agents, tools, templates, integrations)
// Persistent registry at data/marketplace/registry.json
// Categories: skill, agent, tool, template, integration, model
// Install/uninstall, ratings, search, featured, trending

export type PackageCategory = "skill" | "agent" | "tool" | "template" | "integration" | "model";
export type SortBy = "downloads" | "stars" | "rating" | "newest" | "updated" | "name";

export interface MarketplacePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  version: string;
  author: string;
  authorAvatar?: string;
  category: PackageCategory;
  tags: string[];
  license: string;
  repository: string;
  downloads: number;
  stars: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  changelog: { version: string; date: string; changes: string[] }[];
  dependencies: string[];
  minVersion: string;
  installCommand?: string;
  configSchema?: Record<string, unknown>;
}

export interface MarketplaceReview {
  id: string;
  packageId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  helpful: number;
}

export interface MarketplaceInstall {
  packageId: string;
  installedAt: string;
  version: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface MarketplaceSearchResult {
  packages: MarketplacePackage[];
  total: number;
  query: string;
  category?: string;
  sortBy: string;
}

export interface MarketplaceStats {
  totalPackages: number;
  totalDownloads: number;
  totalStars: number;
  categories: Record<string, number>;
  topPackages: MarketplacePackage[];
  recentInstalls: MarketplaceInstall[];
}

export interface ListPackagesOptions {
  category?: PackageCategory;
  sort?: SortBy;
  search?: string;
  featured?: boolean;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

function generateId(): string {
  return `mp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

const SEED_PACKAGES: MarketplacePackage[] = [
  {
    id: "code-assistant",
    name: "Code Assistant",
    slug: "code-assistant",
    description: "AI-powered code completion and refactoring suggestions",
    longDescription: "Intelligent code completion, refactoring suggestions, and inline documentation powered by local and cloud AI models. Supports TypeScript, JavaScript, Python, Go, Rust, and more. Integrates with your editor for real-time suggestions.",
    version: "2.4.0",
    author: "tvs-official",
    category: "skill",
    tags: ["ai", "code", "completion", "refactoring", "typescript", "python"],
    license: "MIT",
    repository: "https://github.com/tvs-official/code-assistant",
    downloads: 14520,
    stars: 892,
    rating: 4.8,
    reviewCount: 234,
    featured: true,
    verified: true,
    createdAt: "2025-11-10T08:00:00Z",
    updatedAt: "2026-08-28T14:30:00Z",
    changelog: [
      { version: "2.4.0", date: "2026-08-28", changes: ["Multi-line completions", "Python support", "Performance 2x faster"] },
      { version: "2.3.0", date: "2026-07-15", changes: ["Go/Rust support", "Inline docs"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "git-smart-commit",
    name: "Git Smart Commit",
    slug: "git-smart-commit",
    description: "Generate meaningful commit messages from staged changes using AI",
    longDescription: "Automatically generates clear, conventional commit messages by analyzing your staged git diff. Supports Conventional Commits, Angular, and custom formats. Integrates with git hooks for seamless workflow.",
    version: "1.8.2",
    author: "tvs-official",
    category: "tool",
    tags: ["git", "commit", "ai", "conventional-commits", "workflow"],
    license: "MIT",
    repository: "https://github.com/tvs-official/git-smart-commit",
    downloads: 8730,
    stars: 645,
    rating: 4.6,
    reviewCount: 189,
    featured: true,
    verified: true,
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-08-20T09:15:00Z",
    changelog: [
      { version: "1.8.2", date: "2026-08-20", changes: ["Custom format templates", "Scoped commit support"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "auto-deploy",
    name: "Auto Deploy",
    slug: "auto-deploy",
    description: "Zero-config automatic deployment to Vercel, Render, and custom servers",
    longDescription: "Detect your project framework and deploy automatically to the best hosting provider. Supports Vercel, Render, Railway, DigitalOcean, and custom SSH targets. Environment variable management included.",
    version: "3.1.0",
    author: "tvs-official",
    category: "integration",
    tags: ["deploy", "vercel", "render", "ci-cd", "devops", "automation"],
    license: "MIT",
    repository: "https://github.com/tvs-official/auto-deploy",
    downloads: 6890,
    stars: 512,
    rating: 4.5,
    reviewCount: 156,
    featured: false,
    verified: true,
    createdAt: "2025-10-15T12:00:00Z",
    updatedAt: "2026-09-01T11:00:00Z",
    changelog: [
      { version: "3.1.0", date: "2026-09-01", changes: ["Railway support", "Env var sync", "Preview deploys"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "security-scanner",
    name: "Security Scanner",
    slug: "security-scanner",
    description: "Detect vulnerabilities, secrets, and misconfigurations in your codebase",
    longDescription: "Scans your repository for known CVEs, hardcoded secrets, insecure patterns, and misconfigurations. Generates actionable reports with fix suggestions. Supports Node.js, Python, Go, Docker, and Kubernetes configs.",
    version: "2.0.1",
    author: "tvs-official",
    category: "tool",
    tags: ["security", "vulnerability", "secrets", "scan", "devsecops"],
    license: "Apache-2.0",
    repository: "https://github.com/tvs-official/security-scanner",
    downloads: 11200,
    stars: 734,
    rating: 4.7,
    reviewCount: 198,
    featured: true,
    verified: true,
    createdAt: "2025-09-20T08:00:00Z",
    updatedAt: "2026-08-15T16:00:00Z",
    changelog: [
      { version: "2.0.1", date: "2026-08-15", changes: ["K8s manifest scanning", "Dockerfile linting", "CI integration"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "api-tester",
    name: "API Tester",
    slug: "api-tester",
    description: "Automated API testing with AI-generated test cases and assertions",
    longDescription: "Auto-generates comprehensive API test suites from OpenAPI specs or by crawling endpoints. Supports REST, GraphQL, and WebSocket. Generates assertions, mocks, and performance benchmarks.",
    version: "1.5.0",
    author: "tvs-official",
    category: "tool",
    tags: ["api", "testing", "openapi", "graphql", "automation"],
    license: "MIT",
    repository: "https://github.com/tvs-official/api-tester",
    downloads: 5430,
    stars: 389,
    rating: 4.4,
    reviewCount: 112,
    featured: false,
    verified: true,
    createdAt: "2026-01-05T14:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z",
    changelog: [
      { version: "1.5.0", date: "2026-08-25", changes: ["GraphQL testing", "WebSocket support", "Performance benchmarks"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "db-migrator",
    name: "DB Migrator",
    slug: "db-migrator",
    description: "Database schema migration tool with AI-assisted rollback generation",
    longDescription: "Manages database migrations across PostgreSQL, MySQL, SQLite, and MongoDB. AI generates safe rollback scripts. Detects schema drift and suggests fixes. Supports zero-downtime migrations.",
    version: "2.2.3",
    author: "tvs-official",
    category: "tool",
    tags: ["database", "migration", "postgresql", "mysql", "schema"],
    license: "MIT",
    repository: "https://github.com/tvs-official/db-migrator",
    downloads: 4210,
    stars: 301,
    rating: 4.3,
    reviewCount: 87,
    featured: false,
    verified: true,
    createdAt: "2025-11-25T09:00:00Z",
    updatedAt: "2026-08-18T13:00:00Z",
    changelog: [
      { version: "2.2.3", date: "2026-08-18", changes: ["MongoDB support", "Drift detection", "Zero-downtime mode"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "doc-generator",
    name: "Doc Generator",
    slug: "doc-generator",
    description: "Auto-generate documentation from code comments, types, and usage patterns",
    longDescription: "Extracts JSDoc, TSDoc, and Python docstrings to generate comprehensive documentation sites. Supports Markdown, MDX, and Docusaurus output. AI fills gaps in existing docs.",
    version: "1.9.0",
    author: "tvs-official",
    category: "skill",
    tags: ["documentation", "jsdoc", "markdown", "docusaurus", "automation"],
    license: "MIT",
    repository: "https://github.com/tvs-official/doc-generator",
    downloads: 3870,
    stars: 267,
    rating: 4.2,
    reviewCount: 78,
    featured: false,
    verified: true,
    createdAt: "2026-02-10T11:00:00Z",
    updatedAt: "2026-08-22T15:00:00Z",
    changelog: [
      { version: "1.9.0", date: "2026-08-22", changes: ["Docusaurus output", "AI gap-filling", "MDX support"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "test-runner",
    name: "Test Runner",
    slug: "test-runner",
    description: "Intelligent test execution with parallelization and flaky test detection",
    longDescription: "Optimizes test execution by detecting dependencies, parallelizing safely, and identifying flaky tests. Supports Jest, Vitest, Mocha, Pytest, and Go test. Generates coverage reports and failure analysis.",
    version: "2.0.0",
    author: "tvs-official",
    category: "tool",
    tags: ["testing", "jest", "vitest", "coverage", "ci-cd"],
    license: "MIT",
    repository: "https://github.com/tvs-official/test-runner",
    downloads: 6100,
    stars: 423,
    rating: 4.5,
    reviewCount: 134,
    featured: false,
    verified: true,
    createdAt: "2025-10-08T08:00:00Z",
    updatedAt: "2026-09-02T09:00:00Z",
    changelog: [
      { version: "2.0.0", date: "2026-09-02", changes: ["Flaky test detection", "Dependency graph", "Go test support"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "perf-monitor",
    name: "Performance Monitor",
    slug: "perf-monitor",
    description: "Real-time performance monitoring with bottleneck detection and alerts",
    longDescription: "Monitors CPU, memory, network, and application-specific metrics in real-time. AI detects anomalies and suggests optimizations. Integrates with Grafana, Datadog, and custom dashboards.",
    version: "1.7.1",
    author: "tvs-official",
    category: "tool",
    tags: ["performance", "monitoring", "alerts", "grafana", "profiling"],
    license: "Apache-2.0",
    repository: "https://github.com/tvs-official/perf-monitor",
    downloads: 5670,
    stars: 398,
    rating: 4.4,
    reviewCount: 102,
    featured: false,
    verified: true,
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-08-30T14:00:00Z",
    changelog: [
      { version: "1.7.1", date: "2026-08-30", changes: ["Anomaly detection", "Grafana dashboard", "Custom metrics"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "log-analyzer",
    name: "Log Analyzer",
    slug: "log-analyzer",
    description: "AI-powered log analysis with pattern detection and root cause suggestions",
    longDescription: "Ingests application logs from files, stdout, and cloud services. Detects error patterns, correlates events, and suggests root causes. Supports structured (JSON) and unstructured logs.",
    version: "1.4.0",
    author: "tvs-official",
    category: "tool",
    tags: ["logging", "analysis", "debugging", "devops", "observability"],
    license: "MIT",
    repository: "https://github.com/tvs-official/log-analyzer",
    downloads: 3450,
    stars: 245,
    rating: 4.3,
    reviewCount: 67,
    featured: false,
    verified: true,
    createdAt: "2026-03-01T12:00:00Z",
    updatedAt: "2026-08-27T16:00:00Z",
    changelog: [
      { version: "1.4.0", date: "2026-08-27", changes: ["Cloud log ingestion", "Root cause suggestions", "Correlation engine"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "email-agent",
    name: "Email Agent",
    slug: "email-agent",
    description: "Automated email drafting, sending, and follow-up management",
    longDescription: "AI composes professional emails, manages contact lists, schedules sends, and handles follow-up sequences. Integrates with Gmail, Outlook, and SMTP servers. Tracks opens and responses.",
    version: "2.1.0",
    author: "tvs-official",
    category: "agent",
    tags: ["email", "automation", "gmail", "outlook", "crm"],
    license: "MIT",
    repository: "https://github.com/tvs-official/email-agent",
    downloads: 7890,
    stars: 567,
    rating: 4.6,
    reviewCount: 167,
    featured: true,
    verified: true,
    createdAt: "2025-12-15T09:00:00Z",
    updatedAt: "2026-09-01T08:00:00Z",
    changelog: [
      { version: "2.1.0", date: "2026-09-01", changes: ["Follow-up sequences", "Open tracking", "Outlook support"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "social-poster",
    name: "Social Poster",
    slug: "social-poster",
    description: "Multi-platform social media posting with AI content generation",
    longDescription: "Creates and schedules posts across Twitter/X, LinkedIn, Instagram, and TikTok. AI generates captions, hashtags, and suggests optimal posting times. Supports image and video attachments.",
    version: "1.6.2",
    author: "tvs-official",
    category: "agent",
    tags: ["social-media", "twitter", "linkedin", "instagram", "scheduling"],
    license: "MIT",
    repository: "https://github.com/tvs-official/social-poster",
    downloads: 4560,
    stars: 334,
    rating: 4.3,
    reviewCount: 98,
    featured: false,
    verified: true,
    createdAt: "2026-02-20T11:00:00Z",
    updatedAt: "2026-08-29T12:00:00Z",
    changelog: [
      { version: "1.6.2", date: "2026-08-29", changes: ["TikTok support", "Video scheduling", "Analytics dashboard"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "invoice-generator",
    name: "Invoice Generator",
    slug: "invoice-generator",
    description: "Professional invoice creation with templates, taxes, and payment tracking",
    longDescription: "Generates professional PDF invoices with customizable templates. Supports multiple currencies, tax rules (VAT, IVA), and payment gateways. Tracks payment status and sends reminders.",
    version: "1.3.0",
    author: "tvs-official",
    category: "tool",
    tags: ["invoice", "billing", "pdf", "taxes", "accounting"],
    license: "MIT",
    repository: "https://github.com/tvs-official/invoice-generator",
    downloads: 2890,
    stars: 198,
    rating: 4.2,
    reviewCount: 54,
    featured: false,
    verified: true,
    createdAt: "2026-04-10T14:00:00Z",
    updatedAt: "2026-08-26T10:00:00Z",
    changelog: [
      { version: "1.3.0", date: "2026-08-26", changes: ["Multi-currency", "Payment gateway integration", "Reminder emails"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "lead-scorer",
    name: "Lead Scorer",
    slug: "lead-scorer",
    description: "AI-driven lead qualification and scoring from multiple data sources",
    longDescription: "Scores incoming leads based on behavior, firmographics, and engagement. Integrates with CRM, email, and website analytics. Prioritizes outreach for maximum conversion.",
    version: "1.2.0",
    author: "tvs-official",
    category: "agent",
    tags: ["leads", "scoring", "crm", "sales", "qualification"],
    license: "MIT",
    repository: "https://github.com/tvs-official/lead-scorer",
    downloads: 2340,
    stars: 178,
    rating: 4.1,
    reviewCount: 45,
    featured: false,
    verified: true,
    createdAt: "2026-05-01T09:00:00Z",
    updatedAt: "2026-08-24T11:00:00Z",
    changelog: [
      { version: "1.2.0", date: "2026-08-24", changes: ["Firmographic scoring", "Website behavior tracking", "CRM sync"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "crm-sync",
    name: "CRM Sync",
    slug: "crm-sync",
    description: "Bi-directional sync between your app and popular CRMs",
    longDescription: "Real-time synchronization with HubSpot, Salesforce, Pipedrive, and custom CRMs. Maps fields, deduplicates contacts, and syncs activities. Supports webhooks and polling.",
    version: "1.4.1",
    author: "tvs-official",
    category: "integration",
    tags: ["crm", "hubspot", "salesforce", "sync", "integration"],
    license: "MIT",
    repository: "https://github.com/tvs-official/crm-sync",
    downloads: 3120,
    stars: 223,
    rating: 4.2,
    reviewCount: 72,
    featured: false,
    verified: true,
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-09-03T09:00:00Z",
    changelog: [
      { version: "1.4.1", date: "2026-09-03", changes: ["Salesforce field mapping", "Deduplication engine", "Webhook improvements"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "slack-bot",
    name: "Slack Bot",
    slug: "slack-bot",
    description: "Configurable Slack bot with AI responses and workflow automation",
    longDescription: "Deploys a Slack bot that responds to commands, automates workflows, and integrates with your tools. Supports slash commands, buttons, modals, and scheduled messages.",
    version: "2.0.0",
    author: "tvs-official",
    category: "integration",
    tags: ["slack", "bot", "automation", "workflows", "chatops"],
    license: "MIT",
    repository: "https://github.com/tvs-official/slack-bot",
    downloads: 5890,
    stars: 412,
    rating: 4.5,
    reviewCount: 118,
    featured: false,
    verified: true,
    createdAt: "2025-12-20T13:00:00Z",
    updatedAt: "2026-08-31T15:00:00Z",
    changelog: [
      { version: "2.0.0", date: "2026-08-31", changes: ["Modal support", "Scheduled messages", "Multi-workspace"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "github-actions",
    name: "GitHub Actions Templates",
    slug: "github-actions",
    description: "Battle-tested CI/CD workflow templates for GitHub Actions",
    longDescription: "Pre-built GitHub Actions workflows for common tasks: deploy, test, lint, security scan, release, and more. Customizable YAML templates with secrets management and caching.",
    version: "3.2.0",
    author: "tvs-official",
    category: "template",
    tags: ["github", "actions", "ci-cd", "yaml", "templates"],
    license: "MIT",
    repository: "https://github.com/tvs-official/github-actions",
    downloads: 9210,
    stars: 678,
    rating: 4.7,
    reviewCount: 201,
    featured: true,
    verified: true,
    createdAt: "2025-11-01T08:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
    changelog: [
      { version: "3.2.0", date: "2026-09-02", changes: ["Release workflow", "Security scanning", "Cache optimization"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "docker-templates",
    name: "Docker Templates",
    slug: "docker-templates",
    description: "Production-ready Dockerfile and docker-compose templates for common stacks",
    longDescription: "Optimized Docker configurations for Node.js, Python, Go, Rust, and Java applications. Includes multi-stage builds, health checks, security hardening, and docker-compose with databases.",
    version: "2.1.0",
    author: "tvs-official",
    category: "template",
    tags: ["docker", "containers", "devops", "templates", "compose"],
    license: "MIT",
    repository: "https://github.com/tvs-official/docker-templates",
    downloads: 7650,
    stars: 534,
    rating: 4.6,
    reviewCount: 145,
    featured: false,
    verified: true,
    createdAt: "2025-10-20T11:00:00Z",
    updatedAt: "2026-08-28T14:00:00Z",
    changelog: [
      { version: "2.1.0", date: "2026-08-28", changes: ["Rust template", "Health checks", "Security hardening"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "k8s-deployer",
    name: "Kubernetes Deployer",
    slug: "k8s-deployer",
    description: "Simplified Kubernetes deployment with Helm charts and manifest generation",
    longDescription: "Generates Kubernetes manifests and Helm charts from your application config. Supports Deployments, Services, Ingress, ConfigMaps, Secrets, and HPA. Includes rollback and diff capabilities.",
    version: "1.8.0",
    author: "tvs-official",
    category: "tool",
    tags: ["kubernetes", "helm", "deploy", "devops", "cloud-native"],
    license: "Apache-2.0",
    repository: "https://github.com/tvs-official/k8s-deployer",
    downloads: 4890,
    stars: 356,
    rating: 4.4,
    reviewCount: 93,
    featured: false,
    verified: true,
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-09-01T16:00:00Z",
    changelog: [
      { version: "1.8.0", date: "2026-09-01", changes: ["Helm chart generation", "Rollback support", "Manifest diff"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
  {
    id: "ai-researcher",
    name: "AI Researcher",
    slug: "ai-researcher",
    description: "Autonomous research agent that gathers, summarizes, and cites sources",
    longDescription: "Performs deep research on any topic by searching the web, reading documents, and synthesizing findings. Generates structured reports with citations. Supports academic papers, news, and technical docs.",
    version: "2.3.0",
    author: "tvs-official",
    category: "agent",
    tags: ["research", "ai", "summarization", "citations", "web-search"],
    license: "MIT",
    repository: "https://github.com/tvs-official/ai-researcher",
    downloads: 8450,
    stars: 623,
    rating: 4.7,
    reviewCount: 176,
    featured: true,
    verified: true,
    createdAt: "2025-12-10T10:00:00Z",
    updatedAt: "2026-09-03T11:00:00Z",
    changelog: [
      { version: "2.3.0", date: "2026-09-03", changes: ["Academic paper support", "Structured reports", "Multi-source synthesis"] },
    ],
    dependencies: [],
    minVersion: "1.0.0",
  },
];

export class Marketplace {
  private registryPath: string;
  private installsPath: string;
  private reviewsPath: string;
  private packages: MarketplacePackage[] = [];
  private installs: MarketplaceInstall[] = [];
  private reviews: MarketplaceReview[] = [];

  constructor(dataDir: string) {
    this.registryPath = path.join(dataDir, "marketplace", "registry.json");
    this.installsPath = path.join(dataDir, "marketplace", "installs.json");
    this.reviewsPath = path.join(dataDir, "marketplace", "reviews.json");
    this.ensureDirs(dataDir);
    this.load();
  }

  private ensureDirs(dataDir: string): void {
    const dir = path.join(dataDir, "marketplace");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  private load(): void {
    try {
      if (fs.existsSync(this.registryPath)) {
        const raw = fs.readFileSync(this.registryPath, "utf-8");
        this.packages = JSON.parse(raw);
      }
    } catch { this.packages = []; }

    try {
      if (fs.existsSync(this.installsPath)) {
        const raw = fs.readFileSync(this.installsPath, "utf-8");
        this.installs = JSON.parse(raw);
      }
    } catch { this.installs = []; }

    try {
      if (fs.existsSync(this.reviewsPath)) {
        const raw = fs.readFileSync(this.reviewsPath, "utf-8");
        this.reviews = JSON.parse(raw);
      }
    } catch { this.reviews = []; }

    if (this.packages.length === 0) {
      this.packages = [...SEED_PACKAGES];
      this.persistRegistry();
    }
  }

  private persistRegistry(): void {
    fs.writeFileSync(this.registryPath, JSON.stringify(this.packages, null, 2), "utf-8");
  }

  private persistInstalls(): void {
    fs.writeFileSync(this.installsPath, JSON.stringify(this.installs, null, 2), "utf-8");
  }

  private persistReviews(): void {
    fs.writeFileSync(this.reviewsPath, JSON.stringify(this.reviews, null, 2), "utf-8");
  }

  // ── Packages ──────────────────────────────────────────────

  listPackages(options: ListPackagesOptions = {}): MarketplacePackage[] {
    let result = [...this.packages];

    if (options.category) {
      result = result.filter((p) => p.category === options.category);
    }
    if (options.featured !== undefined) {
      result = result.filter((p) => p.featured === options.featured);
    }
    if (options.verified !== undefined) {
      result = result.filter((p) => p.verified === options.verified);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.author.toLowerCase().includes(q)
      );
    }

    const sort = options.sort || "downloads";
    result.sort((a, b) => {
      switch (sort) {
        case "downloads": return b.downloads - a.downloads;
        case "stars": return b.stars - a.stars;
        case "rating": return b.rating - a.rating;
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "name": return a.name.localeCompare(b.name);
        default: return b.downloads - a.downloads;
      }
    });

    const offset = options.offset || 0;
    const limit = options.limit || 100;
    return result.slice(offset, offset + limit);
  }

  getPackage(id: string): MarketplacePackage | undefined {
    return this.packages.find((p) => p.id === id || p.slug === id);
  }

  createPackage(data: Omit<MarketplacePackage, "id" | "downloads" | "stars" | "rating" | "reviewCount" | "createdAt" | "updatedAt" | "changelog"> & { id?: string; changelog?: MarketplacePackage["changelog"] }): MarketplacePackage {
    const pkgId = data.id || data.slug;
    const exists = this.packages.find((p) => p.id === pkgId || p.slug === data.slug);
    if (exists) throw new Error(`Package ${pkgId} already exists`);

    const pkg: MarketplacePackage = {
      ...data,
      id: pkgId,
      downloads: 0,
      stars: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: now(),
      updatedAt: now(),
      changelog: data.changelog || [{ version: data.version, date: now().split("T")[0], changes: ["Initial release"] }],
    };

    this.packages.push(pkg);
    this.persistRegistry();
    return pkg;
  }

  updatePackage(id: string, data: Partial<MarketplacePackage>): MarketplacePackage | undefined {
    const idx = this.packages.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    const existing = this.packages[idx];
    const updated: MarketplacePackage = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: now(),
    };

    if (data.version && data.version !== existing.version) {
      updated.changelog = [
        { version: data.version, date: now().split("T")[0], changes: data.changelog?.[0]?.changes || ["Version update"] },
        ...existing.changelog,
      ];
    }

    this.packages[idx] = updated;
    this.persistRegistry();
    return updated;
  }

  deletePackage(id: string): boolean {
    const idx = this.packages.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    this.packages.splice(idx, 1);
    this.persistRegistry();

    this.installs = this.installs.filter((i) => i.packageId !== id);
    this.persistInstalls();

    this.reviews = this.reviews.filter((r) => r.packageId !== id);
    this.persistReviews();

    return true;
  }

  getFeatured(): MarketplacePackage[] {
    return this.packages.filter((p) => p.featured).sort((a, b) => b.stars - a.stars);
  }

  getPopular(limit: number = 10): MarketplacePackage[] {
    return [...this.packages].sort((a, b) => b.downloads - a.downloads).slice(0, limit);
  }

  getRecent(limit: number = 10): MarketplacePackage[] {
    return [...this.packages].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, limit);
  }

  // ── Install / Uninstall ──────────────────────────────────

  installPackage(id: string, config?: Record<string, unknown>): MarketplaceInstall | undefined {
    const pkg = this.getPackage(id);
    if (!pkg) return undefined;

    const existing = this.installs.find((i) => i.packageId === id);
    if (existing) {
      existing.version = pkg.version;
      existing.enabled = true;
      if (config) existing.config = config;
      this.persistInstalls();
      return existing;
    }

    const install: MarketplaceInstall = {
      packageId: id,
      installedAt: now(),
      version: pkg.version,
      enabled: true,
      config,
    };

    this.installs.push(install);
    pkg.downloads += 1;
    this.persistInstalls();
    this.persistRegistry();
    return install;
  }

  uninstallPackage(id: string): boolean {
    const idx = this.installs.findIndex((i) => i.packageId === id);
    if (idx === -1) return false;
    this.installs.splice(idx, 1);
    this.persistInstalls();
    return true;
  }

  updatePackageInstall(id: string): MarketplaceInstall | undefined {
    const pkg = this.getPackage(id);
    if (!pkg) return undefined;

    const install = this.installs.find((i) => i.packageId === id);
    if (!install) return undefined;

    install.version = pkg.version;
    install.installedAt = now();
    this.persistInstalls();
    return install;
  }

  listInstalled(): MarketplaceInstall[] {
    return [...this.installs];
  }

  enablePackage(id: string): boolean {
    const install = this.installs.find((i) => i.packageId === id);
    if (!install) return false;
    install.enabled = true;
    this.persistInstalls();
    return true;
  }

  disablePackage(id: string): boolean {
    const install = this.installs.find((i) => i.packageId === id);
    if (!install) return false;
    install.enabled = false;
    this.persistInstalls();
    return true;
  }

  // ── Reviews ──────────────────────────────────────────────

  addReview(data: { packageId: string; userId: string; userName: string; rating: number; title: string; content: string }): MarketplaceReview | undefined {
    const pkg = this.getPackage(data.packageId);
    if (!pkg) return undefined;

    if (data.rating < 1 || data.rating > 5) throw new Error("Rating must be between 1 and 5");

    const review: MarketplaceReview = {
      id: generateId(),
      packageId: data.packageId,
      userId: data.userId,
      userName: data.userName,
      rating: data.rating,
      title: data.title,
      content: data.content,
      createdAt: now(),
      helpful: 0,
    };

    this.reviews.push(review);

    const pkgReviews = this.reviews.filter((r) => r.packageId === data.packageId);
    pkg.reviewCount = pkgReviews.length;
    pkg.rating = parseFloat((pkgReviews.reduce((sum, r) => sum + r.rating, 0) / pkgReviews.length).toFixed(1));
    this.persistRegistry();
    this.persistReviews();

    return review;
  }

  getReviews(packageId: string): MarketplaceReview[] {
    return this.reviews.filter((r) => r.packageId === packageId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  helpfulReview(reviewId: string): boolean {
    const review = this.reviews.find((r) => r.id === reviewId);
    if (!review) return false;
    review.helpful += 1;
    this.persistReviews();
    return true;
  }

  // ── Search ───────────────────────────────────────────────

  search(query: string, options: { category?: PackageCategory; sort?: SortBy; limit?: number } = {}): MarketplaceSearchResult {
    const packages = this.listPackages({
      search: query,
      category: options.category,
      sort: options.sort || "downloads",
      limit: options.limit || 50,
    });

    return {
      packages,
      total: packages.length,
      query,
      category: options.category,
      sortBy: options.sort || "downloads",
    };
  }

  searchByCategory(category: PackageCategory): MarketplacePackage[] {
    return this.listPackages({ category, sort: "downloads" });
  }

  // ── Stats ────────────────────────────────────────────────

  getStats(): MarketplaceStats {
    const categories: Record<string, number> = {};
    let totalDownloads = 0;
    let totalStars = 0;

    for (const pkg of this.packages) {
      categories[pkg.category] = (categories[pkg.category] || 0) + 1;
      totalDownloads += pkg.downloads;
      totalStars += pkg.stars;
    }

    const topPackages = [...this.packages].sort((a, b) => b.downloads - a.downloads).slice(0, 10);
    const recentInstalls = [...this.installs].sort((a, b) => new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime()).slice(0, 10);

    return {
      totalPackages: this.packages.length,
      totalDownloads,
      totalStars,
      categories,
      topPackages,
      recentInstalls,
    };
  }

  getTrending(): MarketplacePackage[] {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentInstalls = this.installs.filter((i) => new Date(i.installedAt).getTime() > oneWeekAgo);

    const installCounts: Record<string, number> = {};
    for (const i of recentInstalls) {
      installCounts[i.packageId] = (installCounts[i.packageId] || 0) + 1;
    }

    const trendingIds = Object.entries(installCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const fromRegistry = trendingIds.map((id) => this.packages.find((p) => p.id === id)).filter(Boolean) as MarketplacePackage[];

    if (fromRegistry.length < 10) {
      const existing = new Set(fromRegistry.map((p) => p.id));
      const extras = this.packages
        .filter((p) => !existing.has(p.id))
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 10 - fromRegistry.length);
      fromRegistry.push(...extras);
    }

    return fromRegistry;
  }
}
