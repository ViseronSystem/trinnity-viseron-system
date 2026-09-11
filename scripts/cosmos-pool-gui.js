#!/usr/bin/env node
/**
 * Viseron Cosmos — Pool Creator GUI
 * GUI visual para criar pools no Raydium
 */

const fs = require('fs');
const path = require('path');

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';
const VSR_MINT = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU';
const TRIN_MINT = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx';

function printGUI() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║           🌟 VISERON COSMOS — POOL CREATOR 🌟               ║');
  console.log('║                                                              ║');
  console.log('║           Cria pools de liquidez em 5 minutos!               ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  PASSO 1: ABRE O RAYDIUM                                     │');
  console.log('│                                                              │');
  console.log('│  👉 https://raydium.io                                       │');
  console.log('│                                                              │');
  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  PASSO 2: CONECTA A PHANTOM                                  │');
  console.log('│                                                              │');
  console.log('│  1. Clica "Connect Wallet" (canto superior direito)          │');
  console.log('│  2. Seleciona "Phantom"                                      │');
  console.log('│  3. Aprova a ligação                                         │');
  console.log('│                                                              │');
  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  PASSO 3: CRIA POOL VSR/SOL                                  │');
  console.log('│                                                              │');
  console.log('│  1. Clica "Liquidity" no menu                                │');
  console.log('│  2. Clica "Create Pool"                                      │');
  console.log('│  3. Token A: cola este mint:                                 │');
  console.log('│     ─────────────────────────────────────────────            │');
  console.log('│     ' + VSR_MINT);
  console.log('│     ─────────────────────────────────────────────            │');
  console.log('│  4. Token B: seleciona "SOL"                                 │');
  console.log('│  5. Amount A: 142857                                         │');
  console.log('│  6. Amount B: 0.14                                           │');
  console.log('│  7. Clica "Create Pool"                                      │');
  console.log('│  8. Confirma na Phantom                                      │');
  console.log('│                                                              │');
  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  PASSO 4: CRIA POOL TRIN/SOL                                 │');
  console.log('│                                                              │');
  console.log('│  1. Repete o processo                                        │');
  console.log('│  2. Token A: cola este mint:                                 │');
  console.log('│     ─────────────────────────────────────────────            │');
  console.log('│     ' + TRIN_MINT);
  console.log('│     ─────────────────────────────────────────────            │');
  console.log('│  3. Token B: seleciona "SOL"                                 │');
  console.log('│  4. Amount A: 1428571                                        │');
  console.log('│  5. Amount B: 0.14                                           │');
  console.log('│  6. Clica "Create Pool"                                      │');
  console.log('│  7. Confirma na Phantom                                      │');
  console.log('│                                                              │');
  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  ✅ PRONTO! AS TUA POOLS ESTÃO CRIADAS!                      │');
  console.log('│                                                              │');
  console.log('│  Agora os teus tokens têm valor e são tradeáveis!            │');
  console.log('│                                                              │');
  console.log('│  Próximos passos:                                            │');
  console.log('│  → Partilha com a comunidade                                 │');
  console.log('│  → Lista no Jupiter (jup.ag)                                 │');
  console.log('│  → Submete ao CoinGecko                                      │');
  console.log('│                                                              │');
  console.log('└──────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  💰 CUSTO: ~$40 (0.28 SOL para as 2 pools + fees)           ║');
  console.log('║  ⏱️  TEMPO: 5 minutos                                        ║');
  console.log('║  🎯 RESULTADO: Tokens com valor real!                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

printGUI();

// Also create a HTML version
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Viseron Cosmos - Pool Creator</title>
  <style>
    body { font-family: Arial, sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .step { background: #16213e; padding: 20px; margin: 10px 0; border-radius: 10px; border-left: 4px solid #0f3460; }
    .step h3 { color: #e94560; margin-top: 0; }
    .mint { background: #0f3460; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
    .btn { background: #e94560; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    .btn:hover { background: #ff6b6b; }
    .note { background: #533483; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌟 Viseron Cosmos — Pool Creator</h1>
    <p>Cria pools de liquidez em 5 minutos!</p>
    
    <div class="step">
      <h3>PASSO 1: Abre o Raydium</h3>
      <a href="https://raydium.io" target="_blank" class="btn">Abrir Raydium →</a>
    </div>
    
    <div class="step">
      <h3>PASSO 2: Conecta a Phantom</h3>
      <p>1. Clica "Connect Wallet" (canto superior direito)</p>
      <p>2. Seleciona "Phantom"</p>
      <p>3. Aprova a ligação</p>
    </div>
    
    <div class="step">
      <h3>PASSO 3: Cria Pool VSR/SOL</h3>
      <p>1. Clica "Liquidity" → "Create Pool"</p>
      <p>2. Token A (cole este mint):</p>
      <div class="mint">${VSR_MINT}</div>
      <p>3. Token B: seleciona "SOL"</p>
      <p>4. Amount A: <strong>142857</strong></p>
      <p>5. Amount B: <strong>0.14</strong></p>
      <p>6. Clica "Create Pool" e confirma</p>
    </div>
    
    <div class="step">
      <h3>PASSO 4: Cria Pool TRIN/SOL</h3>
      <p>1. Repete o processo</p>
      <p>2. Token A (cole este mint):</p>
      <div class="mint">${TRIN_MINT}</div>
      <p>3. Token B: seleciona "SOL"</p>
      <p>4. Amount A: <strong>1428571</strong></p>
      <p>5. Amount B: <strong>0.14</strong></p>
      <p>6. Clica "Create Pool" e confirma</p>
    </div>
    
    <div class="note">
      <strong>💰 CUSTO:</strong> ~$40 (0.28 SOL para as 2 pools + fees)<br>
      <strong>⏱️ TEMPO:</strong> 5 minutos<br>
      <strong>🎯 RESULTADO:</strong> Tokens com valor real!
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'data', 'pool-creator.html'), htmlContent);
console.log('📄 GUI HTML criado: data/pool-creator.html');
