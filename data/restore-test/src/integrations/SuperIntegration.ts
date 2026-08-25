import { ViseronCore } from "../core/ViseronCore";
import { ViseronAppsIntegrationEngine } from "./viseron-apps/index";
import { TVSToolsIntegration } from "./tvs-tools/index";
import { OmniRouteBridge } from "./omniroute/index";
import { OmniRouteHub } from "./omniroute/OmniRouteHub";
import { CallSystemBridge } from "./call-system/CallSystemBridge";
import { OpenJarvisBridge } from "./openjarvis/OpenJarvisBridge";
import { ASNOBridge } from "./asno/ASNOBridge";
import { AviratoBridge } from "./avirato/AviratoBridge";
import type { IntegrationBridge } from "./contract";
import { initBridge, shutdownBridge } from "./contract";

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
  public avirato!: AviratoBridge;

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

    const modules: Record<string, () => IntegrationBridge> = {
      viseronApps: () => new ViseronAppsIntegrationEngine(
        this.tvs.agentManager, this.tvs.providerFactory, this.tvs.modelRouter,
        this.tvs.toolManager, this.tvs.memoryEngine
      ),
      tvsTools: () => new TVSToolsIntegration(
        this.tvs.toolManager, this.tvs.agentManager, this.tvs.memoryEngine
      ),
      omniroute: () => new OmniRouteBridge(this.tvs.aiBridge, { port: 20128, autoStart: true }),
      omnirouteHub: () => new OmniRouteHub(this.tvs.aiBridge, { port: 20128, autoStart: false }),
      callSystem: () => new CallSystemBridge(
        this.tvs.agentManager, this.tvs.toolManager,
        this.tvs.providerFactory, this.tvs.modelRouter
      ),
      openJarvis: () => new OpenJarvisBridge(
        this.tvs.agentManager, this.tvs.toolManager
      ),
      asno: () => new ASNOBridge(
        this.tvs.agentManager, this.tvs.toolManager
      ),
      avirato: () => new AviratoBridge({
        env: (process.env.AVIRATO_ENV || "live") === "test" ? "test" : "live",
        webcode: process.env.AVIRATO_WEBCODE,
      }),
    };

    const results: Record<string, { status: string; count?: number; error?: string }> = {};
    const bridgeKeys: Record<string, keyof SuperIntegration> = {
      viseronApps: "viseronApps", tvsTools: "tvsTools", omniroute: "omnirouteBridge",
      omnirouteHub: "omnirouteHub", callSystem: "callSystem", openJarvis: "openJarvis", asno: "asno",
      avirato: "avirato",
    };

    for (const [key, factory] of Object.entries(modules)) {
      const bridge = factory();
      (this as any)[bridgeKeys[key]] = bridge;
      const r = await initBridge(bridge);
      results[key] = { status: r.status, count: r.count, error: r.error };
    }

    return this.calculateStats(results);
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
    for (const bridge of [
      this.omnirouteBridge, this.omnirouteHub, this.callSystem, this.openJarvis, this.asno, this.avirato,
    ]) {
      await shutdownBridge(bridge as IntegrationBridge);
    }
  }
}
