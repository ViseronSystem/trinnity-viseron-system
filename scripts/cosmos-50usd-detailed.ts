#!/usr/bin/env node
/**
 * Viseron Cosmos — $50 Detailed Breakdown
 * Detalhamento exato de como usar $50
 */

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';

function printDetailedBreakdown() {
  console.log('\n🌟 Viseron Cosmos — Detalhamento $50');
  console.log('=====================================\n');
  
  const totalBudget = 50; // USD
  const solPrice = 140; // USD per SOL
  
  console.log(`💰 Orçamento Total: $${totalBudget}\n`);
  
  // Detailed allocation
  console.log('📊 Alocação Detalhada:\n');
  
  const allocations = [
    { item: 'Pool VSR/SOL', amount: 20, sol: 20/solPrice, percentage: 40 },
    { item: 'Pool TRIN/SOL', amount: 20, sol: 20/solPrice, percentage: 40 },
    { item: 'Marketing (Twitter)', amount: 5, sol: 5/solPrice, percentage: 10 },
    { item: 'Reserva (fees)', amount: 5, sol: 5/solPrice, percentage: 10 },
  ];
  
  for (const alloc of allocations) {
    console.log(`   ${alloc.item}:`);
    console.log(`     USD: $${alloc.amount} (${alloc.percentage}%)`);
    console.log(`     SOL: ${alloc.sol.toFixed(4)} SOL`);
    console.log('');
  }
  
  // Token allocation
  console.log('📊 Alocação de Tokens:\n');
  
  const vsrPoolSol = 20 / solPrice;
  const trinPoolSol = 20 / solPrice;
  
  const vsrTokenPrice = 0.0001; // Initial price per token
  const trinTokenPrice = 0.0001; // Initial price per token
  
  const vsrTokens = vsrPoolSol / vsrTokenPrice;
  const trinTokens = trinPoolSol / trinTokenPrice;
  
  console.log('   Pool VSR/SOL:');
  console.log(`     SOL: ${vsrPoolSol.toFixed(4)} SOL (~$20)`);
  console.log(`     VSR: ${vsrTokens.toLocaleString()} tokens`);
  console.log(`     Preço inicial: $${vsrTokenPrice} por VSR`);
  console.log(`     Market Cap: $${(vsrTokenPrice * 300_000_000).toLocaleString()}`);
  console.log('');
  
  console.log('   Pool TRIN/SOL:');
  console.log(`     SOL: ${trinPoolSol.toFixed(4)} SOL (~$20)`);
  console.log(`     TRIN: ${trinTokens.toLocaleString()} tokens`);
  console.log(`     Preço inicial: $${trinTokenPrice} por TRIN`);
  console.log(`     Market Cap: $${(trinTokenPrice * 420_690_000).toLocaleString()}`);
  console.log('');
  
  // Step by step
  console.log('🎯 Passo a Passo:\n');
  
  const steps = [
    { step: 1, action: 'Depositar $50 em SOL', time: '5 min', cost: '$50' },
    { step: 2, action: 'Criar pool VSR/SOL', time: '10 min', cost: '~$20' },
    { step: 3, action: 'Criar pool TRIN/SOL', time: '10 min', cost: '~$20' },
    { step: 4, action: 'Criar Twitter @ViseronCosmos', time: '15 min', cost: '$0' },
    { step: 5, action: 'Criar Telegram @ViseronCosmos', time: '10 min', cost: '$0' },
    { step: 6, action: 'Primeiro post (meme)', time: '30 min', cost: '$0' },
    { step: 7, action: 'Listar no Jupiter', time: '1 dia', cost: '$0' },
    { step: 8, action: 'Submeter ao CoinGecko', time: '7 dias', cost: '$0' },
  ];
  
  for (const s of steps) {
    console.log(`   Passo ${s.step}: ${s.action}`);
    console.log(`     Tempo: ${s.time}`);
    console.log(`     Custo: ${s.cost}`);
    console.log('');
  }
  
  // Expected results
  console.log('📈 Resultados Esperados:\n');
  
  const scenarios = [
    { scenario: 'Conservador', holders: 10, avgBuy: 50, totalLiquidity: 500 },
    { scenario: 'Moderado', holders: 50, avgBuy: 50, totalLiquidity: 2500 },
    { scenario: 'Otimista', holders: 100, avgBuy: 50, totalLiquidity: 5000 },
  ];
  
  for (const sc of scenarios) {
    console.log(`   Cenário ${sc.scenario}:`);
    console.log(`     Holders: ${sc.holders}`);
    console.log(`     Média de compra: $${sc.avgBuy}`);
    console.log(`     Liquidez total: $${sc.totalLiquidity}`);
    console.log(`     Market Cap estimado: $${(sc.totalLiquidity * 2).toLocaleString()}`);
    console.log(`     ROI potencial: ${(sc.totalLiquidity / totalBudget).toFixed(0)}x`);
    console.log('');
  }
  
  // Risk management
  console.log('⚠️  Gestão de Risco:\n');
  console.log('   → Regra dos 50%: fechar metade do lucro em cada x2');
  console.log('   → Regra dos 20%: manter 20% dos tokens para sempre');
  console.log('   → Não investir mais do que se pode perder');
  console.log('   → Os tokens são novos, alta volatilidade');
  console.log('');
  
  // Tools available
  console.log('🛠️  Ferramentas Disponíveis:\n');
  console.log('   → Mega Scalper v5.0 (já a correr)');
  console.log('   → Scalping Bot v4.0 (já a correr)');
  console.log('   → Raydium Pool Creator (npm run cosmos:pool)');
  console.log('   → Token Dashboard (npm run cosmos:value)');
  console.log('');
  
  // Timeline
  console.log('📅 Timeline:\n');
  console.log('   Dia 1: Criar pools + Twitter + Telegram');
  console.log('   Dia 2-7: Posts diários (1 meme + 1 update)');
  console.log('   Dia 8: Listar no Jupiter');
  console.log('   Dia 15: Submeter ao CoinGecko');
  console.log('   Dia 30: Meta 100 holders');
  console.log('');
  
  console.log('=====================================\n');
}

printDetailedBreakdown();
