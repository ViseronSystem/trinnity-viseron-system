#!/usr/bin/env python3
"""Testa Jupiter API"""
import json, urllib.request

# Testa Jupiter API
try:
    url = 'https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN&amount=10000000&slippageBps=100'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        quote = json.loads(resp.read())
        print('JUPITER API: OK')
        print('Quote:', quote.get('inAmount', 0), 'SOL ->', quote.get('outAmount', 0), 'JUP')
except Exception as e:
    print('JUPITER API: ERRO -', e)
