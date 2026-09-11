#!/usr/bin/env python3
"""
TVS VISERON — MEGA SCALPER v5.0
500 VEZES NO MERCADO
Lucro em cada margem, trade a trade
Meta: +2-5% por trade, compor lucro
"""
import json
import os
import time
import urllib.request
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

TOKENS = {
    'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    'TRUMP': '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    'PENGU': '2zMMhcVQ6D1SEjWrD6gRmjNDRkF1eFLcckage7NkVLry',
}

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = '[' + ts + '] ' + msg
    print(line, flush=True)
    with open(os.path.join(DATA_DIR, 'mega-scalp.log'), 'a') as f:
        f.write(line + '\n')

def get_price(symbol):
    try:
        url = 'https://www.okx.com/api/v5/market/ticker?instId=' + symbol + '-USDT'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            d = data['data'][0]
            return float(d['last']), float(d['high24h']), float(d['low24h'])
    except:
        return None, None, None

def get_candles(symbol, bar='5m', limit=50):
    try:
        url = 'https://www.okx.com/api/v5/market/candles?instId=' + symbol + '-USDT&bar=' + bar + '&limit=' + str(limit)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return data['data']
    except:
        return []

def calc_rsi(closes, period=14):
    gains = []
    losses = []
    for i in range(period):
        diff = closes[i] - closes[i+1]
        if diff > 0:
            gains.append(diff)
        else:
            losses.append(abs(diff))
    avg_gain = sum(gains) / period if gains else 0
    avg_loss = sum(losses) / period if losses else 0.001
    return 100 - (100 / (1 + avg_gain / avg_loss))

def calc_ema(closes, period):
    k = 2 / (period + 1)
    ema = closes[-1]
    for c in reversed(closes[:-1]):
        ema = c * k + ema * (1 - k)
    return ema

def calc_macd(closes):
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    return ema12 - ema26

def analyze(symbol):
    """Analise rapida para scalping"""
    candles = get_candles(symbol, '5m', 50)
    if len(candles) < 30:
        return None
    
    closes = [float(c[4]) for c in candles]
    highs = [float(c[2]) for c in candles]
    lows = [float(c[3]) for c in candles]
    
    rsi = calc_rsi(closes)
    rsi_prev = calc_rsi(closes[1:])
    ema5 = calc_ema(closes, 5)
    ema10 = calc_ema(closes, 10)
    ema20 = calc_ema(closes, 20)
    macd = calc_macd(closes)
    
    current = closes[0]
    prev = closes[1]
    change_5m = (current - prev) / prev * 100
    
    # Suporte/Resistencia
    support = min(lows[:10])
    resistance = max(highs[:10])
    dist_support = (current - support) / current * 100
    dist_resist = (resistance - current) / current * 100
    
    score = 0
    reasons = []
    
    # COMPRA: RSI baixo + bounce de suporte
    if rsi < 25 and dist_support < 1:
        score = 95
        reasons = ['RSI EXTREMO + SUFORTE']
    elif rsi < 30 and change_5m > 0.5 and dist_support < 2:
        score = 85
        reasons = ['RSI baixo + BOUNCE']
    elif rsi < 35 and ema5 > ema10 and macd > 0:
        score = 75
        reasons = ['RSI baixo + EMA CROSS']
    elif rsi < 40 and current < ema20 and dist_support < 1.5:
        score = 70
        reasons = ['ABAIXO EMA20 + SUFORTE']
    
    # VENDA: RSI alto + perto resistencia
    elif rsi > 75 and dist_resist < 1:
        score = -90
        reasons = ['RSI EXTREMO + RESISTENCIA']
    elif rsi > 70 and change_5m < -0.5 and dist_resist < 2:
        score = -80
        reasons = ['RSI alto + REJEICAO']
    elif rsi > 65 and ema5 < ema10 and macd < 0:
        score = -70
        reasons = ['RSI alto + EMA CROSS DOWN']
    
    if score == 0:
        return None
    
    action = 'BUY' if score > 0 else 'SELL'
    
    return {
        'symbol': symbol,
        'action': action,
        'confidence': abs(score),
        'price': current,
        'rsi': rsi,
        'ema5': ema5,
        'ema10': ema10,
        'ema20': ema20,
        'macd': macd,
        'support': support,
        'resistance': resistance,
        'dist_support': dist_support,
        'dist_resist': dist_resist,
        'change_5m': change_5m,
        'reasons': reasons,
    }

def format_scalp(s):
    if s['action'] == 'BUY':
        header = '>>> SCALP COMPRA <<<'
        entry = s['price']
        sl = entry * 0.98  # -2% SL (apertado)
        tp = entry * 1.03  # +3% TP (rapido)
        risk = 2
        reward = 3
    else:
        header = '>>> SCALP VENDA <<<'
        entry = s['price']
        sl = entry * 1.02
        tp = entry * 0.97
        risk = 2
        reward = 3
    
    lines = [
        '',
        '#' * 50,
        header + ' ' + s['symbol'] + ' (' + str(s['confidence']) + '%)',
        '#' * 50,
        '',
        'PRECO: $' + str(round(entry, 4)),
        'RSI: ' + str(round(s['rsi'], 1)),
        'EMA5: $' + str(round(s['ema5'], 4)),
        'MACD: ' + str(round(s['macd'], 6)),
        'Suporte: $' + str(round(s['support'], 4)) + ' (' + str(round(s['dist_support'], 1)) + '%)',
        'Resistencia: $' + str(round(s['resistance'], 4)) + ' (' + str(round(s['dist_resist'], 1)) + '%)',
        'Momentum 5m: ' + str(round(s['change_5m'], 2)) + '%',
        '',
        'MOTIVOS: ' + ', '.join(s['reasons']),
        '',
        '--- PLANO SCALP ---',
        'ENTRY: $' + str(round(entry, 4)),
        'STOP LOSS: $' + str(round(sl, 4)) + ' (-' + str(risk) + '%)',
        'TAKE PROFIT: $' + str(round(tp, 4)) + ' (+' + str(reward) + '%)',
        'RISK/REWARD: 1:' + str(round(reward/risk, 1)),
        '',
        'LINK: https://jup.ag/swap/SOL-' + TOKENS.get(s['symbol'], ''),
        '#' * 50,
    ]
    
    return '\n'.join(lines)

def monitor():
    log('MEGA SCALPER v5.0 INICIADO')
    log('500 VEZES NO MERCADO')
    log('Intervalo: 15s | Meta: +3% por trade')
    
    seen = {}
    trade_count = 0
    
    while True:
        try:
            all_signals = []
            
            for symbol in TOKENS.keys():
                try:
                    s = analyze(symbol)
                    if s and s['confidence'] >= 70:
                        all_signals.append(s)
                except:
                    pass
            
            all_signals.sort(key=lambda x: x['confidence'], reverse=True)
            
            for s in all_signals:
                key = s['symbol'] + '_' + s['action'] + '_' + datetime.now().strftime('%Y%m%d%H%M%S')
                if key not in seen:
                    seen[key] = time.time()
                    trade_count += 1
                    print(format_scalp(s))
                    
                    with open(os.path.join(DATA_DIR, 'scalp-signals.json'), 'w') as f:
                        json.dump(all_signals, f, indent=2)
            
            log('TRADES: ' + str(trade_count) + ' | Sinais: ' + str(len(all_signals)))
            time.sleep(15)
            
        except KeyboardInterrupt:
            log('BOT INTERROMPIDO')
            break
        except Exception as e:
            log('ERRO: ' + str(e))
            time.sleep(3)

if __name__ == '__main__':
    monitor()
