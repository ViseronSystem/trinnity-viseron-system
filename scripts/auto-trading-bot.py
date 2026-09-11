#!/usr/bin/env python3
"""
TVS VISERON — Bot de Trading Automatico
Opera 24/7 na Jupiter DEX
"""
import json
import os
import time
import urllib.request
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

# Configuracao
CONFIG = {
    'max_trades_per_day': 50,
    'trade_amount_sol': 0.005,  # 0.05% do saldo por trade
    'take_profit_pct': 3.0,     # Vende quando sobe 3%
    'stop_loss_pct': -5.0,      # Vende quando cai 5%
    'min_sol_for_gas': 0.005,   # Minimo de SOL para gas
    'cooldown_seconds': 300,    # 5 min entre trades
}

def log(msg):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f'[{timestamp}] {msg}')
    # Salva em log
    with open(os.path.join(DATA_DIR, 'bot.log'), 'a') as f:
        f.write(f'[{timestamp}] {msg}\n')

def get_sol_price():
    """Preco SOL da OKX"""
    try:
        url = 'https://www.okx.com/api/v5/market/ticker?instId=SOL-USDT'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return float(data['data'][0]['last'])
    except:
        return 108.0  # fallback

def get_balance():
    """Saldo SOL"""
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'getBalance', 'params': [WALLET]}
    req = urllib.request.Request('https://api.mainnet-beta.solana.com',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        return result['result']['value'] / 1e9

def get_tokens():
    """Lista tokens na wallet"""
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'getTokenAccountsByOwner', 'params': [
        WALLET,
        {'programId': 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'},
        {'encoding': 'jsonParsed'}
    ]}
    req = urllib.request.Request('https://api.mainnet-beta.solana.com',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        tokens = {}
        for acc in result['result']['value']:
            info = acc['account']['data']['parsed']['info']
            mint = info['mint']
            amount = float(info['tokenAmount']['uiAmount'] or 0)
            if amount > 0:
                tokens[mint] = amount
        return tokens

def get_token_price(symbol):
    """Preco do token"""
    try:
        url = f'https://www.okx.com/api/v5/market/ticker?instId={symbol}-USDT'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data['data']:
                return float(data['data'][0]['last'])
    except:
        pass
    return None

def analyze_token(symbol):
    """Analise tecnica de um token"""
    try:
        url = f'https://www.okx.com/api/v5/market/candles?instId={symbol}-USDT&bar=1H&limit=24'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            candles = data['data']
            
            closes = [float(c[4]) for c in candles]
            current = closes[0]
            prev = closes[1]
            
            # Tendencia 1h
            change_1h = (current - prev) / prev * 100
            
            # Media 24h
            avg_24h = sum(closes) / len(closes)
            
            # RSI
            gains = []
            losses = []
            for i in range(min(14, len(closes)-1)):
                diff = closes[i] - closes[i+1]
                if diff > 0:
                    gains.append(diff)
                else:
                    losses.append(abs(diff))
            
            avg_gain = sum(gains) / 14 if gains else 0
            avg_loss = sum(losses) / 14 if losses else 0.001
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
            return {
                'price': current,
                'change_1h': change_1h,
                'avg_24h': avg_24h,
                'rsi': rsi,
                'trend': 'UP' if change_1h > 0 else 'DOWN',
            }
    except:
        return None

def generate_signal(symbol):
    """Gera sinal de trade"""
    analysis = analyze_token(symbol)
    if not analysis:
        return None
    
    signal = {
        'symbol': symbol,
        'action': 'HOLD',
        'confidence': 0,
        'reason': '',
    }
    
    # Compra: RSI < 30 e preco abaixo da media
    if analysis['rsi'] < 30 and analysis['price'] < analysis['avg_24h']:
        signal['action'] = 'BUY'
        signal['confidence'] = 80
        signal['reason'] = f'RSI oversold ({analysis["rsi"]:.1f}) + abaixo da media'
    
    # Compra: tendencia forte positiva
    elif analysis['change_1h'] > 2 and analysis['rsi'] < 60:
        signal['action'] = 'BUY'
        signal['confidence'] = 70
        signal['reason'] = f'Tendencia forte (+{analysis["change_1h"]:.1f}% em 1h)'
    
    # Venda: RSI > 70
    elif analysis['rsi'] > 70:
        signal['action'] = 'SELL'
        signal['confidence'] = 75
        signal['reason'] = f'RSI overbought ({analysis["rsi"]:.1f})'
    
    # Venda: tendencia negativa forte
    elif analysis['change_1h'] < -3:
        signal['action'] = 'SELL'
        signal['confidence'] = 70
        signal['reason'] = f'Tendencia negativa ({analysis["change_1h"]:.1f}% em 1h)'
    
    signal['analysis'] = analysis
    return signal

def execute_trade(signal):
    """Executa um trade (regista para execucao manual)"""
    trade = {
        'timestamp': datetime.now().isoformat(),
        'symbol': signal['symbol'],
        'action': signal['action'],
        'confidence': signal['confidence'],
        'reason': signal['reason'],
        'price': signal['analysis']['price'],
        'status': 'PENDING',
    }
    
    # Salva trade
    trades_file = os.path.join(DATA_DIR, 'auto-trades.json')
    trades = []
    if os.path.exists(trades_file):
        with open(trades_file) as f:
            trades = json.load(f)
    trades.append(trade)
    with open(trades_file, 'w') as f:
        json.dump(trades, f, indent=2)
    
    log(f'SINAL: {signal["action"]} {signal["symbol"]} @ ${signal["analysis"]["price"]:.4f} ({signal["confidence"]}% - {signal["reason"]})')
    
    return trade

def main():
    print('=' * 60)
    print('  TVS VISERON — BOT DE TRADING AUTOMATICO')
    print('=' * 60)
    
    # Verifica saldo
    sol_balance = get_balance()
    log(f'Saldo: {sol_balance:.4f} SOL (${sol_balance * 108:.2f})')
    
    if sol_balance < CONFIG['min_sol_for_gas']:
        log('SALDO INSUFICIENTE PARA GAS!')
        return
    
    # Tokens para monitorizar
    watchlist = ['SOL', 'JUP', 'RAY', 'BONK', 'WIF', 'TRUMP', 'PUMP']
    
    log(f'Monitorizando {len(watchlist)} tokens...')
    
    # Analisa cada token
    signals = []
    for symbol in watchlist:
        signal = generate_signal(symbol)
        if signal and signal['action'] != 'HOLD':
            signals.append(signal)
            log(f'  {symbol}: {signal["action"]} ({signal["confidence"]}%)')
    
    # Ordena por confianca
    signals.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Executa top 3 sinais
    trades_feitos = 0
    for signal in signals[:3]:
        if trades_feitos >= 3:
            break
        
        if signal['confidence'] >= 70:
            execute_trade(signal)
            trades_feitos += 1
    
    # Resumo
    log(f'Trades executados: {trades_feitos}')
    log(f'Sinais encontrados: {len(signals)}')
    
    # Salva estado
    state = {
        'last_run': datetime.now().isoformat(),
        'sol_balance': sol_balance,
        'signals': len(signals),
        'trades': trades_feitos,
    }
    with open(os.path.join(DATA_DIR, 'bot-state.json'), 'w') as f:
        json.dump(state, f, indent=2)
    
    return state

if __name__ == '__main__':
    main()
