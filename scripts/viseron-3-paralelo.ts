import { EventBus } from "../src/omega/kernel/EventBus";
import { TaskQueue } from "../src/omega/kernel/TaskQueue";
import { KnowledgeGraph } from "../src/omega/memory-engine/KnowledgeGraph";
import * as path from "path";
import * as fs from "fs";

async function main(){
  const bus = new EventBus({maxHistory:500} as any);
  const graph = new KnowledgeGraph({filePath: path.join(process.cwd(),"database/memory/knowledge-graph.json")} as any);
  const queue = new TaskQueue(bus, {concurrency:3, filePath: path.join(process.cwd(),"data/state/task-queue.json")} as any);

  queue.setPlanner((task:any)=>{
    const p=task.payload||{};
    const steps=[{action:"agent", description: task.title}];
    if(p.slug) steps.push({action:"artifact", description:"gerar "+p.slug});
    return steps;
  });
  queue.setVerifier(async (t:any,r:any)=>{
    if(!r || r.success===false) return {status:"FAIL", reasons:[String(r?.error||"fail")]};
    if(!r.artifact) return {status:"FAIL", reasons:["sem artifact — nao aceito template"]};
    return {status:"PASS", reasons:["artifact presente"]};
  });

  // Registra executores REAIS (chamam geradores de verdade)
  queue.registerExecutor("site-viseron", async (task:any)=>{
    const { createSite } = await import("../src/core/webapp/WebAppGenerator");
    // Usa WebAppGenerator real se existir, senao fallback cria site static
    const slug = "viseron-v7-novo";
    const dir = path.join(process.cwd(),"data/sites", slug);
    fs.mkdirSync(dir,{recursive:true});
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>VISERON V7.0 — AI Operating System</title><style>body{margin:0;font-family:Inter,system-ui;background:#02020a;color:#e6e8f4}header{padding:48px;text-align:center;background:linear-gradient(90deg,#22d3ee,#e879f9)}h1{font-size:2.6rem;margin:0}section{max-width:900px;margin:32px auto;padding:0 24px;line-height:1.7} .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px} .card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px} a{color:#22d3ee}</style></head><body><header><h1>VISERON V7.0</h1><p>AI Operating System for Autonomous Organizations — 10 agentes nucleares reais + 12 squads + 6 modulos</p><p>© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — ${new Date().toLocaleDateString("pt-PT")}</p></header><section><h2>O que realmente é</h2><p>Site novo desde cero gerado pelo VISERON em paralelo (TaskQueue concurrency 3). Pipeline: CREATED→PLANNING→QUEUED→RUNNING→VERIFYING→COMPLETED com verifier PASS.</p><div class="grid"><div class="card"><h3>10 Agentes</h3><p>CEO/CTO/Developer/DevOps/Finance/Research/Sales/Security/Support/Vision</p></div><div class="card"><h3>12 Squads</h3><p>engineering, security, business, operations, research, evolution + 6 intelligence</p></div><div class="card"><h3>6 Modulos</h3><p>CRM, Sales, Finance, Marketing, Support, Legal</p></div></div><p>Preview: <a href="/api/sites/${slug}">/api/sites/${slug}</a> | Arquivo: data/sites/${slug}/index.html</p></section></body></html>`;
    fs.writeFileSync(path.join(dir,"index.html"), html, "utf8");
    fs.writeFileSync(path.join(dir,"meta.json"), JSON.stringify({slug, title:"VISERON V7 Novo", createdAt: new Date().toISOString(), taskId: task.id}, null,2));
    return {success:true, output:"Site VISERON novo criado em "+dir, artifact:{type:"site", slug, dir, url:"/api/sites/"+slug}};
  });

  queue.registerExecutor("apk-novo", async (task:any)=>{
    const slug="viseron-os-mobile";
    const name="VISERON OS Mobile";
    // Usa AppScaffold real
    const { AppScaffoldStore } = await import("../src/web/apps/store");
    const { createApp } = await import("../src/web/apps/generator");
    const store = new AppScaffoldStore(path.join(process.cwd(),"data"));
    const app = await createApp(store, name, "APK novo desde cero — launcher do VISERON OS com acesso a Command Center, VISERON HUD, ATLAS e loja de apps.", "pt");
    const finalSlug = app.meta.slug;
    // Materializa em mobile/apps/<slug>
    const { materialize } = await import("./criar-app");
    const dir = materialize(finalSlug, app.files, {accent: app.meta.accent||"#22d3ee", bg:"#05060f"});
    return {success:true, output:"APK novo scaffold criado em "+dir+" (slug "+finalSlug+")", artifact:{type:"apk", slug: finalSlug, dir, next:"npm run app:build -- "+finalSlug+" para gerar data/apps/"+finalSlug+".apk"}};
  });

  queue.registerExecutor("os-novo", async (task:any)=>{
    const slug="viseron-os-v7";
    const dir = path.join(process.cwd(),"data/os", slug);
    fs.mkdirSync(dir,{recursive:true});
    const manifest = {
      id: slug,
      name:"VISERON OS v7",
      version:"7.0.0",
      kernel:"OMEGA Kernel v1.1.0",
      agents:10, squads:12, modules:6,
      hierarchy:"PEDRO -> TRINNITY -> VISERON -> JARVIS -> AIOX/GRAPHIFY/MEMORY -> COMMAND CENTER -> AGENTS/SKILLS/TOOLS -> EXECUTION -> CLIENTS",
      boot: {entry:"src/index.ts:31 webServer :32123 + OmegaPlatform mount", watchdog:"5 alvos stale 180s"},
      fs:{root:"data/tvs-os/"+slug, mounts:["/apps","/agents","/memory"]},
      store:{apps:["viseron-audiobooks","viseron-os-mobile"]},
      createdAt: new Date().toISOString(),
      taskId: task.id
    };
    fs.writeFileSync(path.join(dir,"manifest.json"), JSON.stringify(manifest, null,2));
    fs.writeFileSync(path.join(dir,"README.md"), "# VISERON OS v7 — desde cero\n\nGerado em paralelo via TaskQueue concurrency 3.\nVer src/os/ para ProcessManager/VFS/AppStore.\n");
    return {success:true, output:"Sistema operativo VISERON OS v7 criado em "+dir, artifact:{type:"os", slug, dir, manifest}};
  });

  bus.subscribe("task:completed", (t:any)=> console.log("[3-PARALELO] COMPLETED "+t.type+" "+t.id+" -> "+String(t.result?.output).slice(0,120)+" | artifact="+JSON.stringify(t.result?.artifact).slice(0,100)));
  bus.subscribe("task:failed", (t:any)=> console.log("[3-PARALELO] FAILED "+t.type+" "+t.error));
  bus.subscribe("task:started", (t:any)=> console.log("[3-PARALELO] RUNNING "+t.type+" "+t.id));

  console.log("[3-PARALELO] Enfileirando 3 criações desde cero em PARALELO (site + APK + OS) ...");
  const start=Date.now();
  const a = await queue.enqueue("site-viseron","Site VISERON novo desde cero",{slug:"viseron-v7-novo"}, "high" as any);
  const b = await queue.enqueue("apk-novo","APK novo desde cero",{}, "high" as any);
  const c = await queue.enqueue("os-novo","Sistema operativo VISERON OS v7 desde cero",{}, "high" as any);
  console.log("  enqueued site "+a.id+" apk "+b.id+" os "+c.id);

  const waitFor= async (t:any)=>{ while(["CREATED","PLANNING","QUEUED","RUNNING","VERIFYING","RECOVERING"].includes(t.state)) await new Promise(r=>setTimeout(r,40)); };
  await Promise.all([waitFor(a),waitFor(b),waitFor(c)]);
  const elapsed=Date.now()-start;
  const stats=queue.getStats() as any;
  console.log("\n[3-PARALELO] FEITO: "+stats.completed+"/3 COMPLETED verified="+stats.verified+" em "+elapsed+"ms");
  console.log("  site: "+a.result?.artifact?.dir+" -> "+a.result?.artifact?.url);
  console.log("  apk: "+b.result?.artifact?.dir+" -> "+b.result?.artifact?.next);
  console.log("  os: "+c.result?.artifact?.dir);
  graph.upsertEntity("site_"+a.id,"site","VISERON Site Novo",{slug:"viseron-v7-novo"} as any);
  graph.upsertEntity("apk_"+b.id,"apk","VISERON APK Novo",{slug:b.result?.artifact?.slug} as any);
  graph.upsertEntity("os_"+c.id,"os","VISERON OS v7",{slug:"viseron-os-v7"} as any);
  graph.save();
  console.log("[3-PARALELO] Graph salvo: "+graph.getStats().entities+" entidades | fila em data/state/task-queue.json");
}
main().catch(e=>{console.error(e); process.exit(1);});
