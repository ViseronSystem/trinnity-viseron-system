#!/usr/bin/env python3
"""
TVS VISERON — DEX Trading Bot
Opera em DEXs (Uniswap/PancakeSwap/Jupiter) via Web3
"""
import json
import time
import os
from datetime import datetime
from web3 import Web3
from eth_account import Account

# ══════ CONFIGURAÇÃO ══════
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "trading")
os.makedirs(DATA_DIR, exist_ok=True)

WALLET_FILE = os.path.join(DATA_DIR, "wallet.json")
TRADES_FILE = os.path.join(DATA_DIR, "trades.json")
PORTFOLIO_FILE = os.path.join(DATA_DIR, "portfolio.json")

# Redes suportadas
NETWORKS = {
    "ethereum": {
        "name": "Ethereum Mainnet",
        "rpc": "https://eth.llamarpc.com",
        "chain_id": 1,
        "explorer": "https://etherscan.io",
        "native": "ETH",
        "uniswap_router": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    "bsc": {
        "name": "BNB Smart Chain",
        "rpc": "https://bsc-dataseed.binance.org",
        "chain_id": 56,
        "explorer": "https://bscscan.com",
        "native": "BNB",
        "uniswap_router": "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    },
    "polygon": {
        "name": "Polygon",
        "rpc": "https://polygon-rpc.com",
        "chain_id": 137,
        "explorer": "https://polygonscan.com",
        "native": "MATIC",
        "uniswap_router": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    },
    "base": {
        "name": "Base",
        "rpc": "https://mainnet.base.org",
        "chain_id": 8453,
        "explorer": "https://basescan.org",
        "native": "ETH",
        "uniswap_router": "0x2626664c2603336E57B271c5C0b26F421741e481",
    },
}

# ══════ WALLET ══════
def create_wallet():
    """Cria uma nova wallet"""
    account = Account.create()
    wallet = {
        "address": account.address,
        "private_key": account.key.hex(),
        "created_at": datetime.now().isoformat(),
    }
    with open(WALLET_FILE, "w") as f:
        json.dump(wallet, f, indent=2)
    print(f"[WALLET] Nova wallet criada: {account.address}")
    return wallet

def load_wallet():
    """Carrega wallet existente"""
    if os.path.exists(WALLET_FILE):
        with open(WALLET_FILE) as f:
            return json.load(f)
    return create_wallet()

# ══════ PREÇOS ══════
def get_price_okx(symbol):
    """Busca preço da OKX"""
    import urllib.request
    try:
        url = f"https://www.okx.com/api/v5/market/ticker?instId={symbol}-USDT"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data["data"]:
                return float(data["data"][0]["last"])
    except Exception as e:
        print(f"[ERROR] Preco {symbol}: {e}")
    return None

def get_all_prices():
    """Busca preços de BTC, ETH, SOL"""
    symbols = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "LINK"]
    prices = {}
    for s in symbols:
        p = get_price_okx(s)
        if p:
            prices[s] = p
            print(f"  {s}: ${p:,.2f}")
    return prices

# ══════ ANÁLISE TÉCNICA ══════
def get_candles(symbol, bar="4H", limit=30):
    """Busca velas da OKX"""
    import urllib.request
    try:
        url = f"https://www.okx.com/api/v5/market/candles?instId={symbol}-USDT&bar={bar}&limit={limit}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data["data"]
    except:
        return []

def analyze_trend(candles):
    """Analisa tendência com base nas velas"""
    if len(candles) < 10:
        return {"trend": "unknown", "strength": 0}
    
    closes = [float(c[4]) for c in candles]
    highs = [float(c[2]) for c in candles]
    lows = [float(c[3]) for c in candles]
    
    # Média móvel curta (5) e longa (10)
    ma5 = sum(closes[:5]) / 5
    ma10 = sum(closes[:10]) / 10
    ma20 = sum(closes[:20]) / 20 if len(closes) >= 20 else ma10
    
    current = closes[0]
    prev = closes[1] if len(closes) > 1 else current
    
    # RSI simples
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
    
    # Tendência
    if ma5 > ma10 > ma20 and current > ma5:
        trend = "STRONG_UP"
        strength = 90
    elif ma5 > ma10 and current > ma5:
        trend = "UP"
        strength = 70
    elif ma5 < ma10 < ma20 and current < ma5:
        trend = "STRONG_DOWN"
        strength = 90
    elif ma5 < ma10 and current < ma5:
        trend = "DOWN"
        strength = 70
    else:
        trend = "SIDEWAYS"
        strength = 50
    
    # Suporte/Resistência
    support = min(lows[:10])
    resistance = max(highs[:10])
    
    return {
        "trend": trend,
        "strength": strength,
        "rsi": round(rsi, 1),
        "ma5": round(ma5, 2),
        "ma10": round(ma10, 2),
        "ma20": round(ma20, 2),
        "support": round(support, 2),
        "resistance": round(resistance, 2),
        "current": current,
    }

# ══════ ESTRATÉGIA ══════
def generate_signals(prices):
    """Gera sinais de trading"""
    signals = []
    
    for symbol, price in prices.items():
        candles = get_candles(symbol, "4H", 30)
        if not candles:
            continue
        
        analysis = analyze_trend(candles)
        
        signal = {
            "symbol": symbol,
            "price": price,
            "trend": analysis["trend"],
            "strength": analysis["strength"],
            "rsi": analysis["rsi"],
            "support": analysis["support"],
            "resistance": analysis["resistance"],
            "action": "HOLD",
            "confidence": 0,
        }
        
        # Estratégia de compra
        if analysis["trend"] in ["STRONG_UP", "UP"] and analysis["rsi"] < 70:
            # Preço perto de suporte = boa compra
            distance_to_support = (price - analysis["support"]) / price
            if distance_to_support < 0.03:  # 3% do suporte
                signal["action"] = "BUY"
                signal["confidence"] = min(95, analysis["strength"] + 20)
                signal["entry"] = price
                signal["stop_loss"] = analysis["support"] * 0.98
                signal["take_profit_1"] = analysis["resistance"]
                signal["take_profit_2"] = analysis["resistance"] * 1.1
        
        # Estratégia de venda
        elif analysis["trend"] in ["STRONG_DOWN", "DOWN"] and analysis["rsi"] > 70:
            signal["action"] = "SELL"
            signal["confidence"] = min(95, analysis["strength"] + 15)
        
        # RSI oversold = compra potencial
        elif analysis["rsi"] < 30:
            signal["action"] = "BUY"
            signal["confidence"] = 75
            signal["entry"] = price
            signal["stop_loss"] = price * 0.95
            signal["take_profit_1"] = price * 1.10
        
        signals.append(signal)
    
    # Ordena por confiança
    signals.sort(key=lambda x: x["confidence"], reverse=True)
    return signals

# ══════ PORTFOLIO ══════
def update_portfolio(signals, prices):
    """Atualiza portfolio com base nos sinais"""
    portfolio = {"balance": 100000, "positions": {}, "trades": []}
    
    if os.path.exists(PORTFOLIO_FILE):
        with open(PORTFOLIO_FILE) as f:
            portfolio = json.load(f)
    
    for signal in signals:
        if signal["action"] == "BUY" and signal["confidence"] > 70:
            symbol = signal["symbol"]
            if symbol not in portfolio["positions"]:
                # Aloca 15% do saldo por trade
                allocation = portfolio["balance"] * 0.15
                qty = allocation / signal["price"]
                portfolio["positions"][symbol] = {
                    "qty": qty,
                    "entry_price": signal["price"],
                    "stop_loss": signal.get("stop_loss", signal["price"] * 0.95),
                    "take_profit": signal.get("take_profit_1", signal["price"] * 1.10),
                    "entry_time": datetime.now().isoformat(),
                }
                portfolio["balance"] -= allocation
                
                trade = {
                    "action": "BUY",
                    "symbol": symbol,
                    "qty": round(qty, 6),
                    "price": signal["price"],
                    "total": round(allocation, 2),
                    "time": datetime.now().isoformat(),
                    "confidence": signal["confidence"],
                }
                portfolio["trades"].append(trade)
                print(f"\n[BUY] COMPRA: {qty:.6f} {symbol} @ ${signal['price']:,.2f} (${allocation:,.2f})")
    
    # Verifica stop loss e take profit
    for symbol in list(portfolio["positions"].keys()):
        pos = portfolio["positions"][symbol]
        current_price = prices.get(symbol, pos["entry_price"])
        
        # Stop loss
        if current_price <= pos["stop_loss"]:
            pnl = (current_price - pos["entry_price"]) * pos["qty"]
            portfolio["balance"] += current_price * pos["qty"]
            trade = {
                "action": "STOP_LOSS",
                "symbol": symbol,
                "qty": pos["qty"],
                "price": current_price,
                "pnl": round(pnl, 2),
                "time": datetime.now().isoformat(),
            }
            portfolio["trades"].append(trade)
            del portfolio["positions"][symbol]
            print(f"\n[SELL] STOP LOSS: {symbol} @ ${current_price:,.2f} (PnL: ${pnl:,.2f})")
        
        # Take profit
        elif current_price >= pos["take_profit"]:
            pnl = (current_price - pos["entry_price"]) * pos["qty"]
            portfolio["balance"] += current_price * pos["qty"]
            trade = {
                "action": "TAKE_PROFIT",
                "symbol": symbol,
                "qty": pos["qty"],
                "price": current_price,
                "pnl": round(pnl, 2),
                "time": datetime.now().isoformat(),
            }
            portfolio["trades"].append(trade)
            del portfolio["positions"][symbol]
            print(f"\n[BUY] TAKE PROFIT: {symbol} @ ${current_price:,.2f} (PnL: ${pnl:,.2f})")
    
    # Calcula valor total
    total_value = portfolio["balance"]
    for symbol, pos in portfolio["positions"].items():
        current_price = prices.get(symbol, pos["entry_price"])
        total_value += current_price * pos["qty"]
    
    portfolio["total_value"] = round(total_value, 2)
    portfolio["last_update"] = datetime.now().isoformat()
    
    with open(PORTFOLIO_FILE, "w") as f:
        json.dump(portfolio, f, indent=2)
    
    return portfolio

# ══════ MAIN ══════
def main():
    print("=" * 60)
    print("  TVS VISERON — DEX TRADING BOT")
    print("  ", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)
    
    # Carrega wallet
    wallet = load_wallet()
    print(f"\n[WALLET] {wallet['address']}")
    
    # Busca preços
    print("\n[PRECOS] Buscando precos reais OKX...")
    prices = get_all_prices()
    
    if not prices:
        print("[ERROR] Não foi possível obter preços")
        return
    
    # Análise técnica
    print("\n[ANALISE] Analisando tendencia...")
    signals = generate_signals(prices)
    
    # Mostra sinais
    print("\n[SINAIS] SINAIS DE TRADING:")
    print("-" * 60)
    for s in signals:
        emoji = "[BUY]" if s["action"] == "BUY" else "[SELL]" if s["action"] == "SELL" else "[HOLD]"
        print(f"{emoji} {s['symbol']:6} | {s['action']:4} | Conf: {s['confidence']:3}% | RSI: {s['rsi']:5} | {s['trend']}")
        if s["action"] == "BUY" and "entry" in s:
            print(f"   Entry: ${s['entry']:,.2f} | SL: ${s['stop_loss']:,.2f} | TP: ${s['take_profit_1']:,.2f}")
    
    # Atualiza portfolio
    print("\n[PORTFOLIO] Atualizando portfolio...")
    portfolio = update_portfolio(signals, prices)
    
    print(f"\n{'=' * 60}")
    print(f"  PORTFOLIO STATUS")
    print(f"{'=' * 60}")
    print(f"  Saldo: ${portfolio['balance']:,.2f}")
    print(f"  Valor Total: ${portfolio['total_value']:,.2f}")
    print(f"  Posições: {len(portfolio['positions'])}")
    print(f"  Trades hoje: {len(portfolio['trades'])}")
    
    if portfolio["positions"]:
        print(f"\n  POSIÇÕES ABERTAS:")
        for symbol, pos in portfolio["positions"].items():
            current = prices.get(symbol, pos["entry_price"])
            pnl = (current - pos["entry_price"]) / pos["entry_price"] * 100
            emoji = "[BUY]" if pnl > 0 else "[SELL]"
            print(f"    {emoji} {symbol}: {pos['qty']:.6f} @ ${pos['entry_price']:,.2f} → ${current:,.2f} ({pnl:+.1f}%)")
    
    # Salva trades
    with open(TRADES_FILE, "w") as f:
        json.dump(portfolio["trades"], f, indent=2)
    
    return portfolio

if __name__ == "__main__":
    main()

