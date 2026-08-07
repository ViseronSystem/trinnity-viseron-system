import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

// ═══════════════════════════════════════════════════════════════════
// PDF GO-LIVE DEX — VISERON COSMOS ($VSR · $TRIN)
// Runbook completo de go-live em DEX: Solana/Phantom primeiro, depois EVM.
// Trilingue (PT/ES/EN). © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "Viseron_Cosmos_Go_Live_DEX.pdf");

const t = createTheme({
  title: "Viseron Cosmos — Go-Live DEX | Go Live DEX | Arranque em DEX",
  subject: "$VSR · $TRIN — runbook real: carteira, deploy, liquidez, lock, listagem (PT/ES/EN)",
});

t.cover({
  title: "VISERON COSMOS\nGO-LIVE NAS DEX",
  subtitle: "Runbook completo — Phantom/Solana primeiro, depois Ethereum/BSC | Full DEX launch guide | Guía completa de lanzamiento en DEX",
  badges: ["Phantom", "Solana", "Raydium", "Jupiter", "Uniswap", "PancakeSwap", "Liquidez lock", "CoinGecko"],
  date: "07/08/2026",
  version: "1.0",
  url: "www.trinnityviseronsystem.io/cosmos",
});
t.para("AUTORIA & PROPRIEDADE INTELECTUAL — © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha). Todos os direitos reservados · All rights reserved · Todos los derechos reservados.", 10, "#7c3aed");
t.para("CONFIDENCIAL — contém passos e locais de chaves privadas. NUNCA partilhar. / CONFIDENTIAL — contains private key handling. NEVER share. / CONFIDENCIAL — contiene manejo de claves privadas. NUNCA compartir.", 9.5, "#ef4444");

// ─── 0. O QUE DECIDIR ANTES ───
t.section("0", "Antes de começar · Before you start · Antes de empezar");
t.sub("Decisões que tens de tomar (não há código que as decida)", "#ef4444");
t.bullets([
  "▸ Qual rede lança primeiro? Solana/Phantom foi escolhido — perfeito.",
  "▸ Quanto de liquidez inicial? Sugestão: 20% VSR / 25% TRIN da oferta.",
  "▸ Carteira de treasury/receitas (multisig ou cold wallet)?",
  "▸ Quem detém a private key? SÓ tu (Pedro) e a Rainha. Nunca bots, nunca o repo.",
  "▸ Custo estimado: gas Solana ~0.05-0.5 SOL; DEX fees; Team Finance ~0.2-1% do valor bloqueado.",
]);
t.para("Regra de ouro: private key NUNCA vai para o GitHub, NUNCA para o .env principal, NUNCA para o chat. Vive só na tua wallet e (opcional) num contracts/.env gitignored.", 10, "#dc2626");

// ─── 1. SOLANA + PHANTOM (PRIMEIRO) ───
t.section("1", "Caminho SOLANA · Phantom primeiro");
t.sub("1.1 — Instalar a Phantom Wallet", "#22c55e");
t.bullet("▸", "https://phantom.app → extensão browser ou app móvel (Android/iOS).");
t.bullet("▸", "Criar nova wallet → GUARDAR a frase de recuperação (seed phrase) em papel, offline, 2 cópias.");
t.bullet("▸", "NUNCA introduzir a seed em sites, dapps ou no computador. A seed controla tudo.");
t.bullet("▸", "Mostrar o endereço público (começa por S9... ou similar) — esse é seguro partilhar.");

t.spacer(2);
t.sub("1.2 — Fundear com SOL (gas)", "#22c55e");
t.bullet("▸", "Comprar SOL numa exchange (Binance/Coinbase/Kraken) e enviar para o endereço Phantom.");
t.bullet("▸", "Mínimo recomendado para começar: 1-2 SOL (~cobre deploy + fees de pool + testes).");
t.bullet("▸", "Sempre guardar ~0.1 SOL de reserva — sem SOL não se paga gas e fica tudo bloqueado.");

t.spacer(2);
t.sub("1.3 — Criar os tokens (SPL) no terminal", "#22c55e");
t.para("Pré-requisito: Node + Solana CLI instalados. Com a Phantom instalada, instalar o CLI: `npm i -g @solana/web3.js` e a CLI do spl-token.", 9.5, "#334155");
t.code("sh -c \"$(curl -sSfL https://release.solana.com/v1.18.18/install)\"", "instala o Solana CLI (ou versão estável atual)");
t.code("spl-token create-token --decimals 9 --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "cria o mint VSR");
t.code("spl-token create-token --decimals 9 --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "cria o mint TRIN");
t.para("Guardar os MINT ADDRESSES que o terminal devolve — são os contratos em Solana.", 9.5, "#0f172a");

t.spacer(2);
t.sub("1.4 — Mintar o supply (VSR 300M · TRIN 420.69M)", "#22c55e");
t.code("spl-token mint <VSR_MINT> 300000000000000000000000000 <dest>", "VSR — 300,000,000 tokens (9 decimais → 3e23 unidades base)");
t.code("spl-token mint <TRIN_MINT> 420690000000000000000 <dest>", "TRIN — 420,690,000 tokens (420.69M · 9 decimais → 4.2e17 base, cabe em u64)");
t.para("<dest> = o teu endereço Phantom. <VSR_MINT>/<TRIN_MINT> = endereços do passo 1.3.", 9, "#64748b");

t.spacer(2);
t.sub("1.5 — Metadata oficial (nome, símbolo, logo)", "#22c55e");
t.para("Os ficheiros JSON de metadata já existem em contracts/solana/. Publicar primeiro numa URI pública (ex. Arweave/IPFS via Metaplex).", 9.5, "#334155");
t.code("metaplex token create-metadata --name \"Viseron Crown\" --symbol VSR --uri https://<uri-json>", "VSR — usa contracts/solana/vsr-metadata.json como base");
t.code("metaplex token create-metadata --name \"Trinnity\" --symbol TRIN --uri https://<uri-json>", "TRIN — usa contracts/solana/trin-metadata.json");

t.spacer(2);
t.sub("1.6 — Liquidez na Raydium (a DEX principal da Solana)", "#22c55e");
t.bullet("▸", "Ir a https://raydium.io → Connect Wallet (Phantom).");
t.bullet("▸", "Concentrated Liquidity (CLMM): criar pool VSR/USDC ou VSR/SOL; depositar o par; range central.");
t.bullet("▸", "Repetir para TRIN/USDC ou TRIN/SOL.");
t.bullet("▸", "Definir o preço inicial (ex. VSR = $0.00001, TRIN = $0.000000001 — valores a definir com a estratégia).");
t.bullet("▸", "Recebes os LP tokens (posição) — NÃO os vender; são a liquidez do projeto.");

t.spacer(2);
t.sub("1.7 — Lock da liquidez (SEGURANÇA OBRIGATÓRIA)", "#22c55e");
t.para("Bloquear os LP tokens para gerar confiança. Na Solana o padrão é a Streamflow ou o Team Finance (multi-chain). Lock mínimo recomendado: 12 meses, de preferência 24.", 9.5, "#334155");
t.code("https://app.streamflow.finance  →  Lock", "alternativa #1 — locks de vesting/LP na Solana");
t.code("https://app.team.finance  →  Solana", "alternativa #2 — lock de liquidez multi-chain");
t.bullet("▸", "Guardar o endereço do contrato de lock e partilhar no site/Telegram (prova pública).");

t.spacer(2);
t.sub("1.8 — Verificação pública", "#22c55e");
t.bullet("▸", "Ver o pool no Raydium/Avax-Birdeye: birdeye.so/so swap (procura pelo mint).");
t.bullet("▸", "Pôr o pool a funcionar com alguém a comprar a primeira quantidade real.");
t.bullet("▸", "Atualizar o site /cosmos com os mint addresses e o link do pool.");

// ─── 2. CAMINHO EVM (ETH + BSC) ───
t.section("2", "Caminho EVM · Ethereum + BSC (depois)");
t.sub("2.1 — Carteira + gas", "#f43f5e");
t.bullet("▸", "MetaMask (https://metamask.io) — criar carteira, guardar seed offline.");
t.bullet("▸", "Gas: ETH (Ethereum mainnet, para Uniswap) e BNB (BSC, para PancakeSwap).");
t.bullet("▸", "Recomendado: 0.05-0.1 ETH + 0.1-0.2 BNB para deploy + liquidez.");

t.spacer(2);
t.sub("2.2 — Deploy dos contratos (Hardhat)", "#f43f5e");
t.para("Criar contracts/.env (JÁ está no .gitignore):", 9.5, "#334155");
t.code("DEPLOYER_PRIVATE_KEY=0x...", "a tua private key EVM (NUNCA versionar)");
t.code("RPC_URL=https://mainnet.infura.io/v3/<chave>", "ou BSC: https://bsc-dataseed.binance.org");
t.code("cd contracts && npm install && npx hardhat compile --force", "compila os 4 contratos (solc 0.8.20)");
t.code("npx hardhat run scripts/deploy.cjs --network ethereum", "deploy real Ethereum (Uniswap)");
t.code("npx hardhat run scripts/deploy.cjs --network binance", "deploy real BSC (PancakeSwap)");
t.para("O script grava os endereços em contracts/deployments.json (gitignored) — já existe para a rede local 31337.", 9, "#64748b");

t.spacer(2);
t.sub("2.3 — Pool e launch (TRIN) + treasury (VSR)", "#f43f5e");
t.code("setTreasury(<multisig ou marketing wallet>)", "VSR — definir o treasury (owner)");
t.code("setLaunchPool(<endereço do par Uniswap/PancakeSwap>)", "TRIN — apontar o pool oficial");
t.code("launch()", "TRIN — liberta transferências após pool criada");
t.bullet("▸", "Criar liquidez na Uniswap (VSR/USDT, TRIN/ETH) e PancakeSwap (VSR/USDT, TRIN/BNB).");
t.bullet("▸", "Lock dos LP tokens ≥12 meses via Team Finance.");
t.bullet("▸", "setExcluded para os routers/pairs (evitar taxas duplas nas transações).");

// ─── 3. LISTAGEM E INDEXAÇÃO ───
t.section("3", "Listagem · Indexação · Exchange");
t.sub("Ordem recomendada", "#7c3aed");
t.bullet("▸", "1º — DEX: Raydium/Jupiter (Solana), Uniswap (ETH), PancakeSwap (BSC).");
t.bullet("▸", "2º — Agregadores/gráficos: Birdeye, DexScreener, GeckoTerminal (automático ao verem o pool).");
t.bullet("▸", "3º — CoinGecko: https://coingecko.com/en/coins/add (formulário público, exige website + contrato + liquidez).");
t.bullet("▸", "4º — CoinMarketCap: https://coinmarketcap.com/request/ (requisitos mais exigentes).");
t.bullet("▸", "5º — Auditoria Hacken/SolidityScan (pré-requisito CEXs).");
t.bullet("▸", "6º — CEXs médias: MEXC, Bitget, Gate.io. Depois as grandes: Binance, OKX, Kraken, Coinbase.");
t.para("Requisitos para as grandes: comunidade ativa (Telegram/Twitter), volume real, liquidez locked, auditoria, legal.", 9.5, "#64748b");

// ─── 4. CHECKLIST GO-LIVE ───
t.section("4", "Checklist final · Final checklist");
t.bullets([
  "▸ Phantom instalada, seed guardada em papel (2 cópias, offline).",
  "▸ SOL no endereço Phantom (mín. 1-2 SOL + 0.1 reserva).",
  "▸ Mints VSR e TRIN criados + supply mintado (VSR 300M, TRIN 420.69M).",
  "▸ Metadata publicada (nome VSR/TRIN, símbolo, logo).",
  "▸ Pool Raydium VSR + TRIN criada com preço inicial definido.",
  "▸ Liquidez bloqueada ≥12 meses (Streamflow/Team Finance).",
  "▸ Contrato EVM deployado (ETH + BSC) quando avançares para lá.",
  "▸ Endereços públicos atualizados no site /cosmos e no Telegram.",
  "▸ Cofre PDF regenerado com as novas chaves (npm run cofre).",
]);

// ─── 5. ONDE GUARDAR AS CREDENCIAIS ───
t.section("5", "Onde guardar as credenciais · Where to store credentials");
t.bullets([
  "▸ Seed Phantom / chave EVM: papel, offline, cofre físico. NUNCA digital.",
  "▸ Endereços públicos (mints, pool, contratos): vão para o site, README e PDFs.",
  "▸ RPC keys (Infura/Alchemy): contracts/.env (gitignored) ou variáveis no dashboard.",
  "▸ Cofre central do TVS: `npm run cofre` → data/Viseron_Cofre_Credenciais.pdf (gitignored).",
]);
t.para("⚠️  Se alguma chave for exposta (commit, screenshot, chat), transferir o valor para uma carteira nova IMEDIATAMENTE.", 10, "#dc2626");

t.spacer(1);
t.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · Viseron Cosmos — CONFIDENCIAL", 9, "#7c3aed", { align: "center" });
t.para(`Gerado pelo Squad AIOX · ${new Date().toLocaleDateString("pt-PT")}`, 8.5, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT);
setTimeout(() => {
  const size = fs.statSync(OUT).size;
  console.log(`✅ Viseron_Cosmos_Go_Live_DEX.pdf gerado — ${(size / 1024).toFixed(1)} KB · ${pages} páginas`);
}, 800);
