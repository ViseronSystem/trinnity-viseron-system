#!/usr/bin/env python3
"""
TVS VISERON — TRADER SUPREMO v3.0
O MELHOR TRADER DO MUNDO
500 anos de experiencia em algoritmo
Meta: LUCRO MAXIMO com capital disponivel
"""
import json
import os
import time
import urllib.request
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

TOKENS = {
    'SOL': 'So11111111111111111111111111111111111111112',
    'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    'TRUMP': '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    'PENGU': '2zMMhcVQ6D1SEjWrD6gRmjNDRkF1eFLcckage7NkVLry',
    'POPCAT': '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    'MOG': '7kgj4vE4F2pgVkZ3vLgDvN3U1GPXRAbJQcK9aN3JxDVP',
    'FARTCOIN': '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
}

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    with open(os.path.join(DATA_DIR, 'supreme.log'), 'a') as f:
        f.write(line + '\n')

def get_price(symbol):
    try:
        url = f'https://www.okx.com/api/v5/market/ticker?instId={symbol}-USDT'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            d = data['data'][0]
            return {
                'last': float(d['last']),
                'high24h': float(d['high24h']),
                'low24h': float(d['low24h']),
                'vol24h': float(d['vol24h']),
                'open24h': float(d['sodUtc8']),
            }
    except:
        return None

def get_candles(symbol, bar='5m', limit=100):
    try:
        url = f'https://www.okx.com/api/v5/market/candles?instId={symbol}-USDT&bar={bar}&limit={limit}'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return data['data']
    except:
        return []

def calc_ema(closes, period):
    k = 2 / (period + 1)
    ema = closes[-1]
    for c in reversed(closes[:-1]):
        ema = c * k + ema * (1 - k)
    return ema

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

def calc_macd(closes):
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    macd = ema12 - ema26
    return macd

def calc_stochastic(highs, lows, closes, period=14):
    lowest = min(lows[:period])
    highest = max(highs[:period])
    if highest == lowest:
        return 50
    return (closes[0] - lowest) / (highest - lowest) * 100

def calc_bollinger(closes, period=20):
    sma = sum(closes[:period]) / period
    std = (sum((c - sma) ** 2 for c in closes[:period]) / period) ** 0.5
    return sma + 2 * std, sma, sma - 2 * std

def calc_volume_pressure(candles):
    """Pressao de volume: compra vs venda"""
    buys = 0
    sells = 0
    for c in candles[:20]:
        o = float(c[1])
        c_price = float(c[4])
        v = float(c[5])
        if c_price > o:
            buys += v
        else:
            sells += v
    total = buys + sells
    if total == 0:
        return 0.5
    return buys / total

def calc_momentum(closes, period=10):
    """Momentum: forca da tendencia"""
    if len(closes) < period:
        return 0
    return (closes[0] - closes[period]) / closes[period] * 100

def calc_volatility(closes, period=20):
    """Volatilidade: para Identify breakouts"""
    if len(closes) < period:
        return 0
    returns = [(closes[i] - closes[i+1]) / closes[i+1] for i in range(period-1)]
    return (sum(r**2 for r in returns) / len(returns)) ** 0.5

def supreme_analysis(symbol):
    """Analise SUPREMA: 500 anos de experiencia"""
    
    # Multi-timeframe
    timeframes = {
        '5m': get_candles(symbol, '5m', 100),
        '15m': get_candles(symbol, '15m', 100),
        '1H': get_candles(symbol, '1H', 100),
        '4H': get_candles(symbol, '4H', 50),
    }
    
    if not all(timeframes.values()):
        return None
    
    analyses = {}
    for tf, candles in timeframes.items():
        if len(candles) < 30:
            continue
        
        closes = [float(c[4]) for c in candles]
        highs = [float(c[2]) for c in candles]
        lows = [float(c[3]) for c in candles]
        
        rsi = calc_rsi(closes)
        ema5 = calc_ema(closes, 5)
        ema10 = calc_ema(closes, 10)
        ema20 = calc_ema(closes, 20)
        ema50 = calc_ema(closes, 50) if len(closes) >= 50 else ema20
        macd = calc_macd(closes)
        stoch = calc_stochastic(highs, lows, closes)
        bb_upper, bb_mid, bb_lower = calc_bollinger(closes)
        vol_pressure = calc_volume_pressure(candles)
        momentum = calc_momentum(closes)
        volatility = calc_volatility(closes)
        
        current = closes[0]
        
        analyses[tf] = {
            'price': current,
            'rsi': rsi,
            'ema5': ema5,
            'ema10': ema10,
            'ema20': ema20,
            'ema50': ema50,
            'macd': macd,
            'stoch': stoch,
            'bb_upper': bb_upper,
            'bb_mid': bb_mid,
            'bb_lower': bb_lower,
            'vol_pressure': vol_pressure,
            'momentum': momentum,
            'volatility': volatility,
        }
    
    # SCORING SUPREMO
    total_score = 0
    reasons = []
    tf_buy = 0
    tf_sell = 0
    
    for tf, a in analyses.items():
        tf_score = 0
        
        # RSI (peso: 30)
        if a['rsi'] < 20:
            tf_score += 30
            reasons.append(f'RSI EXTREMO {a["rsi"]:.0f} ({tf})')
        elif a['rsi'] < 30:
            tf_score += 25
            reasons.append(f'RSI oversold {a["rsi"]:.0f} ({tf})')
        elif a['rsi'] < 35:
            tf_score += 15
        elif a['rsi'] > 80:
            tf_score -= 25
            reasons.append(f'RSI EXTREMO ALTO {a["rsi"]:.0f} ({tf})')
        elif a['rsi'] > 70:
            tf_score -= 15
        
        # EMA ALINHAMENTO (peso: 25)
        if a['ema5'] > a['ema10'] > a['ema20'] > a['ema50']:
            tf_score += 25
            reasons.append(f'EMA PERFECTA UP ({tf})')
        elif a['ema5'] > a['ema10'] > a['ema20']:
            tf_score += 15
        elif a['ema5'] < a['ema10'] < a['ema20'] < a['ema50']:
            tf_score -= 25
        elif a['ema5'] < a['ema10'] < a['ema20']:
            tf_score -= 15
        
        # MACD (peso: 20)
        if a['macd'] > 0 and a['momentum'] > 1:
            tf_score += 20
            reasons.append(f'MACD FORTE POSITIVO ({tf})')
        elif a['macd'] > 0:
            tf_score += 10
        elif a['macd'] < 0 and a['momentum'] < -1:
            tf_score -= 20
        
        # BOLLINGER (peso: 15)
        if a['price'] < a['bb_lower']:
            tf_score += 15
            reasons.append(f'ABAIXO BOLLINGER ({tf})')
        elif a['price'] > a['bb_upper']:
            tf_score -= 10
        
        # VOLUME PRESSURE (peso: 10)
        if a['vol_pressure'] > 0.7:
            tf_score += 10
            reasons.append(f'COMPRA FORTE {a["vol_pressure"]:.0%} ({tf})')
        elif a['vol_pressure'] < 0.3:
            tf_score -= 10
        
        # STOCHASTIC (peso: bonus)
        if a['stoch'] < 15:
            tf_score += 10
            reasons.append(f'STOCH OVERSOLD ({tf})')
        elif a['stoch'] > 85:
            tf_score -= 10
        
        total_score += tf_score
        if tf_score > 0:
            tf_buy += 1
        elif tf_score < 0:
            tf_sell += 1
    
    # DECISAO SUPREMA
    avg_score = total_score / len(analyses) if analyses else 0
    agreement = max(tf_buy, tf_sell) / len(analyses) if analyses else 0
    
    action = 'HOLD'
    confidence = 0
    
    # COMPRA: todos concordam + score alto
    if tf_buy >= 3 and avg_score > 25 and agreement > 0.7:
        action = 'BUY'
        confidence = min(98, int(avg_score + 20))
    elif tf_buy >= 2 and avg_score > 20:
        action = 'BUY'
        confidence = min(92, int(avg_score + 15))
    elif avg_score > 30:
        action = 'BUY'
        confidence = min(88, int(avg_score + 10))
    
    # VENDA
    elif tf_sell >= 3 and avg_score < -25 and agreement > 0.7:
        action = 'SELL'
        confidence = min(95, int(abs(avg_score) + 20))
    elif tf_sell >= 2 and avg_score < -20:
        action = 'SELL'
        confidence = min(88, int(abs(avg_score) + 15))
    
    if action == 'HOLD':
        return None
    
    price_info = get_price(symbol)
    
    return {
        'symbol': symbol,
        'action': action,
        'confidence': confidence,
        'price': price_info['last'] if price_info else analyses.get('5m', {}).get('price', 0),
        'price_info': price_info,
        'analyses': analyses,
        'reasons': reasons[:5],
        'total_score': total_score,
        'avg_score': avg_score,
        'agreement': agreement,
        'tf_buy': tf_buy,
        'tf_sell': tf_sell,
    }

def format_supreme(signal):
    if signal['action'] == 'BUY':
        header = '>>> SUPREMA COMPRA <<<'
    else:
        header = '>>> SUPREMA VENDA <<<'
    
    a = signal['analyses'].get('5m', signal['analyses'].get('15m', {}))
    entry = signal['price']
    
    # Precos de entrada/saida
    sl = entry * 0.98
    tp1 = entry * 1.03
    tp2 = entry * 1.05
    tp3 = entry * 1.10
    
    risk = abs(entry - sl) / entry * 100
    reward = abs(tp2 - entry) / entry * 100
    
    lines = [
        f'',
        f'{"#" * 60}',
        f'  {header} {signal["symbol"]}',
        f'  CONFIDENCIA: {signal["confidence"]}%',
        f'  SCORE: {signal["total_score"]:.0f} | Agreement: {signal["agreement"]:.0%}',
        f'{"#" * 60}',
        f'',
        f'  PRECO ATUAL: ${entry:.4f}',
        f'',
        f'  INDICADORES:',
        f'    RSI: {a.get("rsi", 0):.1f} | Stoch: {a.get("stoch", 0):.1f}',
        f'    MACD: {a.get("macd", 0):+.6f}',
        f'    EMA5: ${a.get("ema5", 0):.4f} | EMA20: ${a.get("ema20", 0):.4f}',
        f'    BB: [${a.get("bb_lower", 0):.4f} - ${a.get("bb_upper", 0):.4f}]',
        f'    Volume Pressure: {a.get("vol_pressure", 0):.0%}',
        f'    Momentum: {a.get("momentum", 0):+.1f}%',
        f'    Volatility: {a.get("volatility", 0):.1%}',
        f'',
        f'  TIMEFRAMES: {signal["tf_buy"]} BUY / {signal["tf_sell"]} SELL',
        f'',
        f'  MOTIVOS: {", ".join(signal["reasons"])}',
        f'',
        f'  {"=" * 50}',
        f'  PLANO SUPREMO DE TRADE',
        f'  {"=" * 50}',
        f'  ENTRY: ${entry:.4f}',
        f'  STOP LOSS: ${sl:.4f} (-{risk:.1f}%)',
        f'  TP1: ${tp1:.4f} (+{CONFIG["take_profit"][0]*100:.0f}%)',
        f'  TP2: ${tp2:.4f} (+{CONFIG["take_profit"][1]*100:.0f}%)',
        f'  TP3: ${tp3:.4f} (+{CONFIG["take_profit"][2]*100:.0f}%)',
        f'  RISK/REWARD: 1:{reward/risk:.1f}',
        f'',
        f'  LINK JUPITER:',
        f'  https://jup.ag/swap/SOL-{TOKENS.get(signal["symbol"], "")}',
        f'  {"=" * 50}',
    ]
    
    return '\n'.join(lines)

# Configuracao SUPREMA
CONFIG = {
    'check_interval': 30,  # 30 segundos (ULTRA RAPIDO!)
    'min_confidence': 75,
    'take_profit': [0.03, 0.05, 0.10],
    'stop_loss': -0.02,
}

def monitor():
    log('=' * 60)
    log('  TRADER SUPREMO v3.0 INICIADO')
    log('  500 ANOS DE EXPERIENCIA EM ALGORITMO')
    log('  META: LUCRO MAXIMO DIARIO')
    log('=' * 60)
    
    seen = {}
    total_signals = 0
    start_time = time.time()
    
    while True:
        try:
            all_signals = []
            
            for symbol in TOKENS.keys():
                try:
                    s = supreme_analysis(symbol)
                    if s and s['confidence'] >= CONFIG['min_confidence']:
                        all_signals.append(s)
                except:
                    pass
            
            all_signals.sort(key=lambda x: x['confidence'], reverse=True)
            
            for s in all_signals:
                key = f'{s["symbol"]}_{s["action"]}_{datetime.now().strftime("%Y%m%d%H%M")}'
                if key not in seen:
                    seen[key] = time.time()
                    total_signals += 1
                    print(format_supreme(s))
                    
                    # Salva
                    with open(os.path.join(DATA_DIR, 'supreme-signals.json'), 'w') as f:
                        json.dump(all_signals, f, indent=2)
            
            elapsed = (time.time() - start_time) / 60
            log(f'Check: {len(all_signals)} sinais | Total: {total_signals} | Tempo: {elapsed:.0f}min')
            
            time.sleep(CONFIG['check_interval'])
            
        except KeyboardInterrupt:
            log('BOT INTERROMPIDO')
            break
        except Exception as e:
            log(f'ERRO: {e}')
            time.sleep(5)

if __name__ == '__main__':
    monitor()
