#!/usr/bin/env python3
"""Verifica saldo e comeca a trader"""
import json, urllib.request, os, time
from datetime import datetime

WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'
DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'

def get_sol():
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'getBalance', 'params': [WALLET]}
    req = urllib.request.Request('https://api.mainnet-beta.solana.com',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        return result['result']['value'] / 1e9

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
    
    # EMAs
    ema5 = sum(closes[:5]) / 5
    ema10 = sum(closes[:10]) / 10
    ema20 = sum(closes[:20]) / 20
    
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
    
    # MACD
    ema12 = sum(closes[:12]) / 12
    ema26 = sum(closes[:26]) / 26
    macd = ema12 - ema26
    
    # Bollinger Bands
    sma20 = sum(closes[:20]) / 20
    std20 = (sum((c - sma20) ** 2 for c in closes[:20]) / 20) ** 0.5
    bb_upper = sma20 + 2 * std20
    bb_lower = sma20 - 2 * std20
    
    # Suporte/Resistencia
    support = min(lows[:10])
    resistance = max(highs[:10])
    
    return {
        'price': current,
        'ema5': ema5,
        'ema10': ema10,
        'ema20': ema20,
        'rsi': rsi,
        'macd': macd,
        'bb_upper': bb_upper,
        'bb_lower': bb_lower,
        'support': support,
        'resistance': resistance,
    }

def generate_signal(symbol):
    a = analyze(symbol)
    if not a:
        return None
    
    signal = {'symbol': symbol, 'action': 'HOLD', 'confidence': 0, 'reasons': []}
    
    # COMPRA: RSI < 30 + preco < BB lower + EMA cross up
    if a['rsi'] < 30 and a['price'] < a['bb_lower']:
        signal['action'] = 'BUY'
        signal['confidence'] = 90
        signal['reasons'].append('RSI oversold + abaixo de Bollinger')
    elif a['rsi'] < 35 and a['ema5'] > a['ema10']:
        signal['action'] = 'BUY'
        signal['confidence'] = 75
        signal['reasons'].append('RSI baixo + EMA cross up')
    elif a['macd'] > 0 and a['price'] > a['ema20']:
        signal['action'] = 'BUY'
        signal['confidence'] = 65
        signal['reasons'].append('MACD positivo + acima de EMA20')
    
    # VENDA: RSI > 70 + preco > BB upper
    elif a['rsi'] > 70 and a['price'] > a['bb_upper']:
        signal['action'] = 'SELL'
        signal['confidence'] = 85
        signal['reasons'].append('RSI overbought + acima de Bollinger')
    elif a['rsi'] > 75:
        signal['action'] = 'SELL'
        signal['confidence'] = 70
        signal['reasons'].append('RSI muito alto')
    
    signal['analysis'] = a
    return signal

def main():
    print('=' * 60)
    print('  TVS VISERON — TRADING AGRESSIVO')
    print('=' * 60)
    
    sol = get_sol()
    price = get_price('SOL')
    value = sol * price
    
    print(f'')
    print(f'WALLET: {WALLET}')
    print(f'SALDO: {sol:.6f} SOL (${value:.2f})')
    print(f'GAS POR TRADE: ~$0.0005')
    print(f'TRADES POSSIVEIS: ~{int(sol / 0.000005):,}')
    print(f'')
    
    # Analisa tokens
    tokens = ['SOL', 'JUP', 'RAY', 'BONK', 'WIF']
    signals = []
    
    print('ANALISE TECNICA:')
    print('-' * 60)
    
    for t in tokens:
        s = generate_signal(t)
        if s:
            signals.append(s)
            emoji = '[BUY]' if s['action'] == 'BUY' else '[SELL]' if s['action'] == 'SELL' else '[HOLD]'
            print(f'{emoji} {t:6} | RSI: {s["analysis"]["rsi"]:5.1f} | MACD: {s["analysis"]["macd"]:+.4f} | {s["confidence"]}%')
            print(f'       | EMA5: {s["analysis"]["ema5"]:.4f} | EMA20: {s["analysis"]["ema20"]:.4f}')
            print(f'       | BB: [{s["analysis"]["bb_lower"]:.4f} - {s["analysis"]["bb_upper"]:.4f}]')
            if s['reasons']:
                print(f'       | Motivo: {", ".join(s["reasons"])}')
            print('')
    
    # Top sinais
    buy_signals = [s for s in signals if s['action'] == 'BUY']
    sell_signals = [s for s in signals if s['action'] == 'SELL']
    
    buy_signals.sort(key=lambda x: x['confidence'], reverse=True)
    sell_signals.sort(key=lambda x: x['confidence'], reverse=True)
    
    print('=' * 60)
    print('TOP SINAIS DE COMPRA:')
    print('-' * 60)
    for s in buy_signals[:3]:
        print(f'  [{s["confidence"]}%] {s["symbol"]} @ ${s["analysis"]["price"]:.4f}')
        print(f'       Stop Loss: ${s["analysis"]["support"]:.4f}')
        print(f'       Take Profit: ${s["analysis"]["resistance"]:.4f}')
    
    print('')
    print('=' * 60)
    print('TOP SINAIS DE VENDA:')
    print('-' * 60)
    for s in sell_signals[:3]:
        print(f'  [{s["confidence"]}%] {s["symbol"]} @ ${s["analysis"]["price"]:.4f}')
    
    # Trades executaveis
    print('')
    print('=' * 60)
    print('TRADES PARA EXECUTAR AGORA:')
    print('-' * 60)
    
    trade_amount = sol * 0.3  # 30% do saldo por trade
    
    if buy_signals:
        best = buy_signals[0]
        print(f'')
        print(f'1. COMPRA {best["symbol"]}:')
        print(f'   Valor: {trade_amount:.6f} SOL')
        print(f'   Link: https://jup.ag/swap/SOL-TokenMint')
        print(f'   Confianca: {best["confidence"]}%')
    
    if sell_signals and any(s['symbol'] in ['SOL'] for s in sell_signals):
        print(f'')
        print(f'2. VENDA SOL (proteger lucro):')
        print(f'   Valor: 50% do saldo')
        print(f'   Link: https://jup.ag/swap/SOL-USDC')
    
    # Salva estado
    state = {
        'timestamp': datetime.now().isoformat(),
        'balance_sol': sol,
        'balance_usd': value,
        'signals': [{'symbol': s['symbol'], 'action': s['action'], 'confidence': s['confidence']} for s in signals],
    }
    with open(os.path.join(DATA_DIR, 'trading-state.json'), 'w') as f:
        json.dump(state, f, indent=2)

if __name__ == '__main__':
    main()
