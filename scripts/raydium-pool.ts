#!/usr/bin/env tsx
/**
 * Viseron Cosmos — Raydium Liquidity Pool Creator
 * Cria pools de liquidez para VSR e TRIN no Raydium (Solana)
 * 
 * Uso: npx tsx scripts/raydium-pool.ts [--dry-run]
 * 
 * Requer: SOL na wallet Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj
 * Mínimo: ~2 SOL para criar pool + liquidez inicial
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';
const MINTS_FILE = path.join(__dirname, '..', 'contracts', 'solana', 'mints.json');

const TOKENS = {
  VSR: {
    mint: '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU',
    symbol: 'VSR',
    name: 'Viseron Crown',
    supply: 300_000_000,
    decimals: 9,
  },
  TRIN: {
    mint: 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx',
    symbol: 'TRIN',
    name: 'Trinnity',
    supply: 420_690_000,
    decimals: 9,
  },
};

// Raydium AMM Program IDs (Solana Mainnet)
const RAYDIUM = {
  AMM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  ROUTER: '-routePu5RoK8gEj4zgFfEGBYXbfr9J7A9gQ8jN1V3',
};

interface PoolConfig {
  token: typeof TOKENS.VSR;
  solAmount: number;      // SOL to add as liquidity
  tokenAmount: number;    // Tokens to add as liquidity
  initialPrice: number;   // Price in SOL per token
}

function calculatePoolParams(config: PoolConfig) {
  const { token, solAmount, tokenAmount, initialPrice } = config;
  
  // Calculate LP token amount (geometric mean)
  const lpTokens = Math.sqrt(solAmount * tokenAmount);
  
  // Price impact
  const priceImpact = ((tokenAmount * initialPrice) / solAmount) * 100;
  
  return {
    solAmount,
    tokenAmount,
    lpTokens: lpTokens.toFixed(4),
    initialPrice: initialPrice.toFixed(8),
    priceImpact: priceImpact.toFixed(2),
    poolValue: (solAmount * 140).toFixed(2), // Assuming $140/SOL
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('\n🌟 Viseron Cosmos — Raydium Pool Creator');
  console.log('==========================================\n');
  
  // Check if mints exist
  if (!fs.existsSync(MINTS_FILE)) {
    console.error('❌ Mints não encontrados. Corre npm run cosmos:solana primeiro.');
    process.exit(1);
  }
  
  const mints = JSON.parse(fs.readFileSync(MINTS_FILE, 'utf8'));
  console.log('📋 Mints encontrados:');
  for (const t of mints.tokens) {
    console.log(`  ${t.symbol}: ${t.mint}`);
  }
  
  // Pool configurations
  const pools: PoolConfig[] = [
    {
      token: TOKENS.VSR,
      solAmount: 1.0,           // 1 SOL (~$140)
      tokenAmount: 1_000_000,   // 1M VSR tokens
      initialPrice: 0.0000001,  // Price per VSR in SOL
    },
    {
      token: TOKENS.TRIN,
      solAmount: 1.0,           // 1 SOL (~$140)
      tokenAmount: 1_000_000,   // 1M TRIN tokens
      initialPrice: 0.0000001,  // Price per TRIN in SOL
    },
  ];
  
  console.log('\n📊 Pool Configurations:\n');
  
  for (const pool of pools) {
    const params = calculatePoolParams(pool);
    console.log(`${pool.token.symbol} Pool:`);
    console.log(`  SOL Liquidity:     ${params.solAmount} SOL (~$${params.poolValue})`);
    console.log(`  Token Liquidity:   ${params.tokenAmount.toLocaleString()} ${pool.token.symbol}`);
    console.log(`  Initial Price:     ${params.initialPrice} SOL per ${pool.token.symbol}`);
    console.log(`  LP Tokens:         ${params.lpTokens}`);
    console.log(`  Price Impact:      ${params.priceImpact}%`);
    console.log('');
  }
  
  if (dryRun) {
    console.log('🔒 DRY RUN — Nenhuma transação enviada.\n');
    console.log('Para criar as pools, remove --dry-run e garante que tens SOL suficiente.');
    return;
  }
  
  // Check SOL balance
  console.log('💰 Verificando saldo SOL...');
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [WALLET],
      }),
    });
    const data = await response.json() as any;
    const lamports = data.result.value;
    const sol = lamports / 1e9;
    
    console.log(`  Saldo: ${sol.toFixed(6)} SOL (~$${(sol * 140).toFixed(2)})`);
    
    const totalNeeded = pools.reduce((sum, p) => sum + p.solAmount, 0) + 0.01; // +0.01 for fees
    
    if (sol < totalNeeded) {
      console.log(`\n⚠️  SOL insuficiente para criar as pools.`);
      console.log(`   Necessário: ~${totalNeeded.toFixed(2)} SOL (${pools.length} pools + fees)`);
      console.log(`   Disponível: ${sol.toFixed(6)} SOL`);
      console.log(`\n📌 Para criar as pools, adiciona pelo menos ${totalNeeded.toFixed(2)} SOL à wallet.`);
      console.log(`   Wallet: ${WALLET}`);
      console.log(`   Depois corre: npm run cosmos:pool`);
      return;
    }
    
    console.log('\n✅ SALDO SUFICIENTE!\n');
    
    // In a real implementation, this would use the Raydium SDK to:
    // 1. Create the pool
    // 2. Add initial liquidity
    // 3. Lock LP tokens (optional but recommended)
    
    console.log('🔧 Implementação Raydium SDK:');
    console.log('   1. Criar pool AMM no Raydium');
    console.log('   2. Adicionar liquidez inicial');
    console.log('   3. Opcionalmente travar LP tokens (Team Finance)');
    console.log('');
    console.log('📖 Documentação: https://docs.raydium.io/');
    console.log('');
    console.log('⚡ Para implementar, instala @raydium-io/raydium-sdk-v2:');
    console.log('   npm install @raydium-io/raydium-sdk-v2');
    
  } catch (error) {
    console.error('❌ Erro ao verificar saldo:', error);
  }
  
  console.log('\n==========================================');
  console.log('🎯 Próximos passos para dar valor aos tokens:');
  console.log('');
  console.log('1. Adicionar SOL à wallet (mínimo 2 SOL)');
  console.log('2. Criar pools no Raydium (VSR/SOL e TRIN/SOL)');
  console.log('3. Listar no Jupiter (jup.ag) para swap');
  console.log('4. Submeter ao CoinGecko/CoinMarketCap');
  console.log('5. Criar comunidade (Telegram/Twitter)');
  console.log('==========================================\n');
}

main().catch(console.error);
