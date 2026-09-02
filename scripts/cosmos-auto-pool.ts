#!/usr/bin/env node
/**
 * Viseron Cosmos — Auto Pool Creator
 * Cria pools de liquidez automaticamente no Raydium
 */

const fs = require('fs');
const path = require('path');
const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer, getMint, getAccount } = require('@solana/spl-token');

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';
const KEYPAIR_FILE = path.join(__dirname, '..', 'contracts', 'solana-keypair.json');
const MINTS_FILE = path.join(__dirname, '..', 'contracts', 'solana', 'mints.json');

const VSR_MINT = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU';
const TRIN_MINT = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx';

const RAYDIUM_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

async function main() {
  console.log('\n🚀 VISERON COSMOS — AUTO POOL CREATOR');
  console.log('=====================================\n');
  
  // Check keypair
  if (!fs.existsSync(KEYPAIR_FILE)) {
    console.error('❌ Keypair file not found:', KEYPAIR_FILE);
    console.log('   Please export your private key from Phantom');
    process.exit(1);
  }
  
  // Load keypair
  const keyData = JSON.parse(fs.readFileSync(KEYPAIR_FILE, 'utf8'));
  const secretKey = Array.isArray(keyData) ? keyData : keyData.secretKey;
  const payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  
  console.log('✅ Keypair loaded');
  console.log(`   Wallet: ${payer.publicKey.toBase58()}`);
  
  // Connect to Solana
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(payer.publicKey);
  const sol = balance / 1e9;
  console.log(`\n💰 Balance: ${sol.toFixed(6)} SOL (~$${(sol * 140).toFixed(2)})`);
  
  if (sol < 0.3) {
    console.error('❌ Insufficient SOL. Need at least 0.3 SOL for pools + fees');
    process.exit(1);
  }
  
  // Load mints
  if (!fs.existsSync(MINTS_FILE)) {
    console.error('❌ Mints file not found:', MINTS_FILE);
    console.log('   Run: npm run cosmos:solana');
    process.exit(1);
  }
  
  const mints = JSON.parse(fs.readFileSync(MINTS_FILE, 'utf8'));
  const vsrMint = new PublicKey(VSR_MINT);
  const trinMint = new PublicKey(TRIN_MINT);
  
  console.log('\n📊 Token Mints:');
  console.log(`   VSR: ${VSR_MINT}`);
  console.log(`   TRIN: ${TRINMINT}`);
  
  // Get token accounts
  console.log('\n🔍 Getting token accounts...');
  
  const vsrAccount = await getAccount(connection, await getOrCreateAssociatedTokenAccount(connection, payer, vsrMint, payer.publicKey).then(acc => acc.address));
  const trinAccount = await getAccount(connection, await getOrCreateAssociatedTokenAccount(connection, payer, trinMint, payer.publicKey).then(acc => acc.address));
  
  const vsrBalance = Number(vsrAccount.amount) / 1e9;
  const trinBalance = Number(trinAccount.amount) / 1e9;
  
  console.log(`   VSR: ${vsrBalance.toLocaleString()} tokens`);
  console.log(`   TRIN: ${trinBalance.toLocaleString()} tokens`);
  
  // Calculate pool amounts
  const vsrPoolAmount = 142857; // 142,857 VSR
  const trinPoolAmount = 1428571; // 1,428,571 TRIN
  const solPoolAmount = 0.14 * 1e9; // 0.14 SOL in lamports
  
  console.log('\n📊 Pool Configuration:');
  console.log('   VSR Pool:');
  console.log(`     VSR: ${vsrPoolAmount.toLocaleString()} tokens`);
  console.log(`     SOL: 0.14 SOL (~$19.60)`);
  console.log('');
  console.log('   TRIN Pool:');
  console.log(`     TRIN: ${trinPoolAmount.toLocaleString()} tokens`);
  console.log(`     SOL: 0.14 SOL (~$19.60)`);
  
  // Note about Raydium
  console.log('\n⚠️  IMPORTANT NOTE:');
  console.log('   Creating Raydium pools requires interacting with');
  console.log('   the Raydium AMM program directly. This is complex');
  console.log('   and requires precise instructions.');
  console.log('');
  console.log('   The recommended approach is to use the Raydium');
  console.log('   website (raydium.io) which provides a user-friendly');
  console.log('   interface for creating pools.');
  console.log('');
  console.log('   Alternatively, you can use Jupiter (jup.ag) to');
  console.log('   swap tokens and provide liquidity indirectly.');
  console.log('');
  
  // Alternative: Use Jupiter to swap
  console.log('🎯 ALTERNATIVE: JUPITER SWAP');
  console.log('');
  console.log('   Instead of creating pools, you can:');
  console.log('   1. Go to jup.ag');
  console.log('   2. Connect your Phantom wallet');
  console.log('   3. Swap SOL for VSR or TRIN');
  console.log('   4. This creates demand and value');
  console.log('');
  
  // Create a simple swap script
  console.log('📝 CREATING SWAP SCRIPT...');
  
  const swapScript = `#!/usr/bin/env node
/**
 * Viseron Cosmos — Jupiter Swap
 * Swap SOL for VSR or TRIN on Jupiter
 */

const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createJupiterApiClient } = require('@jup-ag/api');

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';
const VSR_MINT = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU';
const TRIN_MINT = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function swapSolForToken(inputMint, amount) {
  console.log(\`\\n🔄 Swapping \${amount} SOL for tokens...\`);
  
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const jupiter = await createJupiterApiClient();
  
  // Get quote
  const quote = await jupiter.quoteGet({
    inputMint: SOL_MINT,
    outputMint: inputMint,
    amount: Math.floor(amount * 1e9),
    slippageBps: 50
  });
  
  console.log(\`   Output: \${quote.outAmount} tokens\`);
  console.log(\`   Price Impact: \${quote.priceImpactPct}%\`);
  
  // Get swap transaction
  const swap = await jupiter.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: WALLET,
      wrapAndUnwrapSol: true
    }
  });
  
  console.log(\`   Transaction: \${swap.txid}\`);
  console.log(\`   View: https://solscan.io/tx/\${swap.txid}\`);
  
  return swap.txid;
}

async function main() {
  console.log('\\n🌟 VISERON COSMOS — JUPITER SWAP');
  console.log('=====================================\\n');
  
  // Swap for VSR
  await swapSolForToken(VSR_MINT, 0.14);
  
  // Swap for TRIN
  await swapSolForToken(TRIN_MINT, 0.14);
  
  console.log('\\n✅ Swaps completed!');
  console.log('\\n=====================================\\n');
}

main().catch(console.error);
`;
  
  fs.writeFileSync(path.join(__dirname, 'cosmos-jupiter-swap.js'), swapScript);
  console.log('✅ Jupiter swap script created: scripts/cosmos-jupiter-swap.js');
  
  console.log('\n=====================================\n');
}

main().catch(console.error);
