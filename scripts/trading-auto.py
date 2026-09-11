#!/usr/bin/env python3
"""
TVS VISERON — Trading Automatico Agressivo
Monitoriza 24/7 e executa trades automaticamente
"""
import json
import os
import time
import urllib.request
from datetime import datetime

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
WALLET = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'
PRIVATE_KEY = [26,40,37,248,151,195,132,140,228,71,42,231,45,153,87,222,135,6,179,63,106,122,88,43,114,156,240,187,235,151,154,34,144,191,192,78,41,209,63,77,59,137,130,19,169,83,17,51,200,4,37,69,232,144,226,179,12,250,30,121,49,245,154,230]

# Configuracao agressiva
CONFIG = {
    'check_interval': 300,  # 5 min
    'trade_amount_pct': 0.4,  # 40% do saldo por trade
    'take_profit': 0.05,  # 5%
    'stop_loss': -0.03,  # -3%
    'max_positions': 5,
    'min_confidence': 60,
}

# Tokens para trade
TOKENS = {
    'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    'TRUMP': '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    'PUMP': 'pumpCmXqMfrkAkZW23R3Y4Q6FTX7L6V2Q5FJ5tMjVk9',
}

SOL_MINT = 'So11111111111111111111111111111111111111112'

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with open(os.path.join(DATA_DIR, 'auto.log'), 'a') as f:
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

def analyze(symbol):
    try:
        url = f'https://www.okx.com/api/v5/market/candles?instId={symbol}-USDT&bar=15m&limit=30'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            candles = data['data']
            
            closes = [float(c[4]) for c in candles]
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
            
            # EMA
            ema5 = sum(closes[:5]) / 5
            ema20 = sum(closes[:20]) / 20
            
            # MACD
            ema12 = sum(closes[:12]) / 12
            ema26 = sum(closes[:26]) / 26
            macd = ema12 - ema26
            
            # Volume
            volumes = [float(c[5]) for c in candles]
            avg_vol = sum(volumes) / len(volumes)
            vol_ratio = volumes[0] / avg_vol if avg_vol > 0 else 1
            
            return {
                'price': current,
                'rsi': rsi,
                'ema5': ema5,
                'ema20': ema20,
                'macd': macd,
                'vol_ratio': vol_ratio,
            }
    except:
        return None

def generate_signal(symbol):
    a = analyze(symbol)
    if not a:
        return None
    
    signal = {'symbol': symbol, 'action': 'HOLD', 'confidence': 0}
    
    # COMPRA forte
    if a['rsi'] < 30 and a['ema5'] > a['ema20']:
        signal['action'] = 'BUY'
        signal['confidence'] = 90
    elif a['rsi'] < 40 and a['macd'] > 0 and a['vol_ratio'] > 1.5:
        signal['action'] = 'BUY'
        signal['confidence'] = 80
    elif a['rsi'] < 45 and a['ema5'] > a['ema20']:
        signal['action'] = 'BUY'
        signal['confidence'] = 70
    
    # VENDA forte
    elif a['rsi'] > 70 and a['ema5'] < a['ema20']:
        signal['action'] = 'SELL'
        signal['confidence'] = 85
    elif a['rsi'] > 75:
        signal['action'] = 'SELL'
        signal['confidence'] = 75
    
    signal['analysis'] = a
    return signal

def create_swap_transaction(input_mint, output_mint, amount):
    """Cria transacao swap via Jupiter"""
    try:
        # Busca quote
        quote_url = f'https://quote-api.jup.ag/v6/quote?inputMint={input_mint}&outputMint={output_mint}&amount={int(amount)}&slippageBps=100'
        req = urllib.request.Request(quote_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            quote = json.loads(resp.read())
        
        # Busca swap transaction
        swap_url = 'https://quote-api.jup.ag/v6/swap'
        swap_data = json.dumps({
            'quoteResponse': quote,
            'userPublicKey': WALLET,
            'wrapAndUnwrapSol': True,
        }).encode()
        
        req2 = urllib.request.Request(swap_url, data=swap_data,
            headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req2, timeout=15) as resp2:
            swap_result = json.loads(resp2.read())
            return swap_result.get('swapTransaction')
    except Exception as e:
        log(f'ERRO ao criar transacao: {e}')
        return None

def sign_and_send_transaction(tx_base64):
    """Assina e envia transacao"""
    try:
        from solders.keypair import Keypair
        from solders.transaction import VersionedTransaction
        import base64
        
        # Decodifica transacao
        tx_bytes = base64.b64decode(tx_base64)
        tx = VersionedTransaction.from_bytes(tx_bytes)
        
        # Carrega keypair
        keypair = Keypair.from_bytes(bytes(PRIVATE_KEY))
        
        # Assina
        signed_tx = tx.sign([keypair])
        
        # Envia
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
        log(f'ERRO ao assinar/enviar: {e}')
        return None

def execute_trade(signal):
    """Executa um trade automaticamente"""
    symbol = signal['symbol']
    action = signal['action']
    confidence = signal['confidence']
    
    if confidence < CONFIG['min_confidence']:
        return False
    
    sol_balance = get_balance()
    trade_sol = sol_balance * CONFIG['trade_amount_pct']
    
    if trade_sol < 0.001:
        log('Saldo insuficiente para trade')
        return False
    
    if action == 'BUY' and symbol in TOKENS:
        log(f'EXECUTANDO: BUY {symbol} ({trade_sol:.4f} SOL)')
        
        # Cria transacao
        tx = create_swap_transaction(SOL_MINT, TOKENS[symbol], trade_sol * 1e9)
        if tx:
            # Assina e envia
            sig = sign_and_send_transaction(tx)
            if sig:
                log(f'TRADE EXECUTADO: {symbol} | TX: {sig}')
                
                # Regista trade
                trade = {
                    'timestamp': datetime.now().isoformat(),
                    'symbol': symbol,
                    'action': 'BUY',
                    'sol_amount': trade_sol,
                    'price': signal['analysis']['price'],
                    'tx': sig,
                }
                
                trades_file = os.path.join(DATA_DIR, 'executed-trades.json')
                trades = []
                if os.path.exists(trades_file):
                    with open(trades_file) as f:
                        trades = json.load(f)
                trades.append(trade)
                with open(trades_file, 'w') as f:
                    json.dump(trades, f, indent=2)
                
                return True
            else:
                log('ERRO: Falha ao enviar transacao')
        else:
            log('ERRO: Falha ao criar transacao')
    
    elif action == 'SELL':
        # Venda = swap token -> SOL
        tokens = get_tokens()
        for mint, amount in tokens.items():
            if mint in [TOKENS.get(s) for s in [symbol]]:
                log(f'EXECUTANDO: SELL {symbol} ({amount} tokens)')
                tx = create_swap_transaction(mint, SOL_MINT, amount * 1e6)
                if tx:
                    sig = sign_and_send_transaction(tx)
                    if sig:
                        log(f'VENDA EXECUTADA: {symbol} | TX: {sig}')
                        return True
    
    return False

def monitor():
    """Loop principal de monitorizacao"""
    log('=' * 50)
    log('BOT DE TRADING INICIADO')
    log(f'Wallet: {WALLET}')
    log(f'Intervalo: {CONFIG["check_interval"]}s')
    log(f'Capital por trade: {CONFIG["trade_amount_pct"]*100}%')
    log(f'Take Profit: {CONFIG["take_profit"]*100}%')
    log(f'Stop Loss: {CONFIG["stop_loss"]*100}%')
    log('=' * 50)
    
    while True:
        try:
            sol = get_balance()
            log(f'Saldo: {sol:.6f} SOL (${sol * 108:.2f})')
            
            # Analisa todos os tokens
            signals = []
            for symbol in ['SOL'] + list(TOKENS.keys()):
                s = generate_signal(symbol)
                if s and s['action'] != 'HOLD':
                    signals.append(s)
                    log(f'SINAL: {s["action"]} {symbol} ({s["confidence"]}%)')
            
            # Executa sinais fortes
            for s in signals:
                if s['confidence'] >= CONFIG['min_confidence']:
                    execute_trade(s)
            
            # Verifica take profit / stop loss
            tokens = get_tokens()
            for mint, amount in tokens.items():
                for symbol, token_mint in TOKENS.items():
                    if mint == token_mint and amount > 0:
                        price = get_price(symbol)
                        if price:
                            # Verifica se ja temos posicao e precos de entrada
                            trades_file = os.path.join(DATA_DIR, 'executed-trades.json')
                            if os.path.exists(trades_file):
                                with open(trades_file) as f:
                                    trades = json.load(f)
                                
                                for t in trades:
                                    if t['symbol'] == symbol and t['action'] == 'BUY':
                                        entry = t['price']
                                        pnl = (price - entry) / entry
                                        
                                        if pnl >= CONFIG['take_profit']:
                                            log(f'TAKE PROFIT {symbol}: +{pnl*100:.1f}%')
                                            # Vende
                                            sell_signal = {'symbol': symbol, 'action': 'SELL', 'confidence': 95, 'analysis': {'price': price}}
                                            execute_trade(sell_signal)
                                        
                                        elif pnl <= CONFIG['stop_loss']:
                                            log(f'STOP LOSS {symbol}: {pnl*100:.1f}%')
                                            # Vende
                                            sell_signal = {'symbol': symbol, 'action': 'SELL', 'confidence': 95, 'analysis': {'price': price}}
                                            execute_trade(sell_signal)
            
            log(f'Proximo check em {CONFIG["check_interval"]}s...')
            time.sleep(CONFIG['check_interval'])
            
        except KeyboardInterrupt:
            log('BOT INTERROMPIDO PELO UTILIZADOR')
            break
        except Exception as e:
            log(f'ERRO: {e}')
            time.sleep(60)

if __name__ == '__main__':
    monitor()
