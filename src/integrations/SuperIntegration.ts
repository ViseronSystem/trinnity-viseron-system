import { ViseronCore } from "../core/ViseronCore";
import { ViseronAppsIntegrationEngine } from "./viseron-apps/index";
import { TVSToolsIntegration } from "./tvs-tools/index";
import { OmniRouteBridge } from "./omniroute/index";
import { OmniRouteHub } from "./omniroute/OmniRouteHub";
import { CallSystemBridge } from "./call-system/CallSystemBridge";
import { OpenJarvisBridge } from "./openjarvis/OpenJarvisBridge";
import { ASNOBridge } from "./asno/ASNOBridge";

export interface SuperIntegrationStats {
  totalAgents: number;
  totalTools: number;
  totalModels: number;
  activeIntegrations: string[];
  details: Record<string, any>;
}

export class SuperIntegration {
  private tvs: ViseronCore;

  public viseronApps!: ViseronAppsIntegrationEngine;
  public tvsTools!: TVSToolsIntegration;
  public omnirouteBridge!: OmniRouteBridge;
  public omnirouteHub!: OmniRouteHub;
  public callSystem!: CallSystemBridge;
  public openJarvis!: OpenJarvisBridge;
  public asno!: ASNOBridge;

  private agentsBefore: number = 0;
  private toolsBefore: number = 0;

  constructor(tvs: ViseronCore) {
    this.tvs = tvs;
  }

  async initializeAll(): Promise<SuperIntegrationStats> {
    this.agentsBefore = this.tvs.agentManager.list().length;
    this.toolsBefore = this.tvs.toolManager.listTools().length;

    console.log(`\n══════════════════════════════════════════════════════════════`);
    console.log(`   TVS SUPER INTEGRATION - ALL MODULES`);
    console.log(`══════════════════════════════════════════════════════════════\n`);

    const results: Record<string, { status: string; count?: number; error?: string }> = {};

    results.viseronApps = await this.initModule("Viseron Apps", async () => {
      this.viseronApps = new ViseronAppsIntegrationEngine(
        this.tvs.agentManager, this.tvs.providerFactory, this.tvs.modelRouter,
        this.tvs.toolManager, this.tvs.memoryEngine
      );
      await this.viseronApps.initialize();
      return this.viseronApps.getStats().totalIntegrations + this.viseronApps.getStats().totalAgents;
    });

    results.tvsTools = await this.initModule("TVS GitHub Tools", async () => {
      this.tvsTools = new TVSToolsIntegration(
        this.tvs.toolManager, this.tvs.agentManager, this.tvs.memoryEngine
      );
      return await this.tvsTools.initialize();
    });

    results.omniroute = await this.initModule("OmniRoute Gateway (290+ providers)", async () => {
      this.omnirouteBridge = new OmniRouteBridge(this.tvs.aiBridge, { port: 20128, autoStart: true });
      return await this.omnirouteBridge.initialize();
    });

    results.omnirouteHub = await this.initModule("OmniRoute Hub (all pools)", async () => {
      this.omnirouteHub = new OmniRouteHub(this.tvs.aiBridge, { port: 20128, autoStart: false });
      return await this.omnirouteHub.initialize();
    });

    results.callSystem = await this.initModule("AI Call System (Twilio + Voice)", async () => {
      this.callSystem = new CallSystemBridge(
        this.tvs.agentManager, this.tvs.toolManager,
        this.tvs.providerFactory, this.tvs.modelRouter
      );
      return await this.callSystem.initialize();
    });

    results.openJarvis = await this.initModule("OpenJarvis Personal AI (Stanford)", async () => {
      this.openJarvis = new OpenJarvisBridge(
        this.tvs.agentManager, this.tvs.toolManager
      );
      return await this.openJarvis.initialize();
    });

    results.asno = await this.initModule("ASNO AI JARVIS Assistant", async () => {
      this.asno = new ASNOBridge(
        this.tvs.agentManager, this.tvs.toolManager
      );
      return await this.asno.initialize();
    });

    return this.calculateStats(results);
  }

  private async initModule(name: string, fn: () => Promise<number>): Promise<{ status: string; count?: number; error?: string }> {
    try {
      const count = await fn();
      return { status: "ok", count };
    } catch (err: any) {
      console.error(`  [${name}] ERRO: ${err.message}`);
      return { status: "error", error: err.message };
    }
  }

  private calculateStats(results: Record<string, any>): SuperIntegrationStats {
    const agentsAfter = this.tvs.agentManager.list().length;
    const toolsAfter = this.tvs.toolManager.listTools().length;

    const activeIntegrations = Object.entries(results)
      .filter(([_, r]) => r.status === "ok")
      .map(([name]) => name);

    console.log(`\n══════════════════════════════════════════════════════════════`);
    console.log(`   ✅ SUPER INTEGRATION COMPLETE`);
    console.log(`══════════════════════════════════════════════════════════════`);
    console.log(`   Integrações ativas: ${activeIntegrations.length}/${Object.keys(results).length}`);
    console.log(`   Agentes registrados: ${agentsAfter} (${agentsAfter - this.agentsBefore} novos)`);
    console.log(`   Ferramentas registradas: ${toolsAfter} (${toolsAfter - this.toolsBefore} novas)`);

    for (const [name, r] of Object.entries(results)) {
      const icon = r.status === "ok" ? "✓" : "✗";
      console.log(`   ${icon} ${name}: ${r.status === "ok" ? `${r.count} itens` : r.error}`);
    }
    console.log(`══════════════════════════════════════════════════════════════\n`);

    return {
      totalAgents: agentsAfter - this.agentsBefore,
      totalTools: toolsAfter - this.toolsBefore,
      totalModels: results.omnirouteHub?.count || results.omniroute?.count || 0,
      activeIntegrations,
      details: results,
    };
  }

  async shutdownAll(): Promise<void> {
    for (const mod of [this.omnirouteBridge, this.omnirouteHub, this.callSystem, this.openJarvis, this.asno]) {
      if (mod && typeof (mod as any).stop === "function") {
        try { (mod as any).stop(); } catch {}
      }
    }
  }
}
