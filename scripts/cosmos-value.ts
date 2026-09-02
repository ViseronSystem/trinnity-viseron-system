#!/usr/bin/env node
/**
 * Viseron Cosmos — Token Value Dashboard
 * Mostra estado atual dos tokens e como dar-lhes valor
 */

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';

const TOKENS = {
  VSR: {
    mint: '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU',
    symbol: 'VSR',
    name: 'Viseron Crown',
    supply: 300_000_000,
    balance: 300_000_000, // All in wallet
  },
  TRIN: {
    mint: 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx',
    symbol: 'TRIN',
    name: 'Trinnity',
    supply: 420_690_000,
    balance: 420_690_000, // All in wallet
  },
};

async function main() {
  console.log('\n🌟 Viseron Cosmos — Token Value Dashboard');
  console.log('==========================================\n');
  
  // Check SOL balance
  console.log('💰 Carteira Solana:');
  console.log(`   Wallet: ${WALLET}`);
  console.log('');
  
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
    const data = await response.json();
    const lamports = data.result.value;
    const sol = lamports / 1e9;
    
    console.log(`   SOL: ${sol.toFixed(6)} (~$${(sol * 140).toFixed(2)})`);
    console.log('');
    
    // Token status
    console.log('📊 Tokens Status:\n');
    
    for (const [symbol, token] of Object.entries(TOKENS)) {
      console.log(`${symbol} (${token.name}):`);
      console.log(`   Mint: ${token.mint}`);
      console.log(`   Supply: ${token.supply.toLocaleString()}`);
      console.log(`   Na wallet: ${token.balance.toLocaleString()}`);
      console.log(`   Authority: REVOGADA ✅`);
      console.log('');
    }
    
    // Value assessment
    console.log('💡 Avaliação de Valor:\n');
    console.log('   Estado atual: SEM VALOR (sem pool de liquidez)');
    console.log('   Para ter valor, precisamos de:');
    console.log('');
    console.log('   1. Pool de liquidez no Raydium (mínimo 1 SOL por pool)');
    console.log('   2. Listagem no Jupiter (jup.ag) para swaps');
    console.log('   3. Comunidade a comprar/vender');
    console.log('');
    
    // Action plan
    console.log('🎯 Plano de Ação:\n');
    console.log('   FASE 1 - Liquidez (precisa de ~2 SOL):');
    console.log('   → Adicionar 2 SOL à wallet');
    console.log('   → Criar pool VSR/SOL no Raydium');
    console.log('   → Criar pool TRIN/SOL no Raydium');
    console.log('');
    console.log('   FASE 2 - Listagem:');
    console.log('   → Submeter ao Jupiter para listagem');
    console.log('   → Criar página no CoinGecko');
    console.log('   → Criar página no CoinMarketCap');
    console.log('');
    console.log('   FASE 3 - Comunidade:');
    console.log('   → Criar Telegram oficial');
    console.log('   → Criar Twitter/X oficial');
    console.log('   → Marketing orgânico');
    console.log('');
    
    // Pool calculator
    console.log('🧮 Cálculo de Pool (se tivesses 2 SOL):\n');
    
    const solPrice = 140; // USD
    
    // VSR Pool
    const vsrPoolSol = 1.0;
    const vsrPoolTokens = 1_000_000;
    const vsrPrice = vsrPoolSol / vsrPoolTokens;
    const vsrMcap = vsrPrice * TOKENS.VSR.supply;
    
    console.log('   Pool VSR/SOL:');
    console.log(`     Liquidez: ${vsrPoolSol} SOL (~$${vsrPoolSol * solPrice})`);
    console.log(`     Tokens: ${vsrPoolTokens.toLocaleString()} VSR`);
    console.log(`     Preço: $${(vsrPrice * solPrice).toFixed(8)} por VSR`);
    console.log(`     Market Cap: $${vsrMcap.toLocaleString()}`);
    console.log('');
    
    // TRIN Pool
    const trinPoolSol = 1.0;
    const trinPoolTokens = 1_000_000;
    const trinPrice = trinPoolSol / trinPoolTokens;
    const trinMcap = trinPrice * TOKENS.TRIN.supply;
    
    console.log('   Pool TRIN/SOL:');
    console.log(`     Liquidez: ${trinPoolSol} SOL (~$${trinPoolSol * solPrice})`);
    console.log(`     Tokens: ${trinPoolTokens.toLocaleString()} TRIN`);
    console.log(`     Preço: $${(trinPrice * solPrice).toFixed(8)} por TRIN`);
    console.log(`     Market Cap: $${trinMcap.toLocaleString()}`);
    console.log('');
    
    // Exchanges
    console.log('🏦 Plano de Exchanges:\n');
    console.log('   1. DEX (agora):');
    console.log('      → Raydium (Solana)');
    console.log('      → Uniswap (Ethereum)');
    console.log('      → PancakeSwap (BSC)');
    console.log('');
    console.log('   2. Agregadores (depois):');
    console.log('      → Jupiter (jup.ag)');
    console.log('      → 1inch');
    console.log('');
    console.log('   3. CEXs (futuro):');
    console.log('      → MEXC');
    console.log('      → Bitget');
    console.log('      → Gate.io');
    console.log('      → Binance (meta)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro ao conectar à Solana:', error.message);
    console.log('\n   A verificar saldo local...');
  }
  
  console.log('==========================================\n');
}

main();
