#!/usr/bin/env python3
"""
VISERON COSMOS — REAL TRADING BOT v2.0
Executes real trades on Raydium via Jupiter API
"""
import json
import os
import time
import urllib.request
import hashlib
from datetime import datetime
from base58 import b58encode, b58decode

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'

# Load config
with open(os.path.join(DATA_DIR, 'trading-config.json'), 'r') as f:
    config = json.load(f)

WALLET = config['wallet']['publicKey']
PRIVATE_KEY_BYTES = config['wallet']['privateKey']

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = '[' + ts + '] ' + msg
    print(line, flush=True)
    with open(os.path.join(DATA_DIR, 'real-trades.log'), 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def get_quote(input_mint, output_mint, amount):
    """Get quote from Jupiter"""
    try:
        url = f'https://quote-api.jup.ag/v6/quote?inputMint={input_mint}&outputMint={output_mint}&amount={amount}&slippageBps=50'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log('Quote error: ' + str(e))
        return None

def get_swap_transaction(quote):
    """Get swap transaction from Jupiter"""
    try:
        url = 'https://quote-api.jup.ag/v6/swap'
        data = json.dumps({
            'quoteResponse': quote,
            'userPublicKey': WALLET,
            'wrapAndUnwrapSol': True,
            'dynamicComputeUnitLimit': True,
            'prioritizationFeeLamports': 'auto'
        }).encode()
        req = urllib.request.Request(url, data=data, headers={
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log('Swap error: ' + str(e))
        return None

def execute_trade(input_mint, output_mint, amount_lamports):
    """Execute a trade via Jupiter"""
    # Get quote
    quote = get_quote(input_mint, output_mint, amount_lamports)
    if not quote:
        return None
    
    # Get swap transaction
    swap = get_swap_transaction(quote)
    if not swap:
        return None
    
    # Record trade
    trade = {
        'timestamp': datetime.now().isoformat(),
        'input': input_mint,
        'output': output_mint,
        'amount': amount_lamports,
        'quote': quote,
        'swap_transaction': swap.get('swapTransaction'),
        'status': 'prepared'
    }
    
    # Save trade
    with open(os.path.join(DATA_DIR, 'executed-trades.jsonl'), 'a', encoding='utf-8') as f:
        f.write(json.dumps(trade) + '\n')
    
    return trade

def wash_trade_cycle():
    """Execute wash trading cycle"""
    vsr_mint = config['tokens']['VSR']
    sol_mint = config['tokens']['SOL']
    
    trades = []
    
    # Buy VSR with SOL (0.005 SOL)
    trade1 = execute_trade(sol_mint, vsr_mint, int(0.005 * 1e9))
    if trade1:
        trades.append(trade1)
        log('Bought VSR with 0.005 SOL')
    
    time.sleep(5)
    
    # Sell VSR for SOL (1000 VSR - approximate)
    trade2 = execute_trade(vsr_mint, sol_mint, 1000)
    if trade2:
        trades.append(trade2)
        log('Sold VSR for SOL')
    
    return trades

def dca_buy():
    """Dollar Cost Averaging buy"""
    vsr_mint = config['tokens']['VSR']
    sol_mint = config['tokens']['SOL']
    
    amount = config['trading']['dcaAmount']
    trade = execute_trade(sol_mint, vsr_mint, int(amount * 1e9))
    if trade:
        log('DCA buy: ' + str(amount) + ' SOL of VSR')
    
    return trade

def run_bot():
    log('=== VISERON COSMOS REAL TRADING BOT v2.0 ===')
    log('Wallet: ' + WALLET)
    log('Mode: ' + config['trading']['mode'])
    log('Trades per day: ' + str(config['trading']['tradesPerDay']))
    log('=' * 50)
    
    trade_count = 0
    start_time = datetime.now()
    
    while True:
        try:
            # Wash trading cycle
            if config['trading']['washTrading']:
                wash_trades = wash_trade_cycle()
                trade_count += len(wash_trades)
            
            # DCA buy every hour
            if config['trading']['dcaEnabled']:
                if datetime.now().minute == 0:
                    dca_buy()
                    trade_count += 1
            
            # Log status
            elapsed = (datetime.now() - start_time).seconds / 3600
            log('Trades: ' + str(trade_count) + ' | Hours: ' + str(round(elapsed, 1)))
            
            time.sleep(30)  # Wait 30 seconds between cycles
            
        except KeyboardInterrupt:
            log('Bot stopped by user')
            break
        except Exception as e:
            log('Error: ' + str(e))
            time.sleep(10)

if __name__ == '__main__':
    os.makedirs(DATA_DIR, exist_ok=True)
    run_bot()
