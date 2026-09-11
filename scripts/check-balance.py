#!/usr/bin/env python3
"""Verifica saldo real"""
import json, urllib.request

wallet = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

# Saldo SOL
payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'getBalance', 'params': [wallet]}
req = urllib.request.Request('https://api.mainnet-beta.solana.com',
    data=json.dumps(payload).encode(),
    headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=15) as resp:
    result = json.loads(resp.read())
    sol = result['result']['value'] / 1e9

# Tokens
payload2 = {'jsonrpc': '2.0', 'id': 1, 'method': 'getTokenAccountsByOwner', 'params': [
    wallet,
    {'programId': 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'},
    {'encoding': 'jsonParsed'}
]}
req2 = urllib.request.Request('https://api.mainnet-beta.solana.com',
    data=json.dumps(payload2).encode(),
    headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req2, timeout=15) as resp2:
    result2 = json.loads(resp2.read())
    tokens = {}
    for acc in result2['result']['value']:
        info = acc['account']['data']['parsed']['info']
        mint = info['mint']
        amount = float(info['tokenAmount']['uiAmount'] or 0)
        if amount > 0:
            tokens[mint] = amount

# Precos
prices = {}
for sym in ['SOL', 'JUP', 'RAY', 'WIF']:
    try:
        url = 'https://www.okx.com/api/v5/market/ticker?instId=' + sym + '-USDT'
        req3 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req3, timeout=10) as resp3:
            data = json.loads(resp3.read())
            prices[sym] = float(data['data'][0]['last'])
    except:
        pass

names = {
    'JUPyiwrY': 'JUP',
    '4k3Dyjzv': 'RAY',
    'EKpQGSJt': 'WIF',
    'DezXAZ8z': 'BONK',
    '7oR3jdws': 'VSR',
    'Co7NeuQt': 'TRIN',
    'EPjFWdd5': 'USDC',
}

total = sol * prices.get('SOL', 108)

print('SALDO ATUAL:')
print('  SOL: ' + str(round(sol, 6)) + ' SOL = $' + str(round(sol * prices.get('SOL', 108), 2)))

for mint, amt in tokens.items():
    short = mint[:8]
    name = names.get(short, short)
    if name in prices:
        val = amt * prices[name]
        total += val
        print('  ' + name + ': ' + str(round(amt, 2)) + ' = $' + str(round(val, 2)))

print('')
print('VALOR TOTAL: $' + str(round(total, 2)))
print('INVESTIDO: $6.94')
print('PERDA/GANHO: $' + str(round(total - 6.94, 2)))
