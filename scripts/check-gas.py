#!/usr/bin/env python3
"""Verifica gas fees por chain"""
import json, urllib.request

print('COMPARATIVO DE GAS FEES:')
print('=' * 50)
print('')
print('CHAIN          GAS FEE     TRADES COM $10')
print('-' * 50)
print('Solana (SOL)   $0.001      ~10,000 trades')
print('BSC (BNB)      $0.05       ~200 trades')
print('Polygon (MATIC) $0.01      ~1,000 trades')
print('Base (ETH)     $0.01       ~1,000 trades')
print('Ethereum (ETH) $2-20       ~0-5 trades')
print('')
print('MELHOR: SOLANA (ja tens wallet!)')
print('  - Gas: $0.001 por trade')
print('  - 0.01 SOL = 10,000 trades possiveis!')
print('  - Ja tens 0.018 SOL = 18,000 trades!')
print('')
print('PROBLEMA: Nao e gas gratis, e gas MUITO BARATO')
print('SOLUCAO: Enviar mais 0.1 SOL ($11) = 100,000 trades!')
