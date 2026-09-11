#!/usr/bin/env python3
"""
TVS VISERON — SCALPING BOT v4.0
Lucro rapido com risco controlado
Meta: +5-15% por trade, proteger capital
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
}

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = '[' + ts + '] ' + msg
    print(line, flush=True)
    with open(os.path.join(DATA_DIR, 'scalp.log'), 'a') as f:
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
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def calc_ema(closes, period):
    k = 2 / (period + 1)
    ema = closes[-1]
    for c in reversed(closes[:-1]):
        ema = c * k + ema * (1 - k)
    return ema

def analyze(symbol):
    candles5m = get_candles(symbol, '5m', 50)
    candles15m = get_candles(symbol, '15m', 50)
    
    if len(candles5m) < 30 or len(candles15m) < 30:
        return None
    
    closes5 = [float(c[4]) for c in candles5m]
    closes15 = [float(c[4]) for c in candles15m]
    highs5 = [float(c[2]) for c in candles5m]
    lows5 = [float(c[3]) for c in candles5m]
    
    rsi5 = calc_rsi(closes5)
    rsi15 = calc_rsi(closes15)
    ema5 = calc_ema(closes5, 5)
    ema10 = calc_ema(closes5, 10)
    ema20 = calc_ema(closes5, 20)
    
    current = closes5[0]
    prev = closes5[1]
    
    # Deteccao de dip (compra)
    drop_5m = (current - closes5[4]) / closes5[4] * 100 if len(closes5) > 4 else 0
    drop_15m = (current - closes15[4]) / closes15[4] * 100 if len(closes15) > 4 else 0
    
    # Suporte
    support = min(lows5[:10])
    resistance = max(highs5[:10])
    
    # Distancia ao suporte
    dist_support = (current - support) / current * 100
    
    score = 0
    reasons = []
    
    # COMPRA: RSI baixo + dip + perto de suporte
    if rsi5 < 25 and dist_support < 2:
        score = 95
        reasons = ['RSI EXTREMO + perto de suporte']
    elif rsi5 < 30 and rsi15 < 35 and drop_5m < -1:
        score = 85
        reasons = ['RSI oversold + dip recente']
    elif rsi5 < 35 and ema5 > ema10 and drop_15m < -2:
        score = 75
        reasons = ['RSI baixo + EMA cross + dip 15m']
    elif rsi5 < 40 and current < ema20 and dist_support < 1.5:
        score = 70
        reasons = ['Abaixo de EMA20 + perto de suporte']
    
    # VENDA: RSI alto + perto de resistencia
    elif rsi5 > 75 and (current - resistance) / resistance * 100 > -1:
        score = -80
        reasons = ['RSI overbought + perto de resistencia']
    elif rsi5 > 70 and rsi15 > 65 and drop_5m > 2:
        score = -70
        reasons = ['RSI alto + momentum negativo']
    
    if score == 0:
        return None
    
    action = 'BUY' if score > 0 else 'SELL'
    confidence = abs(score)
    
    return {
        'symbol': symbol,
        'action': action,
        'confidence': confidence,
        'price': current,
        'rsi5': rsi5,
        'rsi15': rsi15,
        'ema5': ema5,
        'ema10': ema10,
        'ema20': ema20,
        'support': support,
        'resistance': resistance,
        'dist_support': dist_support,
        'drop_5m': drop_5m,
        'drop_15m': drop_15m,
        'reasons': reasons,
    }

def format_signal(s):
    if s['action'] == 'BUY':
        header = '>>> COMPRA RAPIDA <<<'
        entry = s['price']
        sl = entry * 0.97  # -3% SL
        tp = entry * 1.08  # +8% TP
    else:
        header = '>>> VENDA RAPIDA <<<'
        entry = s['price']
        sl = entry * 1.03
        tp = entry * 0.92
    
    risk = abs(entry - sl) / entry * 100
    reward = abs(tp - entry) / entry * 100
    
    lines = [
        '',
        '=' * 50,
        header + ' ' + s['symbol'] + ' (' + str(s['confidence']) + '%)',
        '=' * 50,
        '',
        'PRECO: $' + str(round(entry, 4)),
        'RSI 5m: ' + str(round(s['rsi5'], 1)) + ' | RSI 15m: ' + str(round(s['rsi15'], 1)),
        'EMA5: $' + str(round(s['ema5'], 4)) + ' | EMA20: $' + str(round(s['ema20'], 4)),
        'Suporte: $' + str(round(s['support'], 4)) + ' | Dist: ' + str(round(s['dist_support'], 1)) + '%',
        'Drop 5m: ' + str(round(s['drop_5m'], 1)) + '% | Drop 15m: ' + str(round(s['drop_15m'], 1)) + '%',
        '',
        'MOTIVOS: ' + ', '.join(s['reasons']),
        '',
        '--- PLANO ---',
        'ENTRY: $' + str(round(entry, 4)),
        'STOP LOSS: $' + str(round(sl, 4)) + ' (-' + str(round(risk, 1)) + '%)',
        'TAKE PROFIT: $' + str(round(tp, 4)) + ' (+' + str(round(reward, 1)) + '%)',
        'RISK/REWARD: 1:' + str(round(reward/risk, 1)),
        '',
        'LINK: https://jup.ag/swap/SOL-' + TOKENS.get(s['symbol'], ''),
        '=' * 50,
    ]
    
    return '\n'.join(lines)

def monitor():
    log('SCALPING BOT v4.0 INICIADO')
    log('Intervalo: 30s | Min confidence: 70%')
    
    seen = {}
    
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
                key = s['symbol'] + '_' + s['action'] + '_' + datetime.now().strftime('%Y%m%d%H%M')
                if key not in seen:
                    seen[key] = time.time()
                    print(format_signal(s))
                    
                    with open(os.path.join(DATA_DIR, 'scalp-signals.json'), 'w') as f:
                        json.dump(all_signals, f, indent=2)
            
            log('Check: ' + str(len(all_signals)) + ' sinais')
            time.sleep(30)
            
        except KeyboardInterrupt:
            log('BOT INTERROMPIDO')
            break
        except Exception as e:
            log('ERRO: ' + str(e))
            time.sleep(5)

if __name__ == '__main__':
    monitor()
