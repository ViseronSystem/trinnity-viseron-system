#!/usr/bin/env node
/**
 * VISERON COSMOS — MONITOR
 * Monitoriza todos os sistemas em tempo real
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function checkTradingBot() {
  const logFile = path.join(DATA_DIR, 'trading', 'mega-trader.log');
  if (fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    return {
      status: 'active',
      trades: lines.length,
      lastTrade: lines[lines.length - 1]
    };
  }
  return { status: 'inactive', trades: 0 };
}

function checkSocialMedia() {
  const postsFile = path.join(DATA_DIR, 'social', 'posts.json');
  if (fs.existsSync(postsFile)) {
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
    return {
      status: 'active',
      posts: posts.length,
      lastPost: posts[posts.length - 1]
    };
  }
  return { status: 'inactive', posts: 0 };
}

function checkPrice() {
  const trackerFile = path.join(DATA_DIR, 'price-tracker.json');
  if (fs.existsSync(trackerFile)) {
    const tracker = JSON.parse(fs.readFileSync(trackerFile, 'utf8'));
    return {
      status: 'active',
      lastUpdate: tracker.lastUpdate
    };
  }
  return { status: 'inactive' };
}

function printStatus() {
  log('🚀 VISERON COSMOS — SYSTEM STATUS');
  log('=' * 50);
  
  const trading = checkTradingBot();
  const social = checkSocialMedia();
  const price = checkPrice();
  
  log('📊 TRADING BOT: ' + (trading.status === 'active' ? '✅ ACTIVE' : '❌ INACTIVE'));
  log('   Trades: ' + trading.trades);
  
  log('📱 SOCIAL MEDIA: ' + (social.status === 'active' ? '✅ ACTIVE' : '❌ INACTIVE'));
  log('   Posts: ' + social.posts);
  
  log('💰 PRICE TRACKER: ' + (price.status === 'active' ? '✅ ACTIVE' : '❌ INACTIVE'));
  
  log('=' * 50);
  log('🎯 DASHBOARD: http://localhost:32123/cosmos/dashboard');
  log('🌐 LANDING: http://localhost:32123/cosmos');
}

if (require.main === module) {
  printStatus();
}

module.exports = { checkTradingBot, checkSocialMedia, checkPrice };
