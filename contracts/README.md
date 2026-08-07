# Viseron Cosmos — Contracts & Deployment Guide

Tokens reais do TVS, prontos a deployar em **Ethereum**, **BSC** e **Solana**.

| Token | Tipo | Supply | Rede principal | Mecanismo |
|-------|------|--------|----------------|-----------|
| **VSR** (Viseron Crown) | Governance/Utility | 300,000,000 | Ethereum (Uniswap) + BSC | 1% burn + 1% treasury por transferência, ERC20Votes, anti-whale 3% |
| **TRIN** (Trinnity) | Interplanetary Memecoin | 420,690,000 (420.69M) | Ethereum + BSC + Solana | 2% burn por transferência, anti-bot, lock pré-launch |

© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)

## Ficheiros

```
contracts/
├── sol/
│   ├── ViseronCrown.sol        VSR (ERC20 + ERC20Votes + burn + tax + anti-whale)
│   ├── Trinnity.sol            TRIN (ERC20 + burn 2% + anti-bot + lock)
│   ├── ViseronStaking.sol      Stake VSR → recompensas
│   └── ViseronGovernance.sol   Governança on-chain com VSR
├── scripts/deploy.cjs          Deploy EVM (Hardhat) automático
├── hardhat.config.cjs
├── tokenomics.json             Distribuição + roadmap + plano de exchanges
└── solana/                     Metadata SPL (VSR + TRIN)
```

## 1. Ethereum / BSC (EVM)

Pré-requisito: uma carteira com ETH/BNB para o gas + chave privada (NUNCA commitar).

```bash
cd contracts
npm install                    # hardhat + @openzeppelin/contracts + ethers
# cria contracts/.env (gitignored):
#   DEPLOYER_PRIVATE_KEY=0x...
#   RPC_URL=https://mainnet.infura.io/v3/<key>   (ou BSC: https://bsc-dataseed.binance.org)
npx hardhat run scripts/deploy.cjs --network ethereum
# TRIN: também em BSC (--network binance) para o bridge + PancakeSwap
```

O script:
1. Deploya **ViseronCrown** (VSR) com treasury = endereço do owner.
2. Deploya **Trinnity** (TRIN).
3. Deploya **ViseronStaking** (stake VSR → recompensas TRIN).
4. Deploya **ViseronGovernance** (usa o VSR como token de voto).
5. Grava os endereços em `contracts/deployments.json`.

### Passos de go-live EVM
1. `setTreasury(<multisig or marketing wallet>)` no VSR (owner).
2. `setLaunchPool(<UniswapV2/PancakeSwap pair>)` e `launch()` no TRIN.
3. Criar liquidez: USDT/ETH ↔ VSR e USDT/BNB ↔ TRIN (ex. 20% da oferta, lock ≥12 meses, ex. Team Finance).
4. `setExcluded` para DEX router/pair (evitar taxas duplas).

## 2. Solana (SPL)

Pré-requisito: wallet Solana com SOL + `@solana/spl-token`.

```bash
# 1. Criar os mint authority
spl-token create-token --decimals 9 --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA   # VSR mint
spl-token create-token --decimals 9 --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA   # TRIN mint

# 2. Mint (VSR: 300M, TRIN: 420,690,000 — 420.69M)
#    ⚠️ O supply base (units) NUNCA pode exceder u64 (~1.8e19). Com 9 decimais: VSR 3e17 ✓, TRIN 4.2e17 ✓.
spl-token mint <VSR_MINT> 300000000000000000000000000 <dest>
spl-token mint <TRIN_MINT> 420690000000000000000 <dest>

# 3. Metadata (usar os ficheiros em solana/)
metaplex token create-metadata --name "Viseron Crown" --symbol VSR --uri ./solana/vsr-metadata.json
metaplex token create-metadata --name "Trinnity" --symbol TRIN --uri ./solana/trin-metadata.json

# 4. Liquidez: Raydium CLMM ou Jupiter
```

## 3. Verificação e segurança
- Verificar os contratos no Etherscan/BSCScan (compilador 0.8.20, MIT) — necessário para trust.
- Auditoria externa (Hacken / SolidityScan) antes de pedir listagem.
- `deployments.json` (endereços reais) e `.env` ficam **gitignored**.

## 4. Plano de exchanges (ver tokenomics.json → exchangePlan)
1. DEX: Uniswap (ETH) + PancakeSwap (BSC) + Raydium (Solana)
2. Indexação: CoinGecko + CoinMarketCap (formulário público)
3. Auditoria + lock liquidity (Team Finance) — requisitos das CEXs
4. CEXs médias: MEXC, Bitget, Gate.io
5. CEXs grandes: Binance, OKX, Kraken, Coinbase (comunidade + volume + legal)
