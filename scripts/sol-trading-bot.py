#!/usr/bin/env python3
"""
TVS VISERON — SOL Trading Bot (Jupiter DEX)
Opera na Jupiter DEX via Solana
"""
import json
import os
import time
import urllib.request
from datetime import datetime

# ══════ CONFIGURAÇÃO ══════
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "trading")
os.makedirs(DATA_DIR, exist_ok=True)

WALLET_FILE = os.path.join(DATA_DIR, "solana-trading-wallet.json")
TRADES_FILE = os.path.join(DATA_DIR, "solana-trades.json")

# Wallet TVS existente
WALLET_ADDRESS = "Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj"
SEED = "smoke piece enhance gauge oxygen author hybrid next nose worth bean hurt"

# Jupiter API
JUPITER_QUOTE = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP = "https://quote-api.jup.ag/v6/swap"

# Tokens Solana populares
TOKENS = {
    "SOL": "So11111111111111111111111111111111111111112",
    "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "JUP": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "WIF": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    "ORCA": "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    "MNGO": "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
    "SAMO": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
}

def get_sol_price():
    """Busca preco SOL da OKX"""
    try:
        url = "https://www.okx.com/api/v5/market/ticker?instId=SOL-USDT"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return float(data["data"][0]["last"])
    except Exception as e:
        print(f"[ERROR] Preco SOL: {e}")
        return None

def get_token_price(symbol):
    """Busca preco de qualquer token"""
    try:
        url = f"https://www.okx.com/api/v5/market/ticker?instId={symbol}-USDT"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data["data"]:
                return float(data["data"][0]["last"])
    except:
        pass
    return None

def get_jupiter_quote(input_mint, output_mint, amount):
    """Busca quote na Jupiter"""
    try:
        url = f"{JUPITER_QUOTE}?inputMint={input_mint}&outputMint={output_mint}&amount={amount}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"[ERROR] Jupiter Quote: {e}")
        return None

def analyze_market():
    """Analisa mercado SOL"""
    print("\n[ANALISE] Buscando dados de mercado...")
    
    sol_price = get_sol_price()
    if not sol_price:
        print("[ERROR] Nao foi possivel obter preco SOL")
        return None
    
    # Busca precos de tokens populares
    prices = {}
    for symbol in ["SOL", "JUP", "BONK", "WIF", "RAY", "ORCA"]:
        p = get_token_price(symbol)
        if p:
            prices[symbol] = p
    
    print(f"\n[PRECO] SOL: ${sol_price:,.2f}")
    for sym, price in prices.items():
        if sym != "SOL":
            print(f"  {sym}: ${price:,.4f}" if price < 1 else f"  {sym}: ${price:,.2f}")
    
    # Analise de tendencia
    import urllib.request
    try:
        url = "https://www.okx.com/api/v5/market/candles?instId=SOL-USDT&bar=4H&limit=20"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            candles = data["data"]
            
            closes = [float(c[4]) for c in candles]
            ma5 = sum(closes[:5]) / 5
            ma10 = sum(closes[:10]) / 10
            current = closes[0]
            
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
            
            print(f"\n[TECNICO] SOL:")
            print(f"  Preco: ${current:,.2f}")
            print(f"  MA5: ${ma5:,.2f} | MA10: ${ma10:,.2f}")
            print(f"  RSI: {rsi:.1f}")
            
            if ma5 > ma10 and current > ma5:
                tendencia = "UP"
                print("  Tendencia: FORTE ALTA")
            elif ma5 < ma10 and current < ma5:
                tendencia = "DOWN"
                print("  Tendencia: FORTE BAIXA")
            else:
                tendencia = "SIDEWAYS"
                print("  Tendencia: LATERAL")
            
            return {
                "sol_price": sol_price,
                "prices": prices,
                "trend": tendencia,
                "rsi": rsi,
                "ma5": ma5,
                "ma10": ma10,
            }
    except Exception as e:
        print(f"[ERROR] Analise: {e}")
        return {"sol_price": sol_price, "prices": prices}

def generate_signals(analysis):
    """Gera sinais de trading"""
    signals = []
    
    sol_price = analysis["sol_price"]
    rsi = analysis.get("rsi", 50)
    trend = analysis.get("trend", "SIDEWAYS")
    
    # Estrategia SOL
    if rsi < 30:
        signals.append({
            "token": "SOL",
            "action": "BUY",
            "confidence": 85,
            "reason": "RSI oversold",
            "entry": sol_price,
            "stop_loss": sol_price * 0.95,
            "take_profit": sol_price * 1.15,
        })
    elif rsi > 70:
        signals.append({
            "token": "SOL",
            "action": "SELL",
            "confidence": 80,
            "reason": "RSI overbought",
            "entry": sol_price,
        })
    
    # Tokens que vao subir (baseado em analise)
    tokens_analise = {
        "JUP": {"reason": "DEX aggregator, alta demanda", "boost": 10},
        "BONK": {"reason": "Meme coin, momentum", "boost": 5},
        "WIF": {"reason": "Meme coin trending", "boost": 5},
        "RAY": {"reason": "AMM Solana, fundamentos", "boost": 8},
    }
    
    for token, info in tokens_analise.items():
        price = analysis["prices"].get(token)
        if price:
            signals.append({
                "token": token,
                "action": "BUY",
                "confidence": 60 + info["boost"],
                "reason": info["reason"],
                "price": price,
            })
    
    signals.sort(key=lambda x: x["confidence"], reverse=True)
    return signals

def display_signals(signals, sol_price):
    """Mostra sinais formatados"""
    print("\n" + "=" * 60)
    print("  SINAIS DE TRADING SOL")
    print("=" * 60)
    
    for s in signals:
        emoji = "[BUY]" if s["action"] == "BUY" else "[SELL]"
        print(f"\n{emoji} {s['token']} | Confianca: {s['confidence']}%")
        print(f"  Motivo: {s['reason']}")
        if "entry" in s:
            print(f"  Entry: ${s['entry']:,.2f}")
            if "stop_loss" in s:
                print(f"  Stop Loss: ${s['stop_loss']:,.2f}")
            if "take_profit" in s:
                print(f"  Take Profit: ${s['take_profit']:,.2f}")
        elif "price" in s:
            print(f"  Preco atual: ${s['price']:,.4f}" if s['price'] < 1 else f"  Preco atual: ${s['price']:,.2f}")
    
    # Calcula portfolio
    sol_amount = 1.0  # 1 SOL como base
    usd_value = sol_amount * sol_price
    
    print("\n" + "=" * 60)
    print("  PORTFOLIO SUGERIDO")
    print("=" * 60)
    print(f"  Capital: 1 SOL (${usd_value:,.2f})")
    print(f"  Alocacao:")
    
    for s in signals[:3]:
        if s["action"] == "BUY":
            alloc = usd_value * 0.3
            print(f"    {s['token']}: ${alloc:,.2f} ({30}%)")
    
    print(f"    SOL (reserva): ${usd_value * 0.1:,.2f} (10%)")

def main():
    print("=" * 60)
    print("  TVS VISERON — SOL TRADING BOT")
    print("  Jupiter DEX | Solana Mainnet")
    print("=" * 60)
    print(f"\n[WALLET] {WALLET_ADDRESS}")
    
    # Analise de mercado
    analysis = analyze_market()
    if not analysis:
        return
    
    # Gera sinais
    signals = generate_signals(analysis)
    
    # Mostra sinais
    display_signals(signals, analysis["sol_price"])
    
    # Salva
    result = {
        "timestamp": datetime.now().isoformat(),
        "wallet": WALLET_ADDRESS,
        "sol_price": analysis["sol_price"],
        "signals": signals,
    }
    
    with open(TRADES_FILE, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\n[INFO] Sinais guardados em {TRADES_FILE}")
    print("\n[PROXIMO] Para trade real:")
    print("  1. Faca swap SOL -> token na Jupiter: https://jup.ag")
    print("  2. Conecte a Phantom com esta wallet")
    print("  3. Siga os sinais acima")

if __name__ == "__main__":
    main()
