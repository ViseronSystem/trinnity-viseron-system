#!/usr/bin/env python3
"""
TVS VISERON — MEGA TRADING BOT v2.0
Sinais FORTES + RAPIDOS + LUCRO EXPONENCIAL
Integrado com Vibe Trading AI
"""
import json
import os
import time
import urllib.request
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

# Tokens com contratos Solana
TOKENS = {
    'SOL': 'So11111111111111111111111111111111111111112',
    'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    'TRUMP': '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    'PENGU': '2zMMhcVQ6D1SEjWrD6gRmjNDRkF1eFLcckage7NkVLry',
    'FARTCOIN': '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
    'POPCAT': '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    'MOG': '7kgj4vE4F2pgVkZ3vLgDvN3U1GPXRAbJQcK9aN3JxDVP',
}

# Configuracao MEGA AGRESSIVA
CONFIG = {
    'check_interval': 60,  # 1 minuto (RAPIDO!)
    'timeframes': ['5m', '15m', '1H'],  # Multi-timeframe
    'min_confidence': 70,  # Sinais FORTES
    'take_profit': [0.03, 0.05, 0.10],  # TP escalonado
    'stop_loss': -0.02,  # SL apertado
    'max_positions': 3,
    'trade_amount_pct': 0.25,  # 25% por trade
}

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    with open(os.path.join(DATA_DIR, 'mega.log'), 'a') as f:
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
                'change24h': float(d['last']) - float(d['sodUtc8']),
            }
    except:
        return None

def get_candles(symbol, bar='15m', limit=50):
    try:
        url = f'https://www.okx.com/api/v5/market/candles?instId={symbol}-USDT&bar={bar}&limit={limit}'
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
    
    if not gains and not losses:
        return 50
    
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

def calc_macd(closes):
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    macd = ema12 - ema26
    signal_line = calc_ema([macd] * 9, 9) if len(closes) > 26 else macd
    histogram = macd - signal_line
    return macd, signal_line, histogram

def calc_bollinger(closes, period=20):
    sma = sum(closes[:period]) / period
    std = (sum((c - sma) ** 2 for c in closes[:period]) / period) ** 0.5
    return sma + 2 * std, sma, sma - 2 * std

def calc_stochastic(highs, lows, closes, period=14):
    lowest = min(lows[:period])
    highest = max(highs[:period])
    if highest == lowest:
        return 50
    k = (closes[0] - lowest) / (highest - lowest) * 100
    return k

def calc_atr(highs, lows, closes, period=14):
    trs = []
    for i in range(period):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i+1]), abs(lows[i] - closes[i+1]))
        trs.append(tr)
    return sum(trs) / len(trs) if trs else 0

def multi_timeframe_analysis(symbol):
    """Analise multi-timeframe para sinais mais fortes"""
    signals = []
    
    for bar in ['5m', '15m', '1H']:
        candles = get_candles(symbol, bar, 50)
        if len(candles) < 30:
            continue
        
        closes = [float(c[4]) for c in candles]
        highs = [float(c[2]) for c in candles]
        lows = [float(c[3]) for c in candles]
        
        rsi = calc_rsi(closes)
        ema5 = calc_ema(closes, 5)
        ema10 = calc_ema(closes, 10)
        ema20 = calc_ema(closes, 20)
        macd, signal, hist = calc_macd(closes)
        bb_upper, bb_mid, bb_lower = calc_bollinger(closes)
        stoch = calc_stochastic(highs, lows, closes)
        atr = calc_atr(highs, lows, closes)
        
        current = closes[0]
        change_1h = (current - closes[4]) / closes[4] * 100 if len(closes) > 4 else 0
        
        score = 0
        reasons = []
        
        # RSI (peso: 25)
        if rsi < 25:
            score += 25
            reasons.append(f'RSI extremo {rsi:.0f}')
        elif rsi < 30:
            score += 20
            reasons.append(f'RSI oversold {rsi:.0f}')
        elif rsi < 35:
            score += 15
            reasons.append(f'RSI baixo {rsi:.0f}')
        elif rsi > 75:
            score -= 20
            reasons.append(f'RSI overbought {rsi:.0f}')
        
        # EMA (peso: 20)
        if ema5 > ema10 > ema20 and current > ema5:
            score += 20
            reasons.append('EMA alinhadas UP')
        elif ema5 > ema10:
            score += 10
            reasons.append('EMA5 > EMA10')
        elif ema5 < ema10 < ema20:
            score -= 15
            reasons.append('EMA bearish')
        
        # MACD (peso: 20)
        if hist > 0 and macd > 0:
            score += 20
            reasons.append('MACD forte positivo')
        elif hist > 0:
            score += 10
            reasons.append('MACD positivo')
        elif hist < 0 and macd < 0:
            score -= 15
            reasons.append('MACD negativo')
        
        # Bollinger (peso: 15)
        if current < bb_lower:
            score += 15
            reasons.append('Abaixo de Bollinger')
        elif current > bb_upper:
            score -= 10
            reasons.append('Acima de Bollinger')
        
        # Stochastic (peso: 10)
        if stoch < 20:
            score += 10
            reasons.append('Stochastic oversold')
        elif stoch > 80:
            score -= 10
            reasons.append('Stochastic overbought')
        
        # Volume (peso: 10)
        vol = float(candles[0][5])
        avg_vol = sum(float(c[5]) for c in candles[:20]) / 20
        vol_ratio = vol / avg_vol if avg_vol > 0 else 1
        if vol_ratio > 2:
            score += 10
            reasons.append(f'Volume {vol_ratio:.1f}x')
        elif vol_ratio > 1.5:
            score += 5
        
        # Momentum (peso: bonus)
        if change_1h > 2:
            score += 5
            reasons.append(f'Momentum +{change_1h:.1f}%')
        elif change_1h < -2:
            score -= 5
        
        signals.append({
            'timeframe': bar,
            'score': score,
            'rsi': rsi,
            'macd': macd,
            'histogram': hist,
            'ema5': ema5,
            'ema20': ema20,
            'bb_upper': bb_upper,
            'bb_lower': bb_lower,
            'stochastic': stoch,
            'atr': atr,
            'change_1h': change_1h,
            'vol_ratio': vol_ratio,
            'reasons': reasons,
        })
    
    return signals

def mega_signal(symbol):
    """Gera sinal MEGA forte"""
    signals = multi_timeframe_analysis(symbol)
    
    if len(signals) < 2:
        return None
    
    # Score total = soma dos timeframes
    total_score = sum(s['score'] for s in signals)
    avg_score = total_score / len(signals)
    
    # Todos os timeframes concordam?
    buy_votes = sum(1 for s in signals if s['score'] > 10)
    sell_votes = sum(1 for s in signals if s['score'] < -10)
    
    # Indicadores principais
    primary = signals[0]  # 5m (mais rapido)
    secondary = signals[1]  # 15m
    
    action = 'HOLD'
    confidence = 0
    reasons = []
    
    # COMPRA FORTE: todos concordam + score alto
    if buy_votes >= 2 and avg_score > 30:
        action = 'BUY'
        confidence = min(98, int(avg_score + 10))
        reasons = primary['reasons'][:3]
    elif buy_votes >= 2 and avg_score > 20:
        action = 'BUY'
        confidence = min(90, int(avg_score + 15))
        reasons = primary['reasons'][:3]
    elif primary['score'] > 40:
        action = 'BUY'
        confidence = min(85, int(primary['score'] + 5))
        reasons = primary['reasons'][:3]
    
    # VENDA FORTE
    elif sell_votes >= 2 and avg_score < -20:
        action = 'SELL'
        confidence = min(95, int(abs(avg_score) + 10))
        reasons = primary['reasons'][:3]
    elif primary['score'] < -30:
        action = 'SELL'
        confidence = min(85, int(abs(primary['score']) + 5))
        reasons = primary['reasons'][:3]
    
    if action == 'HOLD':
        return None
    
    price_info = get_price(symbol)
    
    return {
        'symbol': symbol,
        'action': action,
        'confidence': confidence,
        'price': price_info['last'] if price_info else 0,
        'price_info': price_info,
        'signals': signals,
        'reasons': reasons,
        'total_score': total_score,
        'avg_score': avg_score,
        'timeframes_agree': buy_votes >= 2 or sell_votes >= 2,
    }

def format_mega_signal(signal):
    a = signal
    s = signal['signals'][0]
    
    if a['action'] == 'BUY':
        header = f'>>> MEGA COMPRA <<< {a["symbol"]}'
        emoji = '>>> COMPRA <<<'
    else:
        header = f'>>> MEGA VENDA <<< {a["symbol"]}'
        emoji = '>>> VENDA <<<'
    
    entry = a['price']
    sl = entry * (1 + CONFIG['stop_loss'])
    tp1 = entry * (1 + CONFIG['take_profit'][0])
    tp2 = entry * (1 + CONFIG['take_profit'][1])
    tp3 = entry * (1 + CONFIG['take_profit'][2])
    
    risk = abs(entry - sl) / entry * 100
    reward = abs(tp2 - entry) / entry * 100
    
    lines = [
        f'',
        f'{"#" * 60}',
        f'  {emoji} {a["symbol"]} | CONFIDENCIA: {a["confidence"]}%',
        f'{"#" * 60}',
        f'',
        f'PRECO: ${entry:.4f}',
        f'',
        f'INDICADORES (5m):',
        f'  RSI: {s["rsi"]:.1f} | Stoch: {s["stochastic"]:.1f}',
        f'  MACD: {s["macd"]:+.6f} | Hist: {s["histogram"]:+.6f}',
        f'  EMA5: ${s["ema5"]:.4f} | EMA20: ${s["ema20"]:.4f}',
        f'  BB: [${s["bb_lower"]:.4f} - ${s["bb_upper"]:.4f}]',
        f'  ATR: {s["atr"]:.4f} | Vol: {s["vol_ratio"]:.1f}x',
        f'  Momentum 1h: {s["change_1h"]:+.1f}%',
        f'',
        f'TIMEFRAMES: {len([x for x in signal["signals"] if x["score"] > 0])}/{len(signal["signals"])} concordam',
        f'SCORE TOTAL: {signal["total_score"]:.0f} | Media: {signal["avg_score"]:.0f}',
        f'',
        f'MOTIVOS: {", ".join(a["reasons"])}',
        f'',
        f'{"=" * 60}',
        f'  PLANO DE TRADE',
        f'{"=" * 60}',
        f'  ENTRY: ${entry:.4f}',
        f'  STOP LOSS: ${sl:.4f} (-{risk:.1f}%)',
        f'  TP1: ${tp1:.4f} (+{CONFIG["take_profit"][0]*100:.0f}%)',
        f'  TP2: ${tp2:.4f} (+{CONFIG["take_profit"][1]*100:.0f}%)',
        f'  TP3: ${tp3:.4f} (+{CONFIG["take_profit"][2]*100:.0f}%)',
        f'  RISK/REWARD: 1:{reward/risk:.1f}',
        f'',
        f'  CAPITAL SUGERIDO: 25% do saldo',
        f'',
        f'  LINK JUPITER:',
        f'  https://jup.ag/swap/SOL-{TOKENS.get(a["symbol"], "")}',
        f'{"=" * 60}',
    ]
    
    return '\n'.join(lines)

def monitor():
    log('=' * 60)
    log('  MEGA TRADING BOT v2.0 INICIADO')
    log('  Sinais FORTES + RAPIDOS + EXPONENCIAIS')
    log('=' * 60)
    log(f'Wallet: {WALLET}')
    log(f'Intervalo: {CONFIG["check_interval"]}s')
    log(f'Min confidence: {CONFIG["min_confidence"]}%')
    log(f'Take Profit: {CONFIG["take_profit"]}')
    log(f'Stop Loss: {CONFIG["stop_loss"]*100:.0f}%')
    log(f'Tokens: {len(TOKENS)}')
    
    seen_signals = {}
    
    while True:
        try:
            start = time.time()
            
            all_signals = []
            
            for symbol in TOKENS.keys():
                try:
                    s = mega_signal(symbol)
                    if s and s['confidence'] >= CONFIG['min_confidence']:
                        all_signals.append(s)
                except Exception as e:
                    pass
            
            # Ordena por confianca
            all_signals.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Mostra sinais fortes
            for s in all_signals:
                key = f'{s["symbol"]}_{s["action"]}_{datetime.now().strftime("%Y%m%d%H")}'
                if key not in seen_signals:
                    seen_signals[key] = time.time()
                    print(format_mega_signal(s))
                    
                    # Salva
                    signals_file = os.path.join(DATA_DIR, 'mega-signals.json')
                    signals = []
                    if os.path.exists(signals_file):
                        with open(signals_file) as f:
                            signals = json.load(f)
                    signals.append({
                        'timestamp': datetime.now().isoformat(),
                        'symbol': s['symbol'],
                        'action': s['action'],
                        'confidence': s['confidence'],
                        'price': s['price'],
                        'reasons': s['reasons'],
                        'score': s['total_score'],
                    })
                    with open(signals_file, 'w') as f:
                        json.dump(signals[-100:], f, indent=2)
            
            # Resumo rapido
            elapsed = time.time() - start
            log(f'Analise completa: {len(all_signals)} sinais fortes | {elapsed:.1f}s')
            
            # Espera
            time.sleep(CONFIG['check_interval'])
            
        except KeyboardInterrupt:
            log('BOT INTERROMPIDO')
            break
        except Exception as e:
            log(f'ERRO: {e}')
            time.sleep(10)

if __name__ == '__main__':
    monitor()
