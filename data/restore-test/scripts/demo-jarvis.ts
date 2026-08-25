import { JarvisAgent } from "../src/web/jarvis/agent";
import { AccountStore } from "../src/web/auth/store";
import { StripeBilling } from "../src/web/billing/stripe";
import { EmailService, createEmailService } from "../src/web/email/service";
import { MessageStore } from "../src/web/messaging/store";
import { BlogStorage } from "../src/web/blog-storage";
import { MetricsCollector } from "../src/web/monitoring/metrics";
import path from "path";

// TVS — Demo do JARVIS (conversa + autonomia real sobre o sistema)
// Uso: npm run demo:jarvis

const DATA_DIR = path.resolve("data");

async function main() {
  console.log("\n==========================================");
  console.log("  JARVIS — DEMO DE CONVERSA E AUTONOMIA");
  console.log("==========================================");

  const accounts = new AccountStore(path.join(DATA_DIR, "accounts.json"));
  const billing = new StripeBilling();
  const email = createEmailService(DATA_DIR);
  const messaging = new MessageStore(path.join(DATA_DIR, "messaging.json"));
  const blog = new BlogStorage();
  const logger = { info: (m: string) => console.log("[jarvis]", m), warn: console.warn, error: console.error };
  const metrics = new MetricsCollector();

  const agent = new JarvisAgent({ dataDir: DATA_DIR, accounts, billing, email, messaging, blog, logger, metrics });

  const questions: string[] = [
    "Quem és?",
    "Qual é o estado do sistema?",
    "Que planos tens?",
    "Quero começar uma sessão de checkout",
    "Como é que a mensageria está cifrada?",
    "Obrigado!",
  ];

  let sessionId = "";
  for (const q of questions) {
    const res = await agent.chat({ sessionId, message: q });
    sessionId = res.sessionId;
    console.log(`\n> ${q}`);
    console.log(`JARVIS: ${res.reply}`);
  }

  console.log("\n==========================================");
  console.log("  Demo concluída. Sessão persistida.");
  console.log("==========================================");
}

main().catch((e) => {
  console.error("Falha no demo do JARVIS:", e.message);
  process.exit(1);
});
