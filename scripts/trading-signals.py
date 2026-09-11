#!/usr/bin/env python3
"""
TVS VISERON — Bot de Sinais de Trading
Analisa mercado 24/7 e envia sinais para executar no Jupiter
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
}

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with open(os.path.join(DATA_DIR, 'signals.log'), 'a') as f:
        f.write(line + '\n')

def get_price(symbol):
    try:
        url = f'https://www.okx.com/api/v5/market/ticker?instId={symbol}-USDT'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return float(data['data'][0]['last'])
    except:
        return None

def get_candles(symbol):
    try:
        url = f'https://www.okx.com/api/v5/market/candles?instId={symbol}-USDT&bar=15m&limit=50'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data['data']
    except:
        return []

def analyze(symbol):
    candles = get_candles(symbol)
    if len(candles) < 20:
        return None
    
    closes = [float(c[4]) for c in candles]
    highs = [float(c[2]) for c in candles]
    lows = [float(c[3]) for c in candles]
    current = closes[0]
    
    # RSI
    gains = []
    losses = []
    for i in range(14):
        diff = closes[i] - closes[i+1]
        if diff > 0:
            gains.append(diff)
        else:
            losses.append(abs(diff))
    
    avg_gain = sum(gains) / 14 if gains else 0
    avg_loss = sum(losses) / 14 if losses else 0.001
    rsi = 100 - (100 / (1 + avg_gain / avg_loss))
    
    # EMAs
    ema5 = sum(closes[:5]) / 5
    ema10 = sum(closes[:10]) / 10
    ema20 = sum(closes[:20]) / 20
    
    # MACD
    ema12 = sum(closes[:12]) / 12
    ema26 = sum(closes[:26]) / 26
    macd = ema12 - ema26
    
    # Bollinger
    sma20 = sum(closes[:20]) / 20
    std20 = (sum((c - sma20) ** 2 for c in closes[:20]) / 20) ** 0.5
    bb_upper = sma20 + 2 * std20
    bb_lower = sma20 - 2 * std20
    
    # Suporte/Resistencia
    support = min(lows[:10])
    resistance = max(highs[:10])
    
    # Volume
    volumes = [float(c[5]) for c in candles]
    avg_vol = sum(volumes) / len(volumes)
    vol_ratio = volumes[0] / avg_vol if avg_vol > 0 else 1
    
    return {
        'price': current,
        'rsi': rsi,
        'ema5': ema5,
        'ema10': ema10,
        'ema20': ema20,
        'macd': macd,
        'bb_upper': bb_upper,
        'bb_lower': bb_lower,
        'support': support,
        'resistance': resistance,
        'vol_ratio': vol_ratio,
    }

def generate_signal(symbol):
    a = analyze(symbol)
    if not a:
        return None
    
    signal = {'symbol': symbol, 'action': 'HOLD', 'confidence': 0, 'reasons': []}
    
    # COMPRA: RSI baixo + tendencia positiva
    if a['rsi'] < 25 and a['price'] < a['bb_lower']:
        signal['action'] = 'BUY'
        signal['confidence'] = 95
        signal['reasons'] = ['RSI oversold EXTREMO', 'Abaixo de Bollinger', 'Reversao iminente']
    elif a['rsi'] < 30 and a['ema5'] > a['ema10']:
        signal['action'] = 'BUY'
        signal['confidence'] = 85
        signal['reasons'] = ['RSI oversold', 'EMA cross up']
    elif a['rsi'] < 40 and a['macd'] > 0 and a['vol_ratio'] > 1.5:
        signal['action'] = 'BUY'
        signal['confidence'] = 75
        signal['reasons'] = ['RSI baixo', 'MACD positivo', 'Volume alto']
    elif a['ema5'] > a['ema10'] > a['ema20'] and a['price'] > a['ema5']:
        signal['action'] = 'BUY'
        signal['confidence'] = 70
        signal['reasons'] = ['Tendencia forte', 'EMA alinhadas']
    
    # VENDA: RSI alto + reversao
    elif a['rsi'] > 75 and a['price'] > a['bb_upper']:
        signal['action'] = 'SELL'
        signal['confidence'] = 90
        signal['reasons'] = ['RSI overbought EXTREMO', 'Acima de Bollinger']
    elif a['rsi'] > 70 and a['ema5'] < a['ema10']:
        signal['action'] = 'SELL'
        signal['confidence'] = 80
        signal['reasons'] = ['RSI overbought', 'EMA cross down']
    elif a['rsi'] > 65 and a['macd'] < 0:
        signal['action'] = 'SELL'
        signal['confidence'] = 70
        signal['reasons'] = ['RSI alto', 'MACD negativo']
    
    signal['analysis'] = a
    return signal

def format_signal(signal):
    a = signal['analysis']
    emoji = '>>> COMPRA <<<' if signal['action'] == 'BUY' else '>>> VENDA <<<' if signal['action'] == 'SELL' else 'SEGURAR'
    
    lines = [
        f'',
        f'{"=" * 50}',
        f'{emoji} {signal["symbol"]} ({signal["confidence"]}%)',
        f'{"=" * 50}',
        f'Preco: ${a["price"]:.4f}',
        f'RSI: {a["rsi"]:.1f}',
        f'EMA5: {a["ema5"]:.4f} | EMA20: {a["ema20"]:.4f}',
        f'MACD: {a["macd"]:+.6f}',
        f'BB: [{a["bb_lower"]:.4f} - {a["bb_upper"]:.4f}]',
        f'Suporte: ${a["support"]:.4f} | Resistencia: ${a["resistance"]:.4f}',
        f'Volume: {a["vol_ratio"]:.1f}x media',
        f'',
        f'MOTIVOS: {", ".join(signal["reasons"])}',
    ]
    
    if signal['action'] == 'BUY':
        entry = a['price']
        sl = a['support'] * 0.98
        tp = a['resistance']
        lines.extend([
            f'',
            f'ENTRY: ${entry:.4f}',
            f'STOP LOSS: ${sl:.4f} (-{(entry-sl)/entry*100:.1f}%)',
            f'TAKE PROFIT: ${tp:.4f} (+{(tp-entry)/entry*100:.1f}%)',
            f'',
            f'LINK: https://jup.ag/swap/SOL-{TOKENS.get(signal["symbol"], "")}',
        ])
    
    return '\n'.join(lines)

def monitor():
    log('BOT DE SINAIS INICIADO')
    log(f'Wallet: {WALLET}')
    log(f'Tokens: {", ".join(TOKENS.keys())}')
    
    signals_sent = []
    
    while True:
        try:
            log('--- ANALISE DE MERCADO ---')
            
            all_signals = []
            for symbol in TOKENS.keys():
                s = generate_signal(symbol)
                if s and s['action'] != 'HOLD':
                    all_signals.append(s)
            
            # Ordena por confianca
            all_signals.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Mostra sinais fortes
            strong = [s for s in all_signals if s['confidence'] >= 70]
            
            if strong:
                log(f'ENCONTRADOS {len(strong)} SINAIS FORTES!')
                
                for s in strong:
                    # Evita sinais repetidos
                    key = f'{s["symbol"]}_{s["action"]}_{datetime.now().strftime("%H")}'
                    if key not in signals_sent:
                        print(format_signal(s))
                        signals_sent.append(key)
                        
                        # Salva sinal
                        signals_file = os.path.join(DATA_DIR, 'active-signals.json')
                        signals = []
                        if os.path.exists(signals_file):
                            with open(signals_file) as f:
                                signals = json.load(f)
                        signals.append({
                            'timestamp': datetime.now().isoformat(),
                            'symbol': s['symbol'],
                            'action': s['action'],
                            'confidence': s['confidence'],
                            'price': s['analysis']['price'],
                            'reasons': s['reasons'],
                        })
                        with open(signals_file, 'w') as f:
                            json.dump(signals, f, indent=2)
            else:
                log('Nenhum sinal forte encontrado')
            
            # Mostra resumo
            print(f'')
            print(f'RESUMO: {len(strong)} sinais fortes de {len(TOKENS)} tokens')
            for s in all_signals[:5]:
                emoji = 'BUY' if s['action'] == 'BUY' else 'SELL' if s['action'] == 'SELL' else 'HOLD'
                print(f'  {emoji} {s["symbol"]}: {s["confidence"]}% | RSI: {s["analysis"]["rsi"]:.1f}')
            
            log('Proximo check em 5 min...')
            time.sleep(300)
            
        except KeyboardInterrupt:
            log('BOT INTERROMPIDO')
            break
        except Exception as e:
            log(f'ERRO: {e}')
            time.sleep(60)

if __name__ == '__main__':
    monitor()
