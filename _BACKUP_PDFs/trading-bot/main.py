#!/usr/bin/env python3
"""
TVS Trading Bot v1.0 - Bot de Trading Multi-Mercado
Autor: Pedro Costa (Comandante) + Trinnity Hurtado (Rainha)

Modos: paper | backtest | live
Mercados: Forex/Oro (MT5) | Crypto (Binance) | Acciones US (Alpaca)
"""
import sys
import json
import time
import signal
import argparse
from pathlib import Path
from datetime import datetime

# Agregar directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent))

from engine.signals import analizar, TipoSeñal
from engine.risk import GestorRiesgo
from engine.paper import PaperTrader
from engine.backtest import backtest


def cargar_config(ruta: str = "config/bot-config.json") -> dict:
    """Carga la configuración del bot."""
    ruta_completa = Path(__file__).parent / ruta
    if not ruta_completa.exists():
        print(f"❌ Config no encontrada: {ruta_completa}")
        sys.exit(1)
    with open(ruta_completa) as f:
        return json.load(f)


def simular_datos_ohlcv(precio_base: float = 2000.0, num_velas: int = 100) -> list[dict]:
    """Genera datos OHLCV simulados para testing."""
    import random
    datos = []
    precio = precio_base
    for i in range(num_velas):
        cambio = random.uniform(-0.02, 0.02) * precio
        open_p = precio
        close_p = precio + cambio
        high_p = max(open_p, close_p) + random.uniform(0, abs(cambio) * 0.5)
        low_p = min(open_p, close_p) - random.uniform(0, abs(cambio) * 0.5)
        volume = random.randint(1000, 50000)
        datos.append({
            "time": datetime.now().isoformat(),
            "open": round(open_p, 5),
            "high": round(high_p, 5),
            "low": round(low_p, 5),
            "close": round(close_p, 5),
            "volume": volume,
            "symbol": "XAUUSD"
        })
        precio = close_p
    return datos


def modo_backtest(config: dict):
    """Ejecuta el bot en modo backtest."""
    print("\n[MODO BACKTEST]")
    print("   Generando datos historicos simulados...")
    datos = simular_datos_ohlcv(precio_base=2000.0, num_velas=200)
    print(f"   {len(datos)} velas generadas (XAUUSD simulado)")

    resultados = backtest(config, datos)
    return resultados


def modo_paper(config: dict):
    """Ejecuta el bot en modo paper trading."""
    print("\n[MODO PAPER TRADING]")
    print("   Sin ejecucion real - solo senales simuladas")
    print()

    trader = PaperTrader(config)
    print(f"   Capital: ${config.get('capital', {}).get('inicial', 10000):,.2f}")
    print(f"   Mercados: {list(config.get('mercados', {}).keys())}")
    print(f"   Ctrl+C para salir\n")

    running = True
    def signal_handler(sig, frame):
        nonlocal running
        running = False
        print("\n\nDeteniendo bot...")
    signal.signal(signal.SIGINT, signal_handler)

    tick = 0
    while running:
        tick += 1
        for mercado, cfg_mercado in config.get("mercados", {}).items():
            if not cfg_mercado.get("habilitado", False):
                continue

            for simbolo in cfg_mercado.get("simbolos", []):
                datos = simular_datos_ohlcv(
                    precio_base=2000.0 if "XAU" in simbolo else 50000.0 if "BTC" in simbolo else 100.0,
                    num_velas=50
                )
                ohlcv = {
                    "opens": [d["open"] for d in datos],
                    "highs": [d["high"] for d in datos],
                    "lows": [d["low"] for d in datos],
                    "closes": [d["close"] for d in datos],
                    "volumes": [d["volume"] for d in datos],
                }

                trader.procesar_tick(simbolo, ohlcv)

        if tick % 10 == 0:
            estado = trader.obtener_estado()
            print(f"\n--- Tick {tick} | Capital: ${estado['capital_actual']:,.2f} | "
                  f"PnL: ${estado['pnl_total']:+,.2f} | "
                  f"Posiciones: {estado['posiciones_abiertas']} ---\n")

        time.sleep(2)

    trader.guardar_resumen()
    estado = trader.obtener_estado()
    print("\n" + "=" * 50)
    print("RESUMEN PAPER TRADING")
    print("=" * 50)
    print(f"  Capital final:    ${estado['capital_actual']:>12,.2f}")
    print(f"  PnL total:        ${estado['pnl_total']:>+12,.2f}")
    print(f"  Trades:           {estado['posiciones_cerradas']:>12}")
    print(f"  Winrate:          {estado['trades_ganadores'] / max(estado['posiciones_cerradas'], 1) * 100:>11.1f}%")
    print("=" * 50)


def modo_live(config: dict):
    """Ejecuta el bot en modo live (real)."""
    print("\n[MODO LIVE - DINERO REAL]")
    print("   ADVERTENCIA: Esto ejecutara ordenes reales")
    print()

    confirmacion = input("   Escribe 'CONFIRMO' para continuar: ")
    if confirmacion != "CONFIRMO":
        print("   Cancelado")
        return

    print("   Modo live no implementado aun")
    print("   Usa paper trading primero para validar la estrategia")


def main():
    parser = argparse.ArgumentParser(description="TVS Trading Bot v1.0")
    parser.add_argument("--modo", choices=["paper", "backtest", "live"], default="paper",
                        help="Modo de operación (default: paper)")
    parser.add_argument("--config", default="config/bot-config.json",
                        help="Ruta al archivo de configuración")
    args = parser.parse_args()

    print()
    print("=" * 52)
    print("  TVS TRADING BOT v1.0")
    print("  Multi-Mercado | Multi-Indicador | Risk Management")
    print("  Autor: Pedro Costa + Trinnity Hurtado")
    print("=" * 52)
    print()

    config = cargar_config(args.config)
    print(f"  Configuración: {args.config}")
    print(f"  Modo: {args.modo}")
    print(f"  Mercados: {list(config.get('mercados', {}).keys())}")
    print()

    if args.modo == "backtest":
        modo_backtest(config)
    elif args.modo == "paper":
        modo_paper(config)
    elif args.modo == "live":
        modo_live(config)


if __name__ == "__main__":
    main()
