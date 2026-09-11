#!/bin/bash
# TVS VISERON — Setup VPS para Trading Automatico
# Oracle Cloud Free Tier ou qualquer VPS Ubuntu/Debian

echo "=========================================="
echo "  TVS VISERON — AUTO TRADER VPS SETUP"
echo "=========================================="

# 1. Atualiza sistema
echo "[1/6] Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instala Python e dependencias
echo "[2/6] Instalando Python..."
sudo apt install -y python3 python3-pip python3-venv

# 3. Cria diretorio
echo "[3/6] Criando diretorio..."
mkdir -p /opt/tvs-trader
cd /opt/tvs-trader

# 4. Cria virtualenv
echo "[4/6] Configurando ambiente..."
python3 -m venv venv
source venv/bin/activate

# 5. Instala dependencias Python
echo "[5/6] Instalando dependencias..."
pip install solana solders base58 requests

# 6. Cria o bot
echo "[6/6] Criando trading bot..."
cat > trader.py << 'TRADER_EOF'
#!/usr/bin/env python3
"""
TVS VISERON — AUTO TRADER
Trading autonomo 24/7
"""
import json
import os
import time
import requests
from datetime import datetime
from solders.keypair import Keypair
from solders.transaction import VersionedTransaction
import base64

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
    print('[' + ts + '] ' + msg, flush=True)

def get_price(symbol):
    try:
        r = requests.get('https://www.okx.com/api/v5/market/ticker?instId=' + symbol + '-USDT', timeout=5)
        return float(r.json()['data'][0]['last'])
    except:
        return None

def get_candles(symbol, bar='5m', limit=50):
    try:
        r = requests.get('https://www.okx.com/api/v5/market/candles?instId=' + symbol + '-USDT&bar=' + bar + '&limit=' + str(limit), timeout=5)
        return r.json()['data']
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
    r = requests.post('https://api.mainnet-beta.solana.com',
        json={'jsonrpc': '2.0', 'id': 1, 'method': 'getBalance', 'params': [WALLET]})
    return r.json()['result']['value'] / 1e9

def get_tokens():
    r = requests.post('https://api.mainnet-beta.solana.com',
        json={'jsonrpc': '2.0', 'id': 1, 'method': 'getTokenAccountsByOwner', 'params': [
            WALLET,
            {'programId': 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'},
            {'encoding': 'jsonParsed'}
        ]})
    tokens = {}
    for acc in r.json()['result']['value']:
        info = acc['account']['data']['parsed']['info']
        mint = info['mint']
        amount = float(info['tokenAmount']['uiAmount'] or 0)
        if amount > 0:
            tokens[mint] = amount
    return tokens

def execute_swap(input_mint, output_mint, amount, label):
    log('SWAP: ' + label)
    
    # Quote
    try:
        r = requests.get('https://quote-api.jup.ag/v6/quote',
            params={
                'inputMint': input_mint,
                'outputMint': output_mint,
                'amount': str(int(amount)),
                'slippageBps': '100'
            }, timeout=15)
        quote = r.json()
    except Exception as e:
        log('QUOTE ERRO: ' + str(e))
        return False
    
    # Swap transaction
    try:
        r = requests.post('https://quote-api.jup.ag/v6/swap',
            json={
                'quoteResponse': quote,
                'userPublicKey': WALLET,
                'wrapAndUnwrapSol': True,
            }, timeout=15)
        swap_data = r.json()
    except Exception as e:
        log('SWAP ERRO: ' + str(e))
        return False
    
    # Sign and send
    try:
        tx_bytes = base64.b64decode(swap_data['swapTransaction'])
        tx = VersionedTransaction.from_bytes(tx_bytes)
        keypair = Keypair.from_bytes(bytes(PRIVATE_KEY))
        signed_tx = tx.sign([keypair])
        
        r = requests.post('https://api.mainnet-beta.solana.com',
            json={
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'sendTransaction',
                'params': [base64.b64encode(bytes(signed_tx)).decode(), {'encoding': 'base64'}]
            }, timeout=30)
        result = r.json()
        
        if 'result' in result:
            log('TRADE OK: ' + result['result'])
            return True
        else:
            log('SEND ERRO: ' + str(result.get('error', 'unknown')))
            return False
    except Exception as e:
        log('ASSINAR ERRO: ' + str(e))
        return False

def analyze(symbol):
    candles = get_candles(symbol, '5m', 50)
    if len(candles) < 30:
        return None
    closes = [float(c[4]) for c in candles]
    rsi = calc_rsi(closes)
    if rsi < 28:
        return {'action': 'BUY', 'rsi': rsi}
    elif rsi > 72:
        return {'action': 'SELL', 'rsi': rsi}
    return None

def run():
    log('AUTO TRADER INICIADO!')
    log('Wallet: ' + WALLET)
    
    while True:
        try:
            sol = get_balance()
            tokens = get_tokens()
            log('SALDO: ' + str(round(sol, 4)) + ' SOL')
            
            for symbol, mint in TOKENS.items():
                signal = analyze(symbol)
                if not signal:
                    continue
                
                if signal['action'] == 'BUY' and sol > 0.01:
                    amount = sol * 0.3 * 1e9
                    execute_swap(SOL_MINT, mint, amount, 'BUY ' + symbol + ' (RSI ' + str(round(signal['rsi'])) + ')')
                
                elif signal['action'] == 'SELL':
                    for token_mint, amt in tokens.items():
                        if token_mint == mint and amt > 0:
                            execute_swap(mint, SOL_MINT, amt * 1e6, 'SELL ' + symbol + ' (RSI ' + str(round(signal['rsi'])) + ')')
            
            log('Ciclo completo. Proximo em 60s...')
            time.sleep(60)
            
        except Exception as e:
            log('ERRO: ' + str(e))
            time.sleep(10)

if __name__ == '__main__':
    run()
TRADER_EOF

# 7. Cria servico systemd
echo "[7/7] Criando servico..."
sudo tee /etc/systemd/system/tvs-trader.service > /dev/null << EOF
[Unit]
Description=TVS Viseron Auto Trader
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/tvs-trader
ExecStart=/opt/tvs-trader/venv/bin/python trader.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 8. Ativa servico
sudo systemctl daemon-reload
sudo systemctl enable tvs-trader
sudo systemctl start tvs-trader

echo ""
echo "=========================================="
echo "  SETUP COMPLETO!"
echo "=========================================="
echo ""
echo "Para verificar status:"
echo "  sudo systemctl status tvs-trader"
echo ""
echo "Para ver logs:"
echo "  sudo journalctl -u tvs-trader -f"
echo ""
echo "Para parar:"
echo "  sudo systemctl stop tvs-trader"
echo ""
echo "Bot esta a correr 24/7!"
echo "=========================================="
