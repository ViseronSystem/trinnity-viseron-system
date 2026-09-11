#!/usr/bin/env python3
"""
TVS VISERON — Auto Trader para VPS
Executa trades automaticamente na Jupiter
"""
import json
import os
import time
import urllib.request
from datetime import datetime

# Configuracao
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'
PRIVATE_KEY = [26,40,37,248,151,195,132,140,228,71,42,231,45,153,87,222,135,6,179,63,106,122,88,43,114,156,240,187,235,151,154,34,144,191,192,78,41,209,63,77,59,137,130,19,169,83,17,51,200,4,37,69,232,144,226,179,12,250,30,121,49,245,154,230]

TOKENS = {
    'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    'PENGU': '2zMMhcVQ6D1SEjWrD6gRmjNDRkF1eFLcckage7NkVLry',
    'TRUMP': '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
}

SOL_MINT = 'So11111111111111111111111111111111111111112'

def log(msg):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = '[' + ts + '] ' + msg
    print(line, flush=True)

def get_price(symbol):
    try:
        url = 'https://www.okx.com/api/v5/market/ticker?instId=' + symbol + '-USDT'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return float(data['data'][0]['last'])
    except:
        return None

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

def get_balance():
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'getBalance', 'params': [WALLET]}
    req = urllib.request.Request('https://api.mainnet-beta.solana.com',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        return result['result']['value'] / 1e9

def get_tokens():
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

def get_jupiter_quote(input_mint, output_mint, amount):
    try:
        url = 'https://quote-api.jup.ag/v6/quote?inputMint=' + input_mint + '&outputMint=' + output_mint + '&amount=' + str(int(amount)) + '&slippageBps=100'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log('ERRO QUOTE: ' + str(e))
        return None

def get_jupiter_swap(quote):
    try:
        url = 'https://quote-api.jup.ag/v6/swap'
        data = json.dumps({
            'quoteResponse': quote,
            'userPublicKey': WALLET,
            'wrapAndUnwrapSol': True,
        }).encode()
        req = urllib.request.Request(url, data=data,
            headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log('ERRO SWAP: ' + str(e))
        return None

def sign_and_send(tx_base64):
    try:
        from solders.keypair import Keypair
        from solders.transaction import VersionedTransaction
        
        tx_bytes = base64.b64decode(tx_base64)
        tx = VersionedTransaction.from_bytes(tx_bytes)
        keypair = Keypair.from_bytes(bytes(PRIVATE_KEY))
        signed_tx = tx.sign([keypair])
        
        payload = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'sendTransaction',
            'params': [base64.b64encode(bytes(signed_tx)).decode(), {'encoding': 'base64'}]
        }
        req = urllib.request.Request('https://api.mainnet-beta.solana.com',
            data=json.dumps(payload).encode(),
            headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            return result.get('result')
    except Exception as e:
        log('ERRO SEND: ' + str(e))
        return None

def execute_swap(input_mint, output_mint, amount, symbol):
    log('EXECUTANDO SWAP: ' + symbol)
    
    quote = get_jupiter_quote(input_mint, output_mint, amount)
    if not quote:
        return False
    
    log('QUOTE: ' + str(quote.get('inAmount', 'N/A')) + ' -> ' + str(quote.get('outAmount', 'N/A')))
    
    swap = get_jupiter_swap(quote)
    if not swap or 'swapTransaction' not in swap:
        return False
    
    sig = sign_and_send(swap['swapTransaction'])
    if sig:
        log('TRADE COMPLETO: ' + sig)
        return True
    
    return False

def analyze(symbol):
    candles = get_candles(symbol, '5m', 50)
    if len(candles) < 30:
        return None
    
    closes = [float(c[4]) for c in candles]
    rsi = calc_rsi(closes)
    current = closes[0]
    
    if rsi < 28:
        return {'action': 'BUY', 'confidence': 90, 'rsi': rsi, 'price': current}
    elif rsi > 72:
        return {'action': 'SELL', 'confidence': 85, 'rsi': rsi, 'price': current}
    return None

def run():
    log('AUTO TRADER INICIADO')
    log('Wallet: ' + WALLET)
    
    while True:
        try:
            sol = get_balance()
            tokens = get_tokens()
            log('SOL: ' + str(round(sol, 4)))
            
            for symbol, mint in TOKENS.items():
                signal = analyze(symbol)
                if not signal:
                    continue
                
                if signal['action'] == 'BUY' and sol > 0.01:
                    amount = sol * 0.3 * 1e9
                    execute_swap(SOL_MINT, mint, amount, 'BUY ' + symbol)
                
                elif signal['action'] == 'SELL':
                    for token_mint, amt in tokens.items():
                        if token_mint == mint and amt > 0:
                            execute_swap(mint, SOL_MINT, amt * 1e6, 'SELL ' + symbol)
            
            log('Ciclo completo. Proximo em 60s...')
            time.sleep(60)
            
        except Exception as e:
            log('ERRO: ' + str(e))
            time.sleep(10)

if __name__ == '__main__':
    import base64
    run()
