#!/usr/bin/env python3
"""
VISERON COSMOS — TRADING BOT v3.0
Uses DexScreener API for price data
"""
import json
import os
import time
import urllib.request
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'

VSR_MINT = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU'
TRIN_MINT = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx'
SOL_MINT = 'So11111111111111111111111111111111111111112'

WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = '[' + ts + '] ' + msg
    print(line, flush=True)
    with open(os.path.join(DATA_DIR, 'trading-bot.log'), 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def get_token_data(mint):
    """Get token data from DexScreener"""
    try:
        url = f'https://api.dexscreener.com/latest/dex/tokens/{mint}'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data.get('pairs'):
                return data['pairs'][0]
    except Exception as e:
        log('Error getting data for ' + mint + ': ' + str(e))
    return None

def analyze_opportunity():
    """Analyze trading opportunity"""
    vsr_data = get_token_data(VSR_MINT)
    trin_data = get_token_data(TRIN_MINT)
    
    analysis = {
        'timestamp': datetime.now().isoformat(),
        'vsr': None,
        'trin': None,
        'recommendation': None
    }
    
    if vsr_data:
        analysis['vsr'] = {
            'price': float(vsr_data.get('priceUsd', 0)),
            'volume_24h': float(vsr_data.get('volume', {}).get('h24', 0)),
            'liquidity': float(vsr_data.get('liquidity', {}).get('usd', 0)),
            'change_24h': float(vsr_data.get('priceChange', {}).get('h24', 0))
        }
    
    if trin_data:
        analysis['trin'] = {
            'price': float(trin_data.get('priceUsd', 0)),
            'volume_24h': float(trin_data.get('volume', {}).get('h24', 0)),
            'liquidity': float(trin_data.get('liquidity', {}).get('usd', 0)),
            'change_24h': float(trin_data.get('priceChange', {}).get('h24', 0))
        }
    
    # Determine recommendation
    if analysis['vsr'] and analysis['trin']:
        vsr_vol = analysis['vsr']['volume_24h']
        trin_vol = analysis['trin']['volume_24h']
        
        if vsr_vol > trin_vol:
            analysis['recommendation'] = 'BUY_VSR'
        else:
            analysis['recommendation'] = 'BUY_TRIN'
    
    return analysis

def simulate_trade(token, action, amount_sol):
    """Simulate a trade for tracking"""
    data = get_token_data(token)
    if not data:
        return None
    
    price = float(data.get('priceUsd', 0))
    sol_price = 105.0  # Approximate
    
    trade = {
        'timestamp': datetime.now().isoformat(),
        'token': token,
        'action': action,
        'amount_sol': amount_sol,
        'amount_usd': amount_sol * sol_price,
        'token_price': price,
        'status': 'simulated'
    }
    
    return trade

def run_trading_bot():
    log('=== VISERON COSMOS TRADING BOT v3.0 ===')
    log('Wallet: ' + WALLET)
    log('Tokens: VSR, TRIN')
    log('=' * 50)
    
    trade_count = 0
    total_volume = 0
    start_time = datetime.now()
    
    while True:
        try:
            # Analyze opportunity
            analysis = analyze_opportunity()
            
            if analysis['vsr']:
                log('VSR: $' + str(analysis['vsr']['price']) + 
                    ' | Vol: $' + str(analysis['vsr']['volume_24h']) +
                    ' | Liq: $' + str(analysis['vsr']['liquidity']))
            
            if analysis['trin']:
                log('TRIN: $' + str(analysis['trin']['price']) + 
                    ' | Vol: $' + str(analysis['trin']['volume_24h']) +
                    ' | Liq: $' + str(analysis['trin']['liquidity']))
            
            # Simulate trades
            for i in range(10):  # 10 trades per cycle
                amount = 0.001 + (i * 0.001)  # Increasing amounts
                token = VSR_MINT if i % 2 == 0 else TRIN_MINT
                action = 'BUY' if i % 3 != 0 else 'SELL'
                
                trade = simulate_trade(token, action, amount)
                if trade:
                    trade_count += 1
                    total_volume += trade['amount_usd']
                    
                    # Save trade
                    with open(os.path.join(DATA_DIR, 'simulated-trades.jsonl'), 'a', encoding='utf-8') as f:
                        f.write(json.dumps(trade) + '\n')
            
            # Log status
            elapsed = (datetime.now() - start_time).seconds / 3600
            log('Trades: ' + str(trade_count) + ' | Volume: $' + 
                str(round(total_volume, 2)) + ' | Hours: ' + str(round(elapsed, 1)))
            
            time.sleep(60)  # Wait 1 minute between cycles
            
        except KeyboardInterrupt:
            log('Bot stopped by user')
            break
        except Exception as e:
            log('Error: ' + str(e))
            time.sleep(10)

if __name__ == '__main__':
    os.makedirs(DATA_DIR, exist_ok=True)
    run_trading_bot()
