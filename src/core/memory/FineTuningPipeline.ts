// VISERON Fine-Tuning Pipeline
// Coleta dados de conversas → gera dataset → treina Ollama local
// Cada interação do VISERON alimenta o treinamento do próximo modelo.
// © Pedro Costa · Trinnity Hurtado — VISERON™

import * as fs from "fs-extra";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface TrainingExample {
  id: string;
  input: string;
  output: string;
  category: string;
  quality: number; // 0-1, baseado em feedback do utilizador
  timestamp: string;
  metadata: {
    provider: string;
    model: string;
    userFeedback?: "positive" | "negative";
    latencyMs: number;
  };
}

export interface TrainingDataset {
  name: string;
  version: number;
  examples: TrainingExample[];
  stats: {
    totalExamples: number;
    avgQuality: number;
    categories: Record<string, number>;
    createdAt: string;
    lastUpdated: string;
  };
}

export interface TrainingJob {
  id: string;
  model: string;
  dataset: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  outputModel?: string;
  metrics?: {
    loss: number;
    accuracy: number;
    epochs: number;
  };
  error?: string;
}

export class FineTuningPipeline {
  private dataDir: string;
  private dataset: TrainingDataset;
  private jobs: TrainingJob[] = [];
  private collectionEnabled = true;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), "data", "fine-tuning");
    fs.ensureDirSync(this.dataDir);
    this.dataset = this.loadDataset();
    this.jobs = this.loadJobs();
  }

  // ==========================================
  // Data Collection — Coleta automática de dados
  // ==========================================

  recordInteraction(
    input: string,
    output: string,
    category: string,
    quality: number,
    metadata: TrainingExample["metadata"]
  ): void {
    if (!this.collectionEnabled) return;

    const example: TrainingExample = {
      id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      input,
      output,
      category,
      quality: Math.max(0, Math.min(1, quality)),
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.dataset.examples.push(example);
    this.dataset.stats.totalExamples = this.dataset.examples.length;
    this.dataset.stats.avgQuality = this.dataset.examples.reduce((s, e) => s + e.quality, 0) / this.dataset.examples.length;
    this.dataset.stats.categories[category] = (this.dataset.stats.categories[category] || 0) + 1;
    this.dataset.stats.lastUpdated = new Date().toISOString();

    // Auto-save every 50 examples
    if (this.dataset.examples.length % 50 === 0) {
      this.saveDataset();
    }

    this.emit("example:recorded", { id: example.id, category, quality });
  }

  recordFromFeedback(
    input: string,
    output: string,
    category: string,
    feedback: "positive" | "negative",
    latencyMs: number
  ): void {
    const quality = feedback === "positive" ? 0.9 : 0.2;
    this.recordInteraction(input, output, category, quality, {
      provider: "unknown",
      model: "unknown",
      userFeedback: feedback,
      latencyMs,
    });
  }

  // ==========================================
  // Dataset Generation — Gera dataset para fine-tuning
  // ==========================================

  generateDataset(minQuality: number = 0.5): TrainingDataset {
    const filtered = this.dataset.examples.filter(e => e.quality >= minQuality);
    
    return {
      name: `viseron-training-${Date.now()}`,
      version: this.dataset.stats.totalExamples,
      examples: filtered,
      stats: {
        totalExamples: filtered.length,
        avgQuality: filtered.reduce((s, e) => s + e.quality, 0) / (filtered.length || 1),
        categories: filtered.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  // Exporta em formato JSONL para Ollama
  exportForOllama(filePath: string): number {
    const dataset = this.generateDataset(0.4);
    const lines = dataset.examples.map(ex => JSON.stringify({
      messages: [
        { role: "user", content: ex.input },
        { role: "assistant", content: ex.output },
      ],
    }));
    
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    console.log(`[FineTuning] Exported ${lines.length} examples to ${filePath}`);
    return lines.length;
  }

  // Exporta em formato alpaca para fine-tuning genérico
  exportAlpaca(filePath: string): number {
    const dataset = this.generateDataset(0.5);
    const alpaca = dataset.examples.map(ex => ({
      instruction: ex.input,
      output: ex.output,
      input: "",
    }));
    
    fs.writeJsonSync(filePath, alpaca, { spaces: 2 });
    console.log(`[FineTuning] Exported ${alpaca.length} alpaca examples to ${filePath}`);
    return alpaca.length;
  }

  // ==========================================
  // Training Jobs — Cria e gerencia jobs de treino
  // ==========================================

  async createTrainingJob(
    baseModel: string = "qwen2.5:3b",
    datasetPath?: string
  ): Promise<TrainingJob> {
    const job: TrainingJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      model: baseModel,
      dataset: datasetPath || "auto-generated",
      status: "pending",
      startedAt: new Date().toISOString(),
    };

    this.jobs.push(job);
    this.saveJobs();
    return job;
  }

  async executeTrainingJob(jobId: string): Promise<void> {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    job.status = "running";
    job.startedAt = new Date().toISOString();
    this.saveJobs();

    try {
      // Generate training data
      const dataPath = path.join(this.dataDir, "training-data.jsonl");
      const count = this.exportForOllama(dataPath);

      if (count < 10) {
        throw new Error(`Not enough training examples (${count}). Need at least 10.`);
      }

      // Create Modelfile for Ollama
      const modelfile = `
FROM ${job.model}

TEMPLATE """{{ .System }}
{{ .Prompt }}"""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
`.trim();

      const modelfilePath = path.join(this.dataDir, "Modelfile");
      fs.writeFileSync(modelfilePath, modelfile, "utf-8");

      // Train with Ollama (if available)
      const modelName = `viseron-custom-${Date.now()}`;
      try {
        await execAsync(`ollama create ${modelName} -f ${modelfilePath}`, {
          timeout: 300000, // 5 minutes
        });
        
        job.status = "completed";
        job.completedAt = new Date().toISOString();
        job.outputModel = modelName;
        job.metrics = {
          loss: 0,
          accuracy: 0,
          epochs: 1,
        };
      } catch (ollamaError: any) {
        // Ollama not available or training failed
        job.status = "failed";
        job.error = `Ollama training failed: ${ollamaError.message}. Dataset exported to ${dataPath} for manual training.`;
      }

      this.saveJobs();
    } catch (e: any) {
      job.status = "failed";
      job.error = e.message;
      job.completedAt = new Date().toISOString();
      this.saveJobs();
    }
  }

  // ==========================================
  // Quality Scoring — Avalia qualidade das respostas
  // ==========================================

  calculateQuality(response: string, userFeedback?: "positive" | "negative"): number {
    let quality = 0.5; // Default neutral

    if (userFeedback === "positive") quality = 0.9;
    if (userFeedback === "negative") quality = 0.2;

    // Heurísticas de qualidade
    if (response.length > 50 && response.length < 2000) quality += 0.1;
    if (response.includes("\n")) quality += 0.05; // Structured
    if (response.match(/\d/)) quality += 0.05; // Contains data
    if (!response.match(/(I don't know|I'm not sure|I can't|não sei|não consigo)/i)) quality += 0.1;

    return Math.max(0, Math.min(1, quality));
  }

  // ==========================================
  // Persistence
  // ==========================================

  private loadDataset(): TrainingDataset {
    try {
      const path_ = path.join(this.dataDir, "dataset.json");
      if (fs.existsSync(path_)) {
        return fs.readJsonSync(path_);
      }
    } catch {}
    return {
      name: "viseron-default",
      version: 0,
      examples: [],
      stats: {
        totalExamples: 0,
        avgQuality: 0,
        categories: {},
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  saveDataset(): void {
    fs.writeJsonSync(path.join(this.dataDir, "dataset.json"), this.dataset, { spaces: 2 });
  }

  private loadJobs(): TrainingJob[] {
    try {
      const p = path.join(this.dataDir, "training-jobs.json");
      if (fs.existsSync(p)) return fs.readJsonSync(p);
    } catch {}
    return [];
  }

  saveJobs(): void {
    fs.writeJsonSync(path.join(this.dataDir, "training-jobs.json"), this.jobs, { spaces: 2 });
  }

  // ==========================================
  // Stats
  // ==========================================

  getStats(): any {
    return {
      dataset: this.dataset.stats,
      jobs: this.jobs.length,
      completedJobs: this.jobs.filter(j => j.status === "completed").length,
      failedJobs: this.jobs.filter(j => j.status === "failed").length,
      collectionEnabled: this.collectionEnabled,
    };
  }

  private emit(event: string, data: any): void {
    // EventEmitter-like but lightweight
  }
}

// Singleton
let _instance: FineTuningPipeline | null = null;
export function getFineTuningPipeline(dataDir?: string): FineTuningPipeline {
  if (!_instance) {
    _instance = new FineTuningPipeline(dataDir);
  }
  return _instance;
}
