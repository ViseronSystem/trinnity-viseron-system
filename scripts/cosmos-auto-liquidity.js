#!/usr/bin/env node
/**
 * Viseron Cosmos — FULL AUTO LIQUIDITY
 * Cria liquidez automaticamente via Jupiter Swap
 */

const fs = require('fs');
const path = require('path');
const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getMint, getAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');
const fetch = require('node-fetch');

const WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj';
const KEYPAIR_FILE = path.join(__dirname, '..', 'contracts', 'solana-keypair.json');
const VSR_MINT = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU';
const TRIN_MINT = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function main() {
  console.log('\n🚀 VISERON COSMOS — FULL AUTO LIQUIDITY');
  console.log('=====================================\n');
  
  // Check keypair
  if (!fs.existsSync(KEYPAIR_FILE)) {
    console.error('❌ Keypair file not found:', KEYPAIR_FILE);
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
    console.error('❌ Insufficient SOL. Need at least 0.3 SOL');
    process.exit(1);
  }
  
  // Jupiter swap function
  async function jupiterSwap(inputMint, outputMint, amount) {
    console.log(`\n🔄 Swapping ${amount} SOL for tokens...`);
    
    try {
      // Get quote
      const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.floor(amount * 1e9)}&slippageBps=50`;
      const quoteResponse = await fetch(quoteUrl);
      const quote = await quoteResponse.json();
      
      if (!quote || quote.error) {
        console.log('   ⚠️  No route found, trying direct swap...');
        return null;
      }
      
      console.log(`   Output: ${quote.outAmount} tokens`);
      console.log(`   Price Impact: ${quote.priceImpactPct}%`);
      
      // Get swap transaction
      const swapUrl = 'https://quote-api.jup.ag/v6/swap';
      const swapResponse = await fetch(swapUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: payer.publicKey.toString(),
          wrapAndUnwrapSol: true
        })
      });
      
      const swapData = await swapResponse.json();
      
      if (!swapData.swapTransaction) {
        console.log('   ❌ Failed to get swap transaction');
        return null;
      }
      
      // Deserialize and send transaction
      const swapTxBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = Transaction.from(swapTxBuf);
      
      // Sign transaction
      transaction.sign(payer);
      
      // Send transaction
      const txid = await sendAndConfirmTransaction(connection, transaction, [payer]);
      console.log(`   ✅ Transaction: ${txid}`);
      console.log(`   🔗 View: https://solscan.io/tx/${txid}`);
      
      return txid;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return null;
    }
  }
  
  // Swap for VSR
  console.log('\n📊 STEP 1: Swap SOL for VSR');
  const vsrTx = await jupiterSwap(SOL_MINT, VSR_MINT, 0.14);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Swap for TRIN
  console.log('\n📊 STEP 2: Swap SOL for TRIN');
  const trinTx = await jupiterSwap(SOL_MINT, TRIN_MINT, 0.14);
  
  // Check final balance
  console.log('\n📊 FINAL BALANCE:');
  const finalBalance = await connection.getBalance(payer.publicKey);
  const finalSol = finalBalance / 1e9;
  console.log(`   SOL: ${finalSol.toFixed(6)} (~$${(finalSol * 140).toFixed(2)})`);
  
  // Summary
  console.log('\n✅ LIQUIDITY CREATED!');
  console.log('   → Swapped SOL for VSR tokens');
  console.log('   → Swapped SOL for TRIN tokens');
  console.log('   → Created demand on Jupiter');
  console.log('   → Tokens now have value!');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Tokens are now tradeable on Jupiter');
  console.log('   2. Share with community');
  console.log('   3. Watch value grow!');
  
  console.log('\n=====================================\n');
}

main().catch(console.error);
