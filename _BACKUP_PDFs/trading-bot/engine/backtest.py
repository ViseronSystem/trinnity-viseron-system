"""
Backtesting - Prueba la estrategia con datos históricos
"""
import json
from datetime import datetime
from engine.signals import analizar, TipoSeñal
from engine.risk import GestorRiesgo


def backtest(config: dict, datos_historicos: list[dict]) -> dict:
    """
    Ejecuta un backtest completo con datos históricos.

    Args:
        config: Configuración del bot
        datos_historicos: Lista de dicts con OHLCV por vela

    Returns:
        Resultados del backtest
    """
    gestor = GestorRiesgo(config)
    ventana = 30
    señales_total = 0
    señales_compra = 0
    señales_venta = 0

    print(f"\n[BACKTEST] - {len(datos_historicos)} velas")
    print(f"   Capital inicial: ${config.get('capital', {}).get('inicial', 10000):,.2f}")
    print(f"   Estrategia: {config.get('estrategia', {}).get('nombre', 'Multi-Indicator')}")
    print()

    for i in range(ventana, len(datos_historicos)):
        ventana_datos = datos_historicos[i - ventana:i + 1]
        ohlcv = {
            "opens": [v["open"] for v in ventana_datos],
            "highs": [v["high"] for v in ventana_datos],
            "lows": [v["low"] for v in ventana_datos],
            "closes": [v["close"] for v in ventana_datos],
            "volumes": [v["volume"] for v in ventana_datos],
        }

        precio_actual = ohlcv["closes"][-1]
        gestor.actualizar_posiciones({datos_historicos[i].get("symbol", "UNKNOWN"): precio_actual})
        cerradas = gestor.verificar_cierres()

        señal = analizar(config, ohlcv)
        señales_total += 1

        if señal.tipo == TipoSeñal.COMPRAR:
            señales_compra += 1
            volumen = gestor.calcular_tamano_posicion(señal.precio_entrada, señal.stop_loss)
            if volumen > 0:
                gestor.abrir_posicion(
                    simbolo=datos_historicos[i].get("symbol", "XAUUSD"),
                    lado="compra", volumen=volumen,
                    precio=señal.precio_entrada,
                    stop_loss=señal.stop_loss,
                    take_profit=señal.take_profit
                )
        elif señal.tipo == TipoSeñal.VENDER:
            señales_venta += 1
            volumen = gestor.calcular_tamano_posicion(señal.precio_entrada, señal.stop_loss)
            if volumen > 0:
                gestor.abrir_posicion(
                    simbolo=datos_historicos[i].get("symbol", "XAUUSD"),
                    lado="venta", volumen=volumen,
                    precio=señal.precio_entrada,
                    stop_loss=señal.stop_loss,
                    take_profit=señal.take_profit
                )

    # Cerrar posiciones restantes al último precio
    if datos_historicos:
        ultimo_precio = datos_historicos[-1]["close"]
        for pos in gestor.posiciones:
            if pos.esta_viva:
                pos.precio_actual = ultimo_precio
                pos.esta_viva = False
                gestor.capital_actual += pos.pnl
                gestor.historial.append({
                    "id": pos.id, "simbolo": pos.simbolo, "lado": pos.lado,
                    "volumen": pos.volumen, "precio_entrada": pos.precio_entrada,
                    "precio_salida": ultimo_precio, "pnl": pos.pnl,
                    "pnl_porcentaje": pos.pnl_porcentaje, "razon": "cierre_backtest",
                    "timestamp": datetime.now().isoformat()
                })

    estado = gestor.obtener_estado()
    trades = gestor.historial
    ganadores = [t for t in trades if t["pnl"] > 0]
    perdedores = [t for t in trades if t["pnl"] <= 0]

    resultados = {
        "capital_inicial": estado["capital_inicial"],
        "capital_final": estado["capital_actual"],
        "pnl_total": estado["pnl_total"],
        "pnl_porcentaje": estado["pnl_porcentaje"],
        "drawdown_max": estado["drawdown"],
        "total_trades": len(trades),
        "trades_ganadores": len(ganadores),
        "trades_perdedores": len(perdedores),
        "winrate": len(ganadores) / len(trades) * 100 if trades else 0,
        "ganancia_media": sum(t["pnl"] for t in ganadores) / len(ganadores) if ganadores else 0,
        "perdida_media": sum(t["pnl"] for t in perdedores) / len(perdedores) if perdedores else 0,
        "profit_factor": (
            sum(t["pnl"] for t in ganadores) / abs(sum(t["pnl"] for t in perdedores))
            if perdedores and sum(t["pnl"] for t in perdedores) != 0 else float('inf')
        ),
        "señales_analizadas": señales_total,
        "señales_compra": señales_compra,
        "señales_venta": señales_venta,
    }

    print("=" * 50)
    print("RESULTADOS DEL BACKTEST")
    print("=" * 50)
    print(f"  Capital inicial:    ${resultados['capital_inicial']:>12,.2f}")
    print(f"  Capital final:      ${resultados['capital_final']:>12,.2f}")
    print(f"  PnL total:          ${resultados['pnl_total']:>+12,.2f} ({resultados['pnl_porcentaje']:+.2f}%)")
    print(f"  Drawdown máximo:    {resultados['drawdown_max']:>12.2%}")
    print(f"  Total trades:       {resultados['total_trades']:>12}")
    print(f"  Winrate:            {resultados['winrate']:>12.1f}%")
    print(f"  Profit Factor:      {resultados['profit_factor']:>12.2f}")
    print(f"  Ganancia media:     ${resultados['ganancia_media']:>+12,.2f}")
    print(f"  Pérdida media:      ${resultados['perdida_media']:>+12,.2f}")
    print("=" * 50)

    if resultados["profit_factor"] >= 1.5 and resultados["winrate"] >= 50:
        print("\n[OK] ESTRATEGIA VIABLE - Profit factor y winrate aceptables")
    elif resultados["profit_factor"] >= 1.0:
        print("\n[WARN] ESTRATEGIA MARGINAL - Solo cubre costes, necesita optimizacion")
    else:
        print("\n[FAIL] ESTRATEGIA NO VIABLE - Requiere cambios significativos")

    return resultados
