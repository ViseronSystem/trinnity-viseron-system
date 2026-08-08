import * as fs from "fs";
import * as path from "path";
import { createTheme } from "./pdf-theme";

// ═══════════════════════════════════════════════════════════════════
// PDF OPERAÇÕES COSMOS — VISERON COSMOS ($VSR · $TRIN)
// Guia prático: ver/importar tokens na Phantom (app iOS), por que o
// swap falha sem pool, como criar a pool Raydium no futuro (passo a
// passo), e a fábrica de carteiras (50/semana).
// Trilingue (PT/ES/EN). © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)
// ═══════════════════════════════════════════════════════════════════

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "Viseron_Cosmos_Operacoes_Wallet.pdf");

const t = createTheme({
  title: "Viseron Cosmos — Operações da Wallet | Wallet Operations | Operaciones de la Cartera",
  subject: "$VSR · $TRIN — guia prático: importar tokens na Phantom, pool Raydium no futuro, fábrica de carteiras (PT/ES/EN)",
});

t.cover({
  title: "VISERON COSMOS\nOPERAÇÕES DA WALLET",
  subtitle: "Como ver os teus tokens · por que o swap falha · como criar a pool no futuro · fábrica de 50 carteiras/semana | How to see your tokens · why the swap fails · how to create the pool later · 50-wallet factory | Cómo ver tus tokens · por qué falla el swap · cómo crear el pool después · fábrica de 50 carteras/semana",
  badges: ["Phantom", "iOS", "Solana", "Raydium", "VSR", "TRIN", "Fábrica de carteiras", "CONFIDENCIAL"],
  date: "08/08/2026",
  version: "1.0",
  url: "www.trinnityviseronsystem.io/cosmos",
});
t.para("AUTORIA & PROPRIEDADE INTELECTUAL — © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha). Todos os direitos reservados · All rights reserved · Todos los derechos reservados.", 10, "#7c3aed");
t.para("CONFIDENCIAL — contém endereços de wallet e instruções de segurança. NUNCA partilhar. / CONFIDENTIAL — contains wallet addresses and security instructions. NEVER share. / CONFIDENCIAL — contiene direcciones de cartera e instrucciones de seguridad. NUNCA compartir.", 9.5, "#ef4444");

// ─── 0. ESTADO ATUAL ───
t.section("0", "Estado atual · Current state · Estado actual");
t.sub("Tudo o que já está feito e confirmado on-chain (Solana mainnet)", "#22c55e");
t.bullet("▸", "Wallet oficial: Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj — verificado com saldos reais.");
t.bullet("▸", "VSR 300,000,000 — mint 7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU · authority revogada.");
t.bullet("▸", "TRIN 420,690,000 (420.69M) — mint Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx · authority revogada.");
t.bullet("▸", "Mint TRIN antigo 36DgSEod... queimado (abandonado) — NUNCA usar.");
t.bullet("▸", "Tokens NÃO estão perdidos: estão na wallet acima. A Phantom só os esconde no filtro de spam.");
t.bullet("▸", "Swap (troca) ainda NÃO funciona: não existe pool de liquidez em nenhuma DEX. É o próximo passo.");

// ─── 1. VER/IMPORTAR OS TOKENS NA PHANTOM ───
t.section("1", "Ver os tokens na Phantom (app iOS) · See tokens in Phantom (iOS) · Ver tokens en Phantom (iOS)");
t.sub("Por que não aparecem", "#f59e0b");
t.para("A Phantom esconde automaticamente tokens que parecem spam (sem pool, sem preço, recém-criados). Os tokens ESTÃO na carteira — basta desocultá-los. Não é preciso importar nada por mint address na app móvel atual: usa o menu de gestão de tokens.", 9.5, "#334155");

t.spacer(2);
t.sub("Passo a passo na app iOS", "#22c55e");
t.bullet("1", "Abrir a Phantom no iPhone. No separador Home, tocar em Tokens.");
t.bullet("2", "Tocar no ícone de sliders/reguladores no canto superior direito.");
t.bullet("3", "Procurar VSR (Viseron Crown) e TRIN (Trinnity) na lista de tokens escondidos.");
t.bullet("4", "Ativar o toggle de cada um → voltam a aparecer no portefólio com os saldos completos.");
t.para("Alternativa: rolar até ao fundo da lista de Tokens → “Manage Token List” → ativar “Show hidden tokens”.", 9, "#64748b");
t.para("Para confirmar on-chain que os tokens estão lá, ver em https://solscan.io/account/Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj — mostra o saldo de cada token SPL da wallet.", 9, "#334155");

t.spacer(2);
t.sub("Se o nome aparecer como “Unknown Token”", "#f59e0b");
t.para("Significa que falta Metaplex metadata no mint. Passos: publicar o metadata JSON (contracts/solana/trin-metadata.json) em IPFS/Arweave e atualizar o mint com `metaplex token update-metadata`. Sem isto, o token continua a existir e a ser transferível — só perde o nome/logo na interface.", 9.5, "#334155");

// ─── 2. POR QUE O SWAP FALHA ───
t.section("2", "Por que o swap falha · Why the swap fails · Por qué falla el swap");
t.sub("Comprar/vender TRIN e VSR ainda não é possível — e é normal", "#ef4444");
t.para("Tentar “comprar 1 dólar” ou trocar SOL→TRIN/VSR falha porque NÃO EXISTE pool de liquidez. Uma swap precisa de um mercado (pool) com fundos dos dois lados: quem quer trocar SOL por TRIN precisa de um pool que tenha TRIN para vender. Como a pool nunca foi criada, a Phantom/Jupiter não encontra rota e bloqueia a operação.", 9.5, "#334155");
t.bullet("▸", "Sem pool → não há preço de mercado → não há compra/venda. Não é erro da Phantom nem dos tokens.");
t.bullet("▸", "Os tokens estão seguros na wallet e ficarão lá até a pool existir.");
t.bullet("▸", "Quando a pool for criada (secção 3), o swap passa a funcionar imediatamente na Phantom/Jupiter.");

// ─── 3. COMO CRIAR A POOL NO FUTURO ───
t.section("3", "Criar a pool Raydium (quando houver fundos) · Create the Raydium pool (when funded) · Crear el pool Raydium (cuando haya fondos)");
t.sub("Pré-requisito financeiro", "#f59e0b");
t.bullet("▸", "Carregar ~$500 em SOL (mais ~$250 em USDC) na wallet Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj.");
t.bullet("▸", "O custo inclui: liquidez inicial, rent das contas do pool e taxas de transação (estimativa total 0.1–0.5 SOL em fees).");
t.para("O saldo atual (~0.07 SOL) não cobre a liquidez mínima — por isso o passo ficou adiado. Quando carregares os fundos, avisar o assistente: o script da pool fica pronto e executa a criação das pools TRIN/USDC e VSR/USDC.", 9.5, "#334155");

t.spacer(2);
t.sub("Passo a passo (manual, se preferires fazer tu)", "#22c55e");
t.bullet("1", "Abrir https://raydium.io → Connect Wallet → Phantom.");
t.bullet("2", "Pools → Create / Concentrated Liquidity (CLMM).");
t.bullet("3", "Par: VSR/USDC (mint 7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU) e TRIN/USDC (mint Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx).");
t.bullet("4", "Depositar o par (ex. 20% VSR + 25% TRIN da oferta + USDC equivalente).");
t.bullet("5", "Definir o preço inicial (ex. VSR = $0.00001 · TRIN = $0.000000001 — a definir com a estratégia).");
t.bullet("6", "Recebes os LP tokens (posição) — NÃO vender: são a liquidez do projeto.");
t.bullet("7", "Depois do swap funcionar, atualizar o site /cosmos com os links da pool e do preço.");
t.sub("Lock da liquidez (segurança obrigatória)", "#ef4444");
t.bullet("▸", "Bloquear os LP tokens ≥12 meses (ideal 24) em app.streamflow.finance ou app.team.finance.");
t.bullet("▸", "Partilhar o endereço do lock no site/Telegram como prova pública de compromisso.");

// ─── 4. FÁBRICA DE CARTEIRAS (50/SEMANA) ───
t.section("4", "Fábrica de carteiras (50+/semana) · Wallet factory (50+/week) · Fábrica de carteras (50+/semana)");
t.sub("Por que existe", "#7c3aed");
t.para("Para clientes e funcionários que recebem pagamento direto em cripto, criamos carteiras Phantom em lote. UM comando gera tudo e o processo fica gravado — nunca mais esquecer.", 9.5, "#334155");

t.spacer(2);
t.sub("Comando único", "#22c55e");
t.code("npm run cosmos:wallets -- 50 --prefix semana1", "gera 50 carteiras Phantom de uma vez (muda 50 pelo nº desejado; --prefix identifica o lote)");
t.bullet("▸", "Saída: contracts/wallets/<prefixo>_<nnn>-keypair.json (64-byte secretKey para deploy).");
t.bullet("▸", "Saída: contracts/wallets/<prefixo>_<nnn>-seed.txt (frase secreta — para o cliente importar na Phantom).");
t.bullet("▸", "Saída: contracts/wallets/index.json (índice id → endereço público + caminhos).");
t.bullet("▸", "Saída: data/Viseron_Wallets_Fabrica_<data>.txt (ACESSO COMPLETO de todas: endereço + frase + chave privada base58 32/64 + keypair JSON).");

t.spacer(2);
t.sub("Rotina semanal", "#22c55e");
t.bullet("1", "Correr o comando acima (ex. todos os domingos, lote “semana1”, “semana2”, …).");
t.bullet("2", "Abrir data/Viseron_Wallets_Fabrica_<data>.txt no Bloco de Notas.");
t.bullet("3", "Entregar a cada cliente a seed (ficheiro *-seed.txt) e o endereço público para receber tokens.");
t.bullet("4", "Depois de distribuir, APAGAR o documento de acesso e os *-seed.txt dos entregues.");

t.spacer(2);
t.sub("Segurança obrigatória", "#ef4444");
t.bullets([
  { icon: "▸", text: "contracts/wallets/ e data/Viseron_Wallets_Fabrica_*.txt são gitignored — NUNCA versionar.", color: "#dc2626" },
  { icon: "▸", text: "Frase secreta/chave privada NUNCA aparecem no chat nem no terminal — só nos ficheiros locais.", color: "#dc2626" },
  { icon: "▸", text: "Uma wallet cuja seed apareceu no chat é considerada COMPROMETIDA → gerar nova (o comando com --prefix novo cria outras).", color: "#dc2626" },
  { icon: "▸", text: "Backup: ao sobrescrever ficheiros, guardar sempre cópia do conteúdo antigo.", color: "#334155" },
  { icon: "▸", text: "A wallet oficial de deploy é contracts/solana-keypair.json (não confundir com contracts/wallets/).", color: "#334155" },
]);
t.sub("No lado do cliente (importar na Phantom)", "#22c55e");
t.bullet("▸", "Phantom → Add Wallet → Import Recovery Phrase → colar a seed do ficheiro *-seed.txt.");
t.bullet("▸", "Endereço público = o do ficheiro *-keypair.json.");
t.bullet("▸", "VSR/TRIN só aparecem depois de “Import Tokens” com o mint address (secção 1).");

// ─── 5. CHECKLIST DE RESUMO ───
t.section("5", "Checklist · Summary checklist");
t.bullets([
  "▸ Tokens VSR/TRIN visíveis na Phantom iOS (menu de gestão de tokens).",
  "▸ Swap a funcionar = pool Raydium criada (requer ~$500 SOL + USDC).",
  "▸ Pool + liquidez lock ≥12 meses (Streamflow/Team Finance).",
  "▸ Fábrica de carteiras: npm run cosmos:wallets -- 50 --prefix semanaX.",
  "▸ Segredos nunca em chat/commits; fábrica gitignored.",
  "▸ Site /cosmos atualizado com pools e preços quando o go-live avançar.",
]);

t.spacer(1);
t.para("© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) · Viseron Cosmos — CONFIDENCIAL", 9, "#7c3aed", { align: "center" });
t.para(`Gerado pelo Squad AIOX · ${new Date().toLocaleDateString("pt-PT")}`, 8.5, "#64748b", { align: "center" });

const pages = t.page();
t.finish(OUT);
setTimeout(() => {
  const size = fs.statSync(OUT).size;
  console.log(`✅ Viseron_Cosmos_Operacoes_Wallet.pdf gerado — ${(size / 1024).toFixed(1)} KB · ${pages} páginas`);
}, 800);
