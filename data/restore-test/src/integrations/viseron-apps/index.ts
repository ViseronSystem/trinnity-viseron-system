import { AgentManager } from "../../core/AgentManager";
import { ProviderFactory } from "../../core/providers/ProviderFactory";
import { ModelRouter } from "../../core/model-router/ModelRouter";
import { ToolManager } from "../../core/tools/ToolManager";
import { MemoryEngine } from "../../core/memory/MemoryEngine";
import { SmartAgent } from "../../core/agents/SmartAgent";
import type { IntegrationBridge } from "../contract";

import {
  createCifraSmartAgent, createCifraMessageRouterAgent,
  createCifraAutomationTools, getCifraIntegrationInfo
} from "./cifra-integration";

import {
  createProject1SmartAgent, createProject1MonitorAgent,
  createProject1AutomationTools, getProject1IntegrationInfo
} from "./project1-integration";

export interface ViseronAppIntegration {
  name: string;
  url: string;
  agents: SmartAgent[];
  status: 'connected' | 'unreachable' | 'pending';
  lastSync: number;
}

export class ViseronAppsIntegrationEngine implements IntegrationBridge {
  public readonly name = "Viseron Apps Integration Engine";
  private agentManager: AgentManager;
  private providerFactory: ProviderFactory;
  private modelRouter: ModelRouter;
  private toolManager: ToolManager;
  private memoryEngine: MemoryEngine;

  public integrations: ViseronAppIntegration[] = [];
  public allAgents: SmartAgent[] = [];

  constructor(
    agentManager: AgentManager,
    providerFactory: ProviderFactory,
    modelRouter: ModelRouter,
    toolManager: ToolManager,
    memoryEngine: MemoryEngine
  ) {
    this.agentManager = agentManager;
    this.providerFactory = providerFactory;
    this.modelRouter = modelRouter;
    this.toolManager = toolManager;
    this.memoryEngine = memoryEngine;
  }

  async initialize(): Promise<number> {
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`   VISERON APPS - INTEGRATION ENGINE`);
    console.log(`   Inyectando inteligencia TVS en apps Viseron`);
    console.log(`═══════════════════════════════════════════════\n`);

    await this.initializeCifra();
    await this.initializeProject1();

    this.registerKnowledge();
    this.logSummary();

    return this.allAgents.length;
  }

  private async initializeCifra(): Promise<void> {
    console.log(`[ViseronApps] Inicializando Cifra - Mensajería Cifrada...`);

    const cifraBot = createCifraSmartAgent(this.providerFactory, this.modelRouter);
    const cifraRouter = createCifraMessageRouterAgent(this.providerFactory, this.modelRouter);

    this.agentManager.register(cifraBot);
    this.agentManager.register(cifraRouter);

    createCifraAutomationTools(this.toolManager);

    this.allAgents.push(cifraBot, cifraRouter);

    this.integrations.push({
      name: "Cifra",
      url: "https://3000-xwjyungquxidwbkdeggilmrlglsukwoc.preview.same-app.com",
      agents: [cifraBot, cifraRouter],
      status: 'unreachable',
      lastSync: Date.now()
    });

    console.log(`[ViseronApps] ✓ Cifra: 2 agentes TVS creados (CifraBot + CifraRouter)`);
    console.log(`[ViseronApps] ✓ Cifra: 3 herramientas de automatización registradas`);
  }

  private async initializeProject1(): Promise<void> {
    console.log(`[ViseronApps] Inicializando Proyecto 1...`);

    const appAgent = createProject1SmartAgent(this.providerFactory, this.modelRouter);
    const monitorAgent = createProject1MonitorAgent(this.providerFactory, this.modelRouter);

    this.agentManager.register(appAgent);
    this.agentManager.register(monitorAgent);

    createProject1AutomationTools(this.toolManager);

    this.allAgents.push(appAgent, monitorAgent);

    this.integrations.push({
      name: "Proyecto 1",
      url: "https://3000-basyxsnctdjxygzmcteouabejhgpikyl.preview.same-app.com",
      agents: [appAgent, monitorAgent],
      status: 'unreachable',
      lastSync: Date.now()
    });

    console.log(`[ViseronApps] ✓ Proyecto 1: 2 agentes TVS creados (ViseronAppAgent + ViseronMonitor)`);
    console.log(`[ViseronApps] ✓ Proyecto 1: 2 herramientas de automatización registradas`);
  }

  private registerKnowledge(): void {
    for (const integration of this.integrations) {
      this.memoryEngine.addKnowledge(
        `Integración TVS: ${integration.name}`,
        'VISERON_APPS_INTEGRATIONS',
        `Integración completada para ${integration.name}. URL: ${integration.url}. Agentes asignados: ${integration.agents.map(a => a.name).join(', ')}. Estado: ${integration.status}`,
        ['viseron_apps', integration.name.toLowerCase().replace(/\s+/g, '_'), 'integration']
      );
    }

    this.memoryEngine.setLongTerm('viseron_apps_integrations', {
      count: this.integrations.length,
      totalAgents: this.allAgents.length,
      apps: this.integrations.map(i => i.name),
      timestamp: Date.now()
    }, ['viseron_apps', 'integration_summary']);
  }

  getStats(): { totalIntegrations: number; totalAgents: number; apps: string[] } {
    return {
      totalIntegrations: this.integrations.length,
      totalAgents: this.allAgents.length,
      apps: this.integrations.map(i => `${i.name} (${i.status})`)
    };
  }

  private logSummary(): void {
    console.log(`\n────────────────────────────────────────────────`);
    console.log(`   VISERON APPS INTEGRATION SUMMARY`);
    console.log(`────────────────────────────────────────────────`);
    for (const app of this.integrations) {
      console.log(`   📱 ${app.name}`);
      console.log(`      URL: ${app.url}`);
      console.log(`      Agentes: ${app.agents.map(a => a.name).join(', ')}`);
      console.log(`      Estado: ${app.status}`);
    }
    console.log(`────────────────────────────────────────────────`);
    console.log(`   Total: ${this.integrations.length} apps integradas`);
    console.log(`   Total agentes TVS inyectados: ${this.allAgents.length}`);
    console.log(`────────────────────────────────────────────────\n`);
  }
}
