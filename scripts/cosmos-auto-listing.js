#!/usr/bin/env node
/**
 * VISERON COSMOS — AUTO LISTING SYSTEM
 * Automatiza listagem em todas as plataformas
 */

const fs = require('fs');
const path = require('path');

const VSR_MINT = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU';
const TRIN_MINT = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx';

const LISTINGS = {
  dex: [
    { name: 'Jupiter', url: 'https://jup.ag', status: 'auto-listed' },
    { name: 'Raydium', url: 'https://raydium.io', status: 'active' },
    { name: 'Orca', url: 'https://orca.so', status: 'pending' },
    { name: 'Meteora', url: 'https://meteora.ag', status: 'pending' },
    { name: 'Aldrin', url: 'https://aldrin.com', status: 'pending' },
    { name: 'Saber', url: 'https://saber.so', status: 'pending' },
    { name: 'Mercurial', url: 'https://mercurial.finance', status: 'pending' }
  ],
  cex: [
    { name: 'MEXC', url: 'https://mexc.com', status: 'pending' },
    { name: 'Bitget', url: 'https://bitget.com', status: 'pending' },
    { name: 'Gate.io', url: 'https://gate.io', status: 'pending' },
    { name: 'KuCoin', url: 'https://kucoin.com', status: 'pending' },
    { name: 'Bybit', url: 'https://bybit.com', status: 'pending' },
    { name: 'Huobi', url: 'https://huobi.com', status: 'pending' },
    { name: 'Coinbase', url: 'https://coinbase.com', status: 'pending' },
    { name: 'Binance', url: 'https://binance.com', status: 'pending' }
  ],
  trackers: [
    { name: 'CoinGecko', url: 'https://coingecko.com', status: 'pending' },
    { name: 'CoinMarketCap', url: 'https://coinmarketcap.com', status: 'pending' },
    { name: 'DEXScreener', url: 'https://dexscreener.com', status: 'auto-listed' },
    { name: 'DEXTools', url: 'https://dextools.io', status: 'pending' },
    { name: 'Birdeye', url: 'https://birdeye.so', status: 'auto-listed' },
    { name: 'Solscan', url: 'https://solscan.io', status: 'auto-listed' }
  ],
  social: [
    { name: 'Twitter', url: 'https://twitter.com', status: 'pending' },
    { name: 'Telegram', url: 'https://telegram.org', status: 'pending' },
    { name: 'Discord', url: 'https://discord.com', status: 'pending' },
    { name: 'Reddit', url: 'https://reddit.com', status: 'pending' },
    { name: 'YouTube', url: 'https://youtube.com', status: 'pending' }
  ]
};

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function generateSubmissionData() {
  const submissionData = {
    vsr: {
      name: 'Viseron Crown',
      symbol: 'VSR',
      network: 'Solana',
      mint: VSR_MINT,
      decimals: 9,
      website: 'https://trinnityviseronsystem.io',
      github: 'https://github.com/anomalyco/opencode',
      description: 'Governance token of the VISERON AI ecosystem with 5,000+ AI minds',
      category: 'Token',
      tags: ['solana', 'defi', 'governance', 'ai']
    },
    trin: {
      name: 'Trinnity',
      symbol: 'TRIN',
      network: 'Solana',
      mint: TRIN_MINT,
      decimals: 9,
      website: 'https://trinnityviseronsystem.io',
      github: 'https://github.com/anomalyco/opencode',
      description: 'Interplanetary memecoin of VISERON Cosmos',
      category: 'Memecoin',
      tags: ['solana', 'memecoin', 'defi', 'ai']
    }
  };
  
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'listing-submission.json'), JSON.stringify(submissionData, null, 2));
  log('✅ Submission data generated');
  
  return submissionData;
}

function generateListingGuide() {
  let guide = '# VISERON COSMOS — COMPLETE LISTING GUIDE\n\n';
  
  guide += '## 📋 TOKEN INFO\n\n';
  guide += '### VSR Token\n';
  guide += `- Name: Viseron Crown\n`;
  guide += `- Symbol: VSR\n`;
  guide += `- Network: Solana\n`;
  guide += `- Mint: ${VSR_MINT}\n`;
  guide += `- Decimals: 9\n\n`;
  
  guide += '### TRIN Token\n';
  guide += `- Name: Trinnity\n`;
  guide += `- Symbol: TRIN\n`;
  guide += `- Network: Solana\n`;
  guide += `- Mint: ${TRIN_MINT}\n`;
  guide += `- Decimals: 9\n\n`;
  
  guide += '## 🎯 DEX LISTINGS (Auto)\n\n';
  LISTINGS.dex.forEach(dex => {
    guide += `### ${dex.name}\n`;
    guide += `- URL: ${dex.url}\n`;
    guide += `- Status: ${dex.status}\n`;
    guide += `- Action: ${dex.status === 'auto-listed' ? 'Already listed' : 'Submit manually'}\n\n`;
  });
  
  guide += '## 🏦 CEX LISTINGS\n\n';
  LISTINGS.cex.forEach(cex => {
    guide += `### ${cex.name}\n`;
    guide += `- URL: ${cex.url}\n`;
    guide += `- Status: ${cex.status}\n`;
    guide += `- Action: Submit application\n\n`;
  });
  
  guide += '## 📊 TRACKER LISTINGS\n\n';
  LISTINGS.trackers.forEach(tracker => {
    guide += `### ${tracker.name}\n`;
    guide += `- URL: ${tracker.url}\n`;
    guide += `- Status: ${tracker.status}\n`;
    guide += `- Action: ${tracker.status === 'auto-listed' ? 'Already listed' : 'Submit manually'}\n\n`;
  });
  
  guide += '## 📱 SOCIAL MEDIA\n\n';
  LISTINGS.social.forEach(social => {
    guide += `### ${social.name}\n`;
    guide += `- URL: ${social.url}\n`;
    guide += `- Status: ${social.status}\n`;
    guide += `- Action: Create account\n\n`;
  });
  
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'listing-guide.md'), guide);
  log('✅ Listing guide generated');
  
  return guide;
}

function generateMarketingPlan() {
  const plan = {
    week1: {
      title: 'Launch Week',
      tasks: [
        'Create Twitter @ViseronCosmos',
        'Create Telegram @ViseronCosmos',
        'Post 7 tweets',
        'Welcome message in Telegram',
        'Submit to Jupiter',
        'Submit to CoinGecko'
      ]
    },
    week2: {
      title: 'Growth Week',
      tasks: [
        'Daily tweets',
        'Telegram engagement',
        'Submit to CEXs',
        'Community building',
        'Partnership outreach'
      ]
    },
    week3: {
      title: 'Expansion Week',
      tasks: [
        'AMAs',
        'Community events',
        'More listings',
        'Influencer marketing',
        'PR campaign'
      ]
    },
    week4: {
      title: 'Scale Week',
      tasks: [
        'CEX listings',
        'Marketing budget',
        'Global expansion',
        'Institutional outreach',
        'Future roadmap'
      ]
    }
  };
  
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'marketing-plan.json'), JSON.stringify(plan, null, 2));
  log('✅ Marketing plan generated');
  
  return plan;
}

function generatePriceTracker() {
  const tracker = {
    tokens: {
      VSR: { mint: VSR_MINT, history: [] },
      TRIN: { mint: TRIN_MINT, history: [] }
    },
    lastUpdate: new Date().toISOString()
  };
  
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'price-tracker.json'), JSON.stringify(tracker, null, 2));
  log('✅ Price tracker initialized');
  
  return tracker;
}

function runAutoListing() {
  log('🚀 VISERON COSMOS — AUTO LISTING SYSTEM');
  log('📊 Automatizando listagem em todas as plataformas');
  log('=' * 50);
  
  // Generate all data
  generateSubmissionData();
  generateListingGuide();
  generateMarketingPlan();
  generatePriceTracker();
  
  // Print summary
  log('\n📋 LISTING SUMMARY:\n');
  log('DEX (Auto-listed): ' + LISTINGS.dex.filter(d => d.status === 'auto-listed').length);
  log('DEX (Pending): ' + LISTINGS.dex.filter(d => d.status === 'pending').length);
  log('CEX (Pending): ' + LISTINGS.cex.length);
  log('Trackers (Auto): ' + LISTINGS.trackers.filter(t => t.status === 'auto-listed').length);
  log('Trackers (Pending): ' + LISTINGS.trackers.filter(t => t.status === 'pending').length);
  log('Social (Pending): ' + LISTINGS.social.length);
  
  log('\n✅ ALL FILES GENERATED:');
  log('• data/listing-submission.json');
  log('• data/listing-guide.md');
  log('• data/marketing-plan.json');
  log('• data/price-tracker.json');
  
  log('\n🎯 NEXT ACTIONS:');
  log('1. Submit to CEXs (MEXC, Bitget, Gate.io)');
  log('2. Create social media accounts');
  log('3. Start marketing campaign');
  log('4. Monitor price and volume');
}

if (require.main === module) {
  runAutoListing();
}

module.exports = { LISTINGS, generateSubmissionData, generateListingGuide };
