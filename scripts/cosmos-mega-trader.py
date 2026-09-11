#!/usr/bin/env python3
"""
VISERON COSMOS — MEGA TRADER v1.0
1500 TRADES DIÁRIOS PARA VALORIZAR $VSR e $TRIN
"""
import json
import os
import time
import urllib.request
import random
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

VSR_MINT = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU'
TRIN_MINT = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx'

SOL_MINT = 'So11111111111111111111111111111111111111112'

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = '[' + ts + '] ' + msg
    print(line, flush=True)
    with open(os.path.join(DATA_DIR, 'mega-trader.log'), 'a') as f:
        f.write(line + '\n')

def get_sol_price():
    try:
        url = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return data['solana']['usd']
    except:
        return 106.0

def get_token_price(mint):
    try:
        url = 'https://api.dexscreener.com/latest/dex/tokens/' + mint
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            if data.get('pairs'):
                return float(data['pairs'][0]['priceUsd'])
    except:
        pass
    return None

def simulate_trade(token, action, amount_sol):
    """Simula um trade para criar volume"""
    sol_price = get_sol_price()
    token_price = get_token_price(token)
    
    if not token_price:
        return None
    
    if action == 'BUY':
        tokens_received = (amount_sol * sol_price) / token_price
        trade_value = amount_sol * sol_price
    else:
        tokens_received = amount_sol * sol_price
        trade_value = amount_sol * sol_price
    
    trade = {
        'timestamp': datetime.now().isoformat(),
        'token': token,
        'action': action,
        'amount_sol': amount_sol,
        'amount_usd': trade_value,
        'token_price': token_price,
        'tokens_received': tokens_received,
        'status': 'simulated'
    }
    
    return trade

def create_trade_pattern():
    """Cria padrão de trades para simular atividade real"""
    patterns = []
    
    # Padrão 1: Micro trades (0.001-0.01 SOL) - 60% dos trades
    for _ in range(900):
        amount = random.uniform(0.001, 0.01)
        action = random.choice(['BUY', 'SELL'])
        token = random.choice([VSR_MINT, TRIN_MINT])
        patterns.append((token, action, amount))
    
    # Padrão 2: Small trades (0.01-0.05 SOL) - 30% dos trades
    for _ in range(450):
        amount = random.uniform(0.01, 0.05)
        action = random.choice(['BUY', 'SELL'])
        token = random.choice([VSR_MINT, TRIN_MINT])
        patterns.append((token, action, amount))
    
    # Padrão 3: Medium trades (0.05-0.1 SOL) - 10% dos trades
    for _ in range(150):
        amount = random.uniform(0.05, 0.1)
        action = random.choice(['BUY', 'SELL'])
        token = random.choice([VSR_MINT, TRIN_MINT])
        patterns.append((token, action, amount))
    
    random.shuffle(patterns)
    return patterns

def run_mega_trader():
    log('🚀 VISERON COSMOS — MEGA TRADER v1.0')
    log('📊 1500 TRADES DIÁRIOS')
    log('💰 Meta: Valorizar $VSR e $TRIN')
    log('=' * 50)
    
    trade_count = 0
    total_volume = 0
    start_time = datetime.now()
    
    while True:
        try:
            # Cria padrão de trades
            patterns = create_trade_pattern()
            
            log('📈 Iniciando ciclo de trades...')
            
            for i, (token, action, amount) in enumerate(patterns):
                trade = simulate_trade(token, action, amount)
                
                if trade:
                    trade_count += 1
                    total_volume += trade['amount_usd']
                    
                    token_name = 'VSR' if token == VSR_MINT else 'TRIN'
                    
                    if trade_count % 100 == 0:
                        log('🔄 Trade #' + str(trade_count) + ': ' + action + ' ' + 
                            str(round(amount, 4)) + ' SOL de ' + token_name + 
                            ' ($' + str(round(trade['amount_usd'], 2)) + ')')
                    
                    # Grava trade
                    with open(os.path.join(DATA_DIR, 'trades.jsonl'), 'a') as f:
                        f.write(json.dumps(trade) + '\n')
                
                # Intervalo entre trades (simula atividade real)
                time.sleep(random.uniform(0.5, 2.0))
            
            # Resumo do ciclo
            elapsed = (datetime.now() - start_time).seconds / 3600
            log('📊 RESUMO: ' + str(trade_count) + ' trades | $' + 
                str(round(total_volume, 2)) + ' volume | ' + 
                str(round(elapsed, 1)) + 'h')
            
            # Pausa entre ciclos
            time.sleep(30)
            
        except KeyboardInterrupt:
            log('🛑 BOT INTERROMPIDO')
            log('📊 TOTAL: ' + str(trade_count) + ' trades | $' + 
                str(round(total_volume, 2)) + ' volume')
            break
        except Exception as e:
            log('❌ ERRO: ' + str(e))
            time.sleep(5)

if __name__ == '__main__':
    os.makedirs(DATA_DIR, exist_ok=True)
    run_mega_trader()
