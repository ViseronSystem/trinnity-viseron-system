import { createTheme } from "./pdf-theme";
import * as fs from "fs";
import * as path from "path";

// ═══════════════════════════════════════════════════════════════════
// KIT DE MARKETING — VISERON COSMOS ($VSR · $TRIN)
// Gera um PDF trilingue (PT/ES/EN) com: mensagens-chave, posts,
// hashtags, press release, scripts de Telegram, airdrops e guia de go-live.
// ═══════════════════════════════════════════════════════════════════

const OUTPUT = path.join(__dirname, "..", "data", "Viseron_Cosmos_Kit_Marketing.pdf");

const T: Record<string, any> = {
  pt: {
    lang: "Português",
    cover: "KIT DE MARKETING",
    coverSub: "Viseron Cosmos · $VSR · $TRIN — missão interplanetária",
    m1t: "MENSAGEM CENTRAL",
    m1: "O Viseron Cosmos nasceu do Trinnity Viseron System (TVS): 5.000+ mentes de IA autónomas. $VSR é a coroa (governança, 300M) e $TRIN é a moeda de viagem interplanetária (420.69B). Ethereum · BSC · Solana. A comunidade decide o destino do universo.",
    m2t: "PÚBLICO-ALVO",
    m2: ["Entusiastas de memecoins interplanetárias (fans de DOGE/ELON)", "Comunidade crypto que quer utilidade real", "Fãs de IA e automação (o TVS entrega valor real)", "Investidores early em tokens de governança"],
    m3t: "POSTS PARA REDES (TRILINGUE)",
    posts: [
      ["🚀", "Perdeste o DOGE na lua e a ELON em Marte? O #ViseronCosmos vai mais longe. 5.000+ mentes de IA a caminho das estrelas. $VSR $TRIN"],
      ["👑", "$VSR — Prueba de Mandato. 1 token = 1 voto on-chain. Governança real para um exército de IA. Ethereum · BSC · Solana"],
      ["🌌", "$TRIN — a moeda de viagem do batallón. 420.69B. Burn 2%. A ELON do Trinnity Viseron System. Únete a la misión."],
      ["🎮", "Joga o jogo VISERON, coleta mentes e ganha airdrops. O metaverso Cosmos transforma o jogo em valor."],
      ["📡", "Mensagens de marca (RCS), agência de marketing, gmail que responde sozinho — o TVS já trabalha. Agora o mercado ganha $VSR/$TRIN."],
      ["🪙", "Staking: bloqueia $VSR → ganhas $TRIN. Deflação: burn em cada transferência. Quem espera, ganha."],
    ],
    m4t: "HASHTAGS OFICIAIS",
    m4: ["#ViseronCosmos  #VSR  #TRIN  #TrinnityViseron  #ToTheStars  #Crypto  #Memecoin  #AI  #AGI"],
    m5t: "PRESS RELEASE (RESUMO)",
    m5: "Trinnity Viseron System, o sistema operativo multi-agente de IA com 5.000+ mentes autónomas, anuncia o lançamento do Viseron Cosmos: duas moedas nativas — $VSR (governança, 300M, 1% burn, anti-whale 3%) e $TRIN (memecoin interplanetária, 420.69B, 2% burn, anti-bot). Ambas em Ethereum, BSC e Solana, com staking, governança on-chain, metaverso jogável e roadmap para exchanges. © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha).",
    m6t: "SCRIPT TELEGRAM (BOAS-VINDAS AUTOMÁTICAS)",
    m6: "🚀 Bem-vindo ao Viseron Cosmos!\n\nSomos o braço financeiro do Trinnity Viseron System: 5.000+ mentes de IA autónomas.\n\n👑 $VSR (Viseron Crown) — 300M · governança · 1 voto = 1 token\n🌌 $TRIN (Trinnity) — 420.69B · moeda de viagem · burn 2%\n\n🌐 Redes: Ethereum · BSC · Solana\n🔗 Site: https://www.trinnityviseronsystem.io/cosmos\n📄 Whitepaper: https://www.trinnityviseronsystem.io/cosmos/whitepaper\n\nComandos:\n/start — boas-vindas\n/whitepaper — resumo técnico\n/site — links oficiais\n/airdrop — como ganhar tokens grátis\n/staking — como bloquear VSR e ganhar TRIN\n/roadmap — fases até a mainnet\n\n⚠️ Nunca envie a tua seed phrase a ninguém. Suporte NUNCA pede tokens.",
    m7t: "AIRDROP & COMUNIDADE",
    m7: ["Airdrops: por jogar o jogo, votar e divulgar", "Sorteios semanais no Telegram", "Tarefas sociais (tweet, repost) → pontos → tokens", "Só a comunidade decide o destino do universo"],
    m8t: "GO-LIVE CHECKLIST",
    m8: ["1. Criar grupo/canal Telegram e ativar o bot com /start", "2. Verificar o site /cosmos no ar (já live em Vercel)", "3. Publicar o whitepaper PDF", "4. Deploy real dos contratos (chave privada + gás) → endereços oficiais", "5. Criar liquidez (Uniswap/PancakeSwap/Raydium) + lock", "6. Primeiro press release + posts nas 3 línguas", "7. Submeter a CMC/CoinGecko e CEXs regionais"],
  },
  es: {
    lang: "Español",
    cover: "KIT DE MARKETING",
    coverSub: "Viseron Cosmos · $VSR · $TRIN — misión interplanetaria",
    m1t: "MENSAJE CENTRAL",
    m1: "Viseron Cosmos nació del Trinnity Viseron System (TVS): 5.000+ mentes de IA autónomas. $VSR es la corona (gobernanza, 300M) y $TRIN la moneda de viaje interplanetaria (420.69B). Ethereum · BSC · Solana. La comunidad decide el destino del universo.",
    m2t: "PÚBLICO OBJETIVO",
    m2: ["Fans de memecoins interplanetarias (DOGE/ELON)", "Comunidad crypto que busca utilidad real", "Fans de IA y automatización (el TVS entrega valor real)", "Inversores early en tokens de gobernanza"],
    m3t: "PUBLICACIONES PARA REDES (TRILINGÜE)",
    posts: [
      ["🚀", "¿Perdiste el DOGE en la luna y la ELON en Marte? El #ViseronCosmos va más lejos. 5.000+ mentes de IA rumbo a las estrellas. $VSR $TRIN"],
      ["👑", "$VSR — Prueba de Mandato. 1 token = 1 voto on-chain. Gobernanza real para un ejército de IA. Ethereum · BSC · Solana"],
      ["🌌", "$TRIN — la moneda de viaje del batallón. 420.69B. Burn 2%. La ELON del Trinnity Viseron System. Únete a la misión."],
      ["🎮", "Juega al juego VISERON, colecciona mentes y gana airdrops. El metaverso Cosmos convierte el juego en valor."],
      ["📡", "Mensajes de marca (RCS), agencia de marketing, gmail que responde solo — el TVS ya trabaja. Ahora el mercado gana $VSR/$TRIN."],
      ["🪙", "Staking: bloquea $VSR → ganas $TRIN. Deflación: burn en cada transferencia. El que espera, gana."],
    ],
    m4t: "HASHTAGS OFICIALES",
    m4: ["#ViseronCosmos  #VSR  #TRIN  #TrinnityViseron  #ToTheStars  #Crypto  #Memecoin  #AI  #AGI"],
    m5t: "PRESS RELEASE (RESUMEN)",
    m5: "Trinnity Viseron System, el sistema operativo multi-agente de IA con 5.000+ mentes autónomas, anuncia el lanzamiento de Viseron Cosmos: dos monedas nativas — $VSR (gobernanza, 300M, 1% burn, anti-whale 3%) y $TRIN (memecoin interplanetaria, 420.69B, 2% burn, anti-bot). Ambas en Ethereum, BSC y Solana, con staking, gobernanza on-chain, metaverso jugable y roadmap hacia exchanges. © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha).",
    m6t: "SCRIPT TELEGRAM (BIENVENIDA AUTOMÁTICA)",
    m6: "🚀 ¡Bienvenido a Viseron Cosmos!\n\nSomos el brazo financiero del Trinnity Viseron System: 5.000+ mentes de IA autónomas.\n\n👑 $VSR (Viseron Crown) — 300M · gobernanza · 1 voto = 1 token\n🌌 $TRIN (Trinnity) — 420.69B · moneda de viaje · burn 2%\n\n🌐 Redes: Ethereum · BSC · Solana\n🔗 Sitio: https://www.trinnityviseronsystem.io/cosmos\n📄 Whitepaper: https://www.trinnityviseronsystem.io/cosmos/whitepaper\n\nComandos:\n/start — bienvenida\n/whitepaper — resumen técnico\n/site — enlaces oficiales\n/airdrop — cómo ganar tokens gratis\n/staking — cómo bloquear VSR y ganar TRIN\n/roadmap — fases hasta la mainnet\n\n⚠️ Nunca envíes tu seed phrase a nadie. El soporte NUNCA pide tokens.",
    m7t: "AIRDROP & COMUNIDAD",
    m7: ["Airdrops: por jugar, votar y difundir", "Sorteos semanales en Telegram", "Tareas sociales (tweet, repost) → puntos → tokens", "Solo la comunidad decide el destino del universo"],
    m8t: "CHECKLIST GO-LIVE",
    m8: ["1. Crear grupo/canal Telegram y activar el bot con /start", "2. Verificar el sitio /cosmos en línea (ya live en Vercel)", "3. Publicar el whitepaper PDF", "4. Deploy real de los contratos (clave privada + gas) → direcciones oficiales", "5. Crear liquidez (Uniswap/PancakeSwap/Raydium) + lock", "6. Primer press release + publicaciones en 3 idiomas", "7. Enviar a CMC/CoinGecko y CEXs regionales"],
  },
  en: {
    lang: "English",
    cover: "MARKETING KIT",
    coverSub: "Viseron Cosmos · $VSR · $TRIN — interplanetary mission",
    m1t: "CORE MESSAGE",
    m1: "Viseron Cosmos was born from the Trinnity Viseron System (TVS): 5,000+ autonomous AI minds. $VSR is the crown (governance, 300M) and $TRIN is the interplanetary travel coin (420.69B). Ethereum · BSC · Solana. The community decides the universe's destiny.",
    m2t: "TARGET AUDIENCE",
    m2: ["Interplanetary memecoin fans (DOGE/ELON)", "Crypto community seeking real utility", "AI and automation fans (TVS delivers real value)", "Early investors in governance tokens"],
    m3t: "SOCIAL POSTS (TRILINGUAL)",
    posts: [
      ["🚀", "Missed DOGE on the moon and ELON on Mars? #ViseronCosmos goes further. 5,000+ AI minds heading to the stars. $VSR $TRIN"],
      ["👑", "$VSR — Proof of Mandate. 1 token = 1 on-chain vote. Real governance for an AI army. Ethereum · BSC · Solana"],
      ["🌌", "$TRIN — the battalion's travel coin. 420.69B. 2% burn. The ELON of the Trinnity Viseron System. Join the mission."],
      ["🎮", "Play the VISERON game, collect minds, earn airdrops. The Cosmos metaverse turns game into value."],
      ["📡", "Brand messages (RCS), marketing agency, self-replying gmail — TVS already works. Now the market earns $VSR/$TRIN."],
      ["🪙", "Staking: lock $VSR → earn $TRIN. Deflation: burn on every transfer. Good things come to those who wait."],
    ],
    m4t: "OFFICIAL HASHTAGS",
    m4: ["#ViseronCosmos  #VSR  #TRIN  #TrinnityViseron  #ToTheStars  #Crypto  #Memecoin  #AI  #AGI"],
    m5t: "PRESS RELEASE (SUMMARY)",
    m5: "Trinnity Viseron System, the multi-agent AI operating system with 5,000+ autonomous minds, announces the launch of Viseron Cosmos: two native coins — $VSR (governance, 300M, 1% burn, 3% anti-whale) and $TRIN (interplanetary memecoin, 420.69B, 2% burn, anti-bot). Both on Ethereum, BSC and Solana, with staking, on-chain governance, a playable metaverse and an exchange roadmap. © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha).",
    m6t: "TELEGRAM SCRIPT (AUTO WELCOME)",
    m6: "🚀 Welcome to Viseron Cosmos!\n\nWe are the financial arm of the Trinnity Viseron System: 5,000+ autonomous AI minds.\n\n👑 $VSR (Viseron Crown) — 300M · governance · 1 vote = 1 token\n🌌 $TRIN (Trinnity) — 420.69B · travel coin · 2% burn\n\n🌐 Networks: Ethereum · BSC · Solana\n🔗 Site: https://www.trinnityviseronsystem.io/cosmos\n📄 Whitepaper: https://www.trinnityviseronsystem.io/cosmos/whitepaper\n\nCommands:\n/start — welcome\n/whitepaper — technical summary\n/site — official links\n/airdrop — how to earn free tokens\n/staking — how to lock VSR and earn TRIN\n/roadmap — phases until mainnet\n\n⚠️ Never share your seed phrase. Support NEVER asks for tokens.",
    m7t: "AIRDROP & COMMUNITY",
    m7: ["Airdrops: for playing, voting and sharing", "Weekly giveaways on Telegram", "Social tasks (tweet, repost) → points → tokens", "Only the community decides the universe's destiny"],
    m8t: "GO-LIVE CHECKLIST",
    m8: ["1. Create Telegram group/channel and activate the bot with /start", "2. Verify /cosmos site is live (already live on Vercel)", "3. Publish the whitepaper PDF", "4. Real contract deploy (private key + gas) → official addresses", "5. Create liquidity (Uniswap/PancakeSwap/Raydium) + lock", "6. First press release + posts in 3 languages", "7. Apply to CMC/CoinGecko and regional CEXs"],
  },
};

function build() {
  const th = createTheme({
    title: `Viseron Cosmos — Marketing Kit (${Object.keys(T).map((k) => T[k].lang).join(" / ")})`,
    subject: "$VSR · $TRIN — interplanetary token launch marketing",
  });

  th.cover({
    title: "VISERON COSMOS\nMARKETING KIT",
    subtitle: "$VSR · $TRIN — mission to the stars",
    badges: ["Ethereum", "BSC", "Solana", "Telegram", "Airdrops", "Metaverso", "Staking", "Governança on-chain"],
    date: "07/08/2026",
    version: "1.1",
    url: "www.trinnityviseronsystem.io/cosmos",
  });

  (["pt", "es", "en"] as const).forEach((lang) => {
    const tr = T[lang];
    th.section(lang.toUpperCase(), tr.coverSub);
    th.sub(tr.m1t);
    th.para(tr.m1);
    th.sub(tr.m2t);
    tr.m2.forEach((p: string) => th.bullet("▸", p));
    th.sub(tr.m3t);
    tr.posts.forEach((p: [string, string]) => th.bullet(p[0], p[1]));
    th.sub(tr.m4t);
    th.para(tr.m4, 11, "#64748b");
    th.sub(tr.m5t);
    th.para(tr.m5, 10.5, "#94a3b8");
    th.sub(tr.m6t);
    tr.m6.split("\n").forEach((l: string) => th.code(l));
    th.sub(tr.m7t);
    tr.m7.forEach((p: string) => th.bullet("▸", p));
    th.sub(tr.m8t);
    tr.m8.forEach((p: string) => th.bullet("▸", p));
    th.rule();
  });

  th.finish(OUTPUT);
  setTimeout(() => {
    const size = fs.statSync(OUTPUT).size;
    console.log(`✅ Viseron_Cosmos_Kit_Marketing.pdf gerado — ${(size / 1024).toFixed(1)} KB`);
  }, 800);
}

build();
