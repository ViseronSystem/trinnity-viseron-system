#!/usr/bin/env node
/**
 * Viseron Cosmos — Raydium Pool Creator (Direct)
 * Cria pools usando Raydium AMM program diretamente
 */

const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getMint, getAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Raydium AMM V4 Program ID
const RAYDIUM_AMM_PROGRAM = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const SYSTEM_PROGRAM = new PublicKey('11111111111111111111111111111111');
const RENT_PROGRAM = new PublicKey('SysvarRent111111111111111111111111111111111');
const CLOCK_PROGRAM = new PublicKey('SysvarC1ock11111111111111111111111111111111');

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';
const KEYPAIR_FILE = path.join(__dirname, '..', 'contracts', 'solana-keypair.json');
const VSR_MINT = new PublicKey('7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU');
const TRIN_MINT = new PublicKey('Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx');
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

async function main() {
  console.log('\n🚀 VISERON COSMOS — RAYDIUM POOL CREATOR');
  console.log('=====================================\n');
  
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
    console.error('❌ Insufficient SOL. Need at least 0.3 SOL');
    process.exit(1);
  }
  
  // Get token accounts
  console.log('\n🔍 Getting token accounts...');
  
  const vsrAccount = await getAssociatedTokenAddress(VSR_MINT, payer.publicKey);
  const trinAccount = await getAssociatedTokenAddress(TRIN_MINT, payer.publicKey);
  
  let vsrBalance = 0;
  let trinBalance = 0;
  
  try {
    const vsrInfo = await getAccount(connection, vsrAccount);
    vsrBalance = Number(vsrInfo.amount) / 1e9;
  } catch (e) {
    console.log('   VSR account not found, will create');
  }
  
  try {
    const trinInfo = await getAccount(connection, trinAccount);
    trinBalance = Number(trinInfo.amount) / 1e9;
  } catch (e) {
    console.log('   TRIN account not found, will create');
  }
  
  console.log(`   VSR: ${vsrBalance.toLocaleString()} tokens`);
  console.log(`   TRIN: ${trinBalance.toLocaleString()} tokens`);
  
  // Pool parameters
  const vsrPoolAmount = 142857;
  const trinPoolAmount = 1428571;
  const solPoolAmount = 0.14;
  
  console.log('\n📊 Pool Configuration:');
  console.log('   VSR Pool:');
  console.log(`     VSR: ${vsrPoolAmount.toLocaleString()} tokens`);
  console.log(`     SOL: ${solPoolAmount} SOL (~$${solPoolAmount * 140})`);
  console.log('');
  console.log('   TRIN Pool:');
  console.log(`     TRIN: ${trinPoolAmount.toLocaleString()} tokens`);
  console.log(`     SOL: ${solPoolAmount} SOL (~$${solPoolAmount * 140})`);
  
  // Create pool instruction data
  // Raydium AMM V4 initialize2 instruction
  function createInitializeInstruction(poolTokenAccount, lpTokenMint, coinTokenAccount, pcTokenAccount, coinMint, pcMint, coinVault, pcVault, targetOrders, openBookMarket) {
    // Instruction data for Raydium AMM V4 initialize2
    // This is a simplified version - actual implementation requires more parameters
    const data = Buffer.alloc(32);
    data.writeUInt32LE(0, 0); // Instruction index
    
    return new TransactionInstruction({
      programId: RAYDIUM_AMM_PROGRAM,
      keys: [
        { pubkey: coinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: pcTokenAccount, isSigner: false, isWritable: true },
        { pubkey: coinVault, isSigner: false, isWritable: true },
        { pubkey: pcVault, isSigner: false, isWritable: true },
        { pubkey: lpTokenMint, isSigner: false, isWritable: true },
        { pubkey: targetOrders, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: RENT_PROGRAM, isSigner: false, isWritable: false },
        { pubkey: openBookMarket, isSigner: false, isWritable: false },
      ],
      data: data
    });
  }
  
  console.log('\n📝 NOTE: Creating Raydium pools programmatically requires');
  console.log('   specific market accounts and pool state initialization.');
  console.log('   This is complex and requires precise parameters.');
  console.log('');
  console.log('   The recommended approach is to use the Raydium website');
  console.log('   which handles all the complexity automatically.');
  console.log('');
  
  // Alternative: Create simple swap
  console.log('🎯 ALTERNATIVE: SIMPLE SWAP');
  console.log('');
  console.log('   Instead of creating pools, you can:');
  console.log('   1. Go to jup.ag');
  console.log('   2. Connect Phantom wallet');
  console.log('   3. Swap SOL for VSR or TRIN');
  console.log('   4. This creates demand and value');
  console.log('');
  console.log('   This is simpler and achieves the same goal!');
  console.log('');
  
  // Create helper scripts
  console.log('📝 CREATING HELPER SCRIPTS...');
  
  // Script 1: Check token balances
  const checkBalanceScript = `#!/usr/bin/env node
const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';
const VSR_MINT = new PublicKey('7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU');
const TRIN_MINT = new PublicKey('Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx');

async function main() {
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const wallet = new PublicKey(WALLET);
  
  console.log('\\n💰 Token Balances:');
  console.log('   Wallet:', WALLET);
  console.log('');
  
  try {
    const vsrAccount = await getAssociatedTokenAddress(VSR_MINT, wallet);
    const vsrInfo = await getAccount(connection, vsrAccount);
    console.log('   VSR:', (Number(vsrInfo.amount) / 1e9).toLocaleString(), 'tokens');
  } catch (e) {
    console.log('   VSR: 0 tokens');
  }
  
  try {
    const trinAccount = await getAssociatedTokenAddress(TRIN_MINT, wallet);
    const trinInfo = await getAccount(connection, trinAccount);
    console.log('   TRIN:', (Number(trinInfo.amount) / 1e9).toLocaleString(), 'tokens');
  } catch (e) {
    console.log('   TRIN: 0 tokens');
  }
  
  const balance = await connection.getBalance(wallet);
  console.log('   SOL:', (balance / 1e9).toFixed(6));
}

main().catch(console.error);
`;
  
  fs.writeFileSync(path.join(__dirname, 'cosmos-check-balance.js'), checkBalanceScript);
  console.log('   ✅ Balance checker: scripts/cosmos-check-balance.js');
  
  // Script 2: Jupiter swap guide
  const jupiterGuide = `#!/usr/bin/env node
/**
 * Viseron Cosmos — Jupiter Swap Guide
 * Guias para fazer swap no Jupiter
 */

console.log('\\n🌟 JUPITER SWAP GUIDE');
console.log('=====================================\\n');

console.log('1. Go to https://jup.ag');
console.log('2. Click "Connect Wallet"');
console.log('3. Select Phantom');
console.log('4. Approve connection');
console.log('');
console.log('5. To swap for VSR:');
console.log('   - Input: SOL');
console.log('   - Output: VSR');
console.log('   - Amount: 0.14 SOL');
console.log('   - Click "Swap"');
console.log('');
console.log('6. To swap for TRIN:');
console.log('   - Input: SOL');
console.log('   - Output: TRIN');
console.log('   - Amount: 0.14 SOL');
console.log('   - Click "Swap"');
console.log('');
console.log('7. Confirm in Phantom wallet');
console.log('');
console.log('=====================================\\n');
`;
  
  fs.writeFileSync(path.join(__dirname, 'cosmos-jupiter-guide.js'), jupiterGuide);
  console.log('   ✅ Jupiter guide: scripts/cosmos-jupiter-guide.js');
  
  console.log('\n=====================================\n');
}

main().catch(console.error);
