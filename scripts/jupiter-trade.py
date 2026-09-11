#!/usr/bin/env python3
"""
TVS VISERON — Execute Trade na Jupiter
"""
import json
import os
import urllib.request
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'

# Wallet TVS
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'

# Tokens
SOL_MINT = 'So11111111111111111111111111111111111111112'
JUP_MINT = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
RAY_MINT = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'

def get_balance():
    """Verifica saldo SOL"""
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'getBalance', 'params': [WALLET]}
    req = urllib.request.Request('https://api.mainnet-beta.solana.com',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        return result['result']['value'] / 1e9

def get_quote(input_mint, output_mint, amount_lamports):
    """Busca quote na Jupiter"""
    url = f'https://quote-api.jup.ag/v6/quote?inputMint={input_mint}&outputMint={output_mint}&amount={amount_lamports}&slippageBps=100'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def main():
    print('=' * 60)
    print('  TVS VISERON — EXECUTAR TRADE JUPITER')
    print('=' * 60)
    
    # Verifica saldo
    balance = get_balance()
    print(f'\nWALLET: {WALLET}')
    print(f'Saldo: {balance:.6f} SOL (${balance * 109:.2f})')
    
    if balance < 0.01:
        print('SALDO INSUFICIENTE!')
        return
    
    # Trade: 50% do saldo para JUP
    trade_amount = balance * 0.5
    trade_lamports = int(trade_amount * 1e9)
    
    print(f'\n[TRADE] {trade_amount:.6f} SOL -> JUP')
    
    # Busca quote
    print('[JUPITER] Buscando melhor rota...')
    try:
        quote = get_quote(SOL_MINT, JUP_MINT, trade_lamports)
        
        input_amount = int(quote.get('inAmount', 0))
        output_amount = int(quote.get('outAmount', 0))
        price_impact = quote.get('priceImpactPct', 0)
        
        print(f'  Input: {input_amount / 1e9:.6f} SOL')
        print(f'  Output: {output_amount / 1e6:.2f} JUP')
        print(f'  Price Impact: {price_impact}%')
        
        # Salva quote
        with open(os.path.join(DATA_DIR, 'jupiter-quote-sol-jup.json'), 'w') as f:
            json.dump(quote, f, indent=2)
        
        print('\n[OK] Quote obtida com sucesso!')
        print('\n[PROXIMO] Para executar o trade:')
        print('  1. Abra https://jup.ag')
        print('  2. Conecte a Phantom')
        print('  3. Faca swap manualmente')
        print(f'  4. Ou use a quote guardada em data/trading/')
        
        # Mostra resumo
        print('\n' + '=' * 60)
        print('  RESUMO DO TRADE')
        print('=' * 60)
        print(f'  De: {trade_amount:.6f} SOL')
        print(f'  Para: ~{output_amount / 1e6:.2f} JUP')
        print(f'  Valor USD: ~${trade_amount * 109:.2f}')
        print(f'  Taxa Jupiter: 0.25%')
        
    except Exception as e:
        print(f'[ERROR] Jupiter: {e}')
        return

if __name__ == '__main__':
    main()
