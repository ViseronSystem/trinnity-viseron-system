import "dotenv/config";

// ═══════════════════════════════════════════════════════════════════
// BOT TELEGRAM — VISERON COSMOS ($VSR · $TRIN)
// Long polling com a Telegram Bot API (sem libs externas).
// Configuração: TELEGRAM_BOT_TOKEN no .env (obter com @BotFather).
// Comandos: /start /whitepaper /site /airdrop /staking /roadmap /lang
// ═══════════════════════════════════════════════════════════════════

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não definido no .env (obter com @BotFather).");
  process.exit(1);
}
const API = `https://api.telegram.org/bot${TOKEN}`;
const SITE = "https://www.trinnityviseronsystem.io/cosmos";
const WHITEPAPER = `${SITE}/whitepaper`;

type Lang = "pt" | "es" | "en";

const TXT: Record<Lang, any> = {
  pt: {
    welcome:
      "🚀 Bem-vindo ao **Viseron Cosmos**!\n\nSomos o braço financeiro do Trinnity Viseron System: 5.000+ mentes de IA autónomas rumo às estrelas.\n\n👑 **$VSR** (Viseron Crown) — 300M · governança · 1 token = 1 voto\n🌌 **$TRIN** (Trinnity) — 420.69B · moeda de viagem · burn 2%\n\n🌐 Redes: Ethereum · BSC · Solana\n\nComandos:\n/whitepaper — resumo técnico\n/site — links oficiais\n/airdrop — como ganhar tokens grátis\n/staking — como bloquear VSR e ganhar TRIN\n/roadmap — fases até a mainnet\n/lang — mudar idioma\n\n⚠️ Nunca envies a tua seed phrase a ninguém. Suporte NUNCA pede tokens.",
    whitepaper:
      "📄 **Whitepaper Viseron Cosmos**\n\n• VSR: 300M, 1% burn por transferência, anti-whale 3%, ERC20Votes (governança).\n• TRIN: 420.69B, 2% burn, anti-bot 0.5%, lock pré-launch.\n• Redes: Ethereum · BSC · Solana.\n• Roadmap: Génesis → Ascensão → Exchange → Cosmos Mainnet.\n\nPDF oficial gerado pelo TVS e disponível no site.",
    site:
      `🔗 **Links oficiais**\n\n🌐 Site: ${SITE}\n🛒 Swap: Uniswap (ETH) · PancakeSwap (BSC) · Raydium (Solana)\n👑 Governança: via $VSR (ERC20Votes)\n🪙 Staking: bloqueia VSR → ganhas TRIN\n\n⚠️ Confirma sempre os endereços oficiais dos contratos antes de investir.`,
    airdrop:
      "🎁 **Airdrops do Cosmos**\n\nComo ganhar $VSR/$TRIN grátis:\n\n1. 🎮 Joga o jogo VISERON e coleta mentes\n2. 🗳️ Vota nas propostas de governança (VSR)\n3. 📣 Tarefas sociais: tweet, repost, meme\n4. 💬 Partilha o projeto no Telegram\n\nQuem espera, ganha. A comunidade decide o destino do universo.",
    staking:
      "🪙 **Staking $VSR → $TRIN**\n\n• Bloqueia $VSR no contrato ViseronStaking\n• Recebes $TRIN como recompensa\n• Governança com VSR continua ativa (votos)\n• Lock com período definido pela comunidade\n\nQuando o contrato estiver deployed na rede principal, o endereço oficial será publicado aqui e no site.",
    roadmap:
      "🗺️ **Roadmap Cosmos**\n\n1️⃣ **Génesis** — deploy de contratos, liquidez + lock, site e Telegram\n2️⃣ **Ascensão** — staking/governança ao vivo, metaverso jogável, airdrops, jogo token\n3️⃣ **Exchange** — CoinGecko/CMC, CEXs regionais, auditoria Hacken, press kit\n4️⃣ **Cosmos Mainnet** — bridge ETH↔BSC↔Solana, L2 próprio, apps TVS integradas",
  },
  es: {
    welcome:
      "🚀 ¡Bienvenido a **Viseron Cosmos**!\n\nSomos el brazo financiero del Trinnity Viseron System: 5.000+ mentes de IA autónomas rumbo a las estrellas.\n\n👑 **$VSR** (Viseron Crown) — 300M · gobernanza · 1 token = 1 voto\n🌌 **$TRIN** (Trinnity) — 420.69B · moneda de viaje · burn 2%\n\n🌐 Redes: Ethereum · BSC · Solana\n\nComandos:\n/whitepaper — resumen técnico\n/site — enlaces oficiales\n/airdrop — cómo ganar tokens gratis\n/staking — cómo bloquear VSR y ganar TRIN\n/roadmap — fases hasta la mainnet\n/lang — cambiar idioma\n\n⚠️ Nunca envíes tu seed phrase a nadie. El soporte NUNCA pide tokens.",
    whitepaper:
      "📄 **Whitepaper Viseron Cosmos**\n\n• VSR: 300M, 1% burn por transferencia, anti-whale 3%, ERC20Votes (gobernanza).\n• TRIN: 420.69B, 2% burn, anti-bot 0.5%, lock pre-lanzamiento.\n• Redes: Ethereum · BSC · Solana.\n• Roadmap: Génesis → Ascensión → Exchange → Cosmos Mainnet.\n\nPDF oficial generado por el TVS y disponible en el sitio.",
    site:
      `🔗 **Enlaces oficiales**\n\n🌐 Sitio: ${SITE}\n🛒 Swap: Uniswap (ETH) · PancakeSwap (BSC) · Raydium (Solana)\n👑 Gobernanza: vía $VSR (ERC20Votes)\n🪙 Staking: bloquea VSR → ganas TRIN\n\n⚠️ Confirma siempre las direcciones oficiales de los contratos antes de invertir.`,
    airdrop:
      "🎁 **Airdrops del Cosmos**\n\nCómo ganar $VSR/$TRIN gratis:\n\n1. 🎮 Juega al juego VISERON y colecciona mentes\n2. 🗳️ Vota en las propuestas de gobernanza (VSR)\n3. 📣 Tareas sociales: tweet, repost, meme\n4. 💬 Comparte el proyecto en Telegram\n\nEl que espera, gana. La comunidad decide el destino del universo.",
    staking:
      "🪙 **Staking $VSR → $TRIN**\n\n• Bloquea $VSR en el contrato ViseronStaking\n• Recibes $TRIN como recompensa\n• La gobernanza con VSR sigue activa (votos)\n• Lock con período decidido por la comunidad\n\nCuando el contrato esté desplegado en la red principal, la dirección oficial se publicará aquí y en el sitio.",
    roadmap:
      "🗺️ **Roadmap Cosmos**\n\n1️⃣ **Génesis** — deploy de contratos, liquidez + lock, sitio y Telegram\n2️⃣ **Ascensión** — staking/gobernanza en vivo, metaverso jugable, airdrops, juego token\n3️⃣ **Exchange** — CoinGecko/CMC, CEXs regionales, auditoría Hacken, press kit\n4️⃣ **Cosmos Mainnet** — bridge ETH↔BSC↔Solana, L2 propio, apps TVS integradas",
  },
  en: {
    welcome:
      "🚀 Welcome to **Viseron Cosmos**!\n\nWe are the financial arm of the Trinnity Viseron System: 5,000+ autonomous AI minds heading to the stars.\n\n👑 **$VSR** (Viseron Crown) — 300M · governance · 1 token = 1 vote\n🌌 **$TRIN** (Trinnity) — 420.69B · travel coin · 2% burn\n\n🌐 Networks: Ethereum · BSC · Solana\n\nCommands:\n/whitepaper — technical summary\n/site — official links\n/airdrop — how to earn free tokens\n/staking — how to lock VSR and earn TRIN\n/roadmap — phases until mainnet\n/lang — change language\n\n⚠️ Never share your seed phrase. Support NEVER asks for tokens.",
    whitepaper:
      "📄 **Viseron Cosmos Whitepaper**\n\n• VSR: 300M, 1% burn per transfer, 3% anti-whale, ERC20Votes (governance).\n• TRIN: 420.69B, 2% burn, 0.5% anti-bot, pre-launch lock.\n• Networks: Ethereum · BSC · Solana.\n• Roadmap: Genesis → Ascension → Exchange → Cosmos Mainnet.\n\nOfficial PDF generated by TVS, available on the site.",
    site:
      `🔗 **Official links**\n\n🌐 Site: ${SITE}\n🛒 Swap: Uniswap (ETH) · PancakeSwap (BSC) · Raydium (Solana)\n👑 Governance: via $VSR (ERC20Votes)\n🪙 Staking: lock VSR → earn TRIN\n\n⚠️ Always confirm the official contract addresses before investing.`,
    airdrop:
      "🎁 **Cosmos Airdrops**\n\nHow to earn $VSR/$TRIN for free:\n\n1. 🎮 Play the VISERON game and collect minds\n2. 🗳️ Vote on governance proposals (VSR)\n3. 📣 Social tasks: tweet, repost, meme\n4. 💬 Share the project on Telegram\n\nGood things come to those who wait. The community decides the universe's destiny.",
    staking:
      "🪙 **Staking $VSR → $TRIN**\n\n• Lock $VSR in the ViseronStaking contract\n• Receive $TRIN as reward\n• VSR governance stays active (votes)\n• Lock period decided by the community\n\nOnce the contract is deployed on the main network, the official address will be posted here and on the site.",
    roadmap:
      "🗺️ **Cosmos Roadmap**\n\n1️⃣ **Genesis** — contract deploy, liquidity + lock, site and Telegram\n2️⃣ **Ascension** — live staking/governance, playable metaverse, airdrops, token game\n3️⃣ **Exchange** — CoinGecko/CMC, regional CEXs, Hacken audit, press kit\n4️⃣ **Cosmos Mainnet** — ETH↔BSC↔Solana bridge, own L2, integrated TVS apps",
  },
};

const langs = new Map<number, Lang>();

async function api<T = any>(method: string, body?: any): Promise<T> {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  return (await res.json()) as T;
}

function reply(chatId: number, text: string) {
  return api("sendMessage", { chat_id: chatId, text, parse_mode: "Markdown", disable_web_page_preview: true }).catch((e) =>
    console.error("sendMessage error:", e.message)
  );
}

function handle(msg: any) {
  if (!msg || !msg.text || !msg.chat) return;
  const chatId = msg.chat.id;
  const text = (msg.text as string).trim();
  const first = text.split(/\s+/)[0].toLowerCase();
  const lang: Lang = langs.get(chatId) || "es";

  const cmds: Record<string, (l: Lang) => string> = {
    "/start": (l) => TXT[l].welcome,
    "/whitepaper": (l) => TXT[l].whitepaper,
    "/site": (l) => TXT[l].site,
    "/airdrop": (l) => TXT[l].airdrop,
    "/staking": (l) => TXT[l].staking,
    "/roadmap": (l) => TXT[l].roadmap,
    "/help": (l) => TXT[l].welcome,
  };

  if (first === "/lang") {
    const wanted = (text.split(/\s+/)[1] || "").toLowerCase();
    if (wanted === "pt" || wanted === "es" || wanted === "en") {
      langs.set(chatId, wanted);
      return reply(chatId, `✅ Idioma: ${wanted.toUpperCase()} / Language: ${wanted.toUpperCase()} / Língua: ${wanted.toUpperCase()}`);
    }
    return reply(chatId, "Uso: /lang es · /lang pt · /lang en");
  }

  const handler = cmds[first];
  if (handler) return reply(chatId, handler(lang));

  // Fallback: responder sempre no idioma do texto detetado
  const guess: Lang = /\b(pt|por|obrigado|bem-vindo)\b/i.test(text) ? "pt" : /(thank|welcome|hi|hello)/i.test(text) ? "en" : "es";
  reply(chatId, TXT[guess].welcome);
}

async function registerCommands() {
  try {
    await api("setMyCommands", {
      commands: [
        { command: "start", description: "🚀 Start / Bienvenida / Bem-vindo" },
        { command: "whitepaper", description: "📄 Whitepaper resumo" },
        { command: "site", description: "🔗 Links oficiais" },
        { command: "airdrop", description: "🎁 Como ganhar tokens" },
        { command: "staking", description: "🪙 Bloquear VSR → ganhar TRIN" },
        { command: "roadmap", description: "🗺️ Fases até à mainnet" },
        { command: "lang", description: "🌍 Idioma / Language / Língua" },
      ],
    });
    console.log("✅ Comandos registados no @BotFather.");
  } catch (e: any) {
    console.error("registerCommands error:", e.message);
  }
}

async function main() {
  await registerCommands();
  console.log("🤖 Viseron Cosmos Bot a escutar (long polling)... (Ctrl+C para parar)");
  let offset = 0;
  for (;;) {
    try {
      const data = await api("getUpdates", { timeout: 60, offset, allowed_updates: ["message"] });
      const updates: any[] = data.result || [];
      for (const u of updates) {
        if (u.message) handle(u.message);
        offset = u.update_id + 1;
      }
    } catch (e: any) {
      console.error("poll error:", e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
