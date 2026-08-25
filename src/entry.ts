// ENTRY FAST-BOOT — Web server (porta 32123) abre em segundos.
// O core pesado (ViseronCore, agentes, squads, memória, ciclos)
// arranca em background depois de o servidor web já responder.
import "dotenv/config";

async function boot() {
  const { ViseronWebServer } = await import("./web/standalone-server");

  (global as any).__TVS_START_TIME = Date.now();

  process.on("uncaughtException", (err: any) => {
    console.error(`[TVS] ${err?.message || err}`);
  });
  process.on("unhandledRejection", (reason: any) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error(`[TVS] ${msg}`);
  });

  const port = parseInt(process.env.PORT || "32123", 10);
  const webServer = new ViseronWebServer({ port });
  (global as any).__TVS_WEB_SERVER = webServer;

  try {
    await webServer.start();
    webServer.getContentAgent().start(120);
    console.log(`[Web] API pronta em http://localhost:${port} (${Math.round(process.uptime())}s de boot)`);
  } catch (err: any) {
    console.error(`[Web] Falha ao iniciar API: ${err?.message || err}`);
  }

  // Core pesado em background — o servidor web já está a responder.
  setImmediate(() => {
    import("./index-core").catch((err: any) => {
      console.error(`[Core] Falha ao carregar: ${err?.message || err}`);
    });
  });
}

boot().catch((err: any) => {
  console.error(`[Entry] Erro fatal: ${err?.message || err}`);
  process.exit(1);
});
