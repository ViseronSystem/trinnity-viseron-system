"""
Motor de Señales - Indicadores Técnicos
RSI + EMA + MACD + Volumen + ATR
"""
import json
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from enum import Enum


class TipoSeñal(Enum):
    COMPRAR = "COMPRAR"
    VENDER = "VENDER"
    MANTENER = "MANTENER"


@dataclass
class Señal:
    tipo: TipoSeñal
    confianza: float  # 0.0 a 1.0
    precio_entrada: float
    stop_loss: float
    take_profit: float
    indicadores: dict = field(default_factory=dict)
    razones: list = field(default_factory=list)


def calcular_rsi(precios: list[float], periodo: int = 14) -> list[float]:
    """Calcula el RSI (Relative Strength Index)."""
    if len(precios) < periodo + 1:
        return [50.0] * len(precios)

    rsi = [50.0] * periodo
    ganancias = []
    perdidas = []

    for i in range(1, len(precios)):
        cambio = precios[i] - precios[i - 1]
        ganancias.append(max(cambio, 0))
        perdidas.append(max(-cambio, 0))

    for i in range(periodo, len(ganancias)):
        ganancia_avg = sum(ganancias[i - periodo + 1:i + 1]) / periodo
        perdida_avg = sum(perdidas[i - periodo + 1:i + 1]) / periodo
        if perdida_avg == 0:
            rsi.append(100.0)
        else:
            rs = ganancia_avg / perdida_avg
            rsi.append(100 - (100 / (1 + rs)))

    return rsi


def calcular_ema(precios: list[float], periodo: int) -> list[float]:
    """Calcula la EMA (Exponential Moving Average)."""
    if not precios:
        return []
    if len(precios) < periodo:
        return [sum(precios) / len(precios)] * len(precios)

    multiplicador = 2 / (periodo + 1)
    ema = [sum(precios[:periodo]) / periodo]
    for precio in precios[periodo:]:
        ema.append(precio * multiplicador + ema[-1] * (1 - multiplicador))

    return [ema[0]] * periodo + ema[1:] if len(ema) < len(precios) else ema


def calcular_macd(precios: list[float], rapida: int = 12, lenta: int = 26, signal: int = 9):
    """Calcula MACD, línea de señal e histograma."""
    ema_rapida = calcular_ema(precios, rapida)
    ema_lenta = calcular_ema(precios, lenta)

    macd_line = [r - l for r, l in zip(ema_rapida, ema_lenta)]
    signal_line = calcular_ema(macd_line, signal)
    histograma = [m - s for m, s in zip(macd_line, signal_line)]

    return macd_line, signal_line, histograma


def calcular_atr(highs: list[float], lows: list[float], closes: list[float], periodo: int = 14) -> list[float]:
    """Calcula el ATR (Average True Range)."""
    if len(closes) < 2:
        return [0.0] * len(closes)

    tr = [highs[0] - lows[0]]
    for i in range(1, len(closes)):
        tr1 = highs[i] - lows[i]
        tr2 = abs(highs[i] - closes[i - 1])
        tr3 = abs(lows[i] - closes[i - 1])
        tr.append(max(tr1, tr2, tr3))

    atr = [0.0] * (periodo - 1)
    if len(tr) >= periodo:
        atr.append(sum(tr[:periodo]) / periodo)
        for i in range(periodo, len(tr)):
            atr.append((atr[-1] * (periodo - 1) + tr[i]) / periodo)

    return atr


def calcular_volumen_media(volumenes: list[float], periodo: int = 20) -> list[float]:
    """Calcula la media móvil del volumen."""
    if len(volumenes) < periodo:
        return [sum(volumenes) / len(volumenes)] * len(volumenes) if volumenes else []

    media = []
    for i in range(len(volumenes)):
        if i < periodo - 1:
            media.append(sum(volumenes[:i + 1]) / (i + 1))
        else:
            media.append(sum(volumenes[i - periodo + 1:i + 1]) / periodo)
    return media


def detectar_cruce_arriba(linea: list[float], señal: list[float]) -> bool:
    """Detecta si la línea cruzó por encima de la señal."""
    if len(linea) < 2 or len(señal) < 2:
        return False
    return linea[-2] <= señal[-2] and linea[-1] > señal[-1]


def detectar_cruce_abajo(linea: list[float], señal: list[float]) -> bool:
    """Detecta si la línea cruzó por debajo de la señal."""
    if len(linea) < 2 or len(señal) < 2:
        return False
    return linea[-2] >= señal[-2] and linea[-1] < señal[-1]


def analizar(config: dict, ohlcv: dict) -> Señal:
    """
    Analiza datos OHLCV y genera una señal de trading.

    Args:
        config: Configuración de la estrategia
        ohlcv: Datos OHLCV con keys: opens, highs, lows, closes, volumes

    Returns:
        Señal con tipo, confianza, stop_loss, take_profit
    """
    closes = ohlcv.get("closes", [])
    highs = ohlcv.get("highs", [])
    lows = ohlcv.get("lows", [])
    volumes = ohlcv.get("volumes", [])
    precio_actual = closes[-1] if closes else 0

    if len(closes) < 30:
        return Señal(
            tipo=TipoSeñal.MANTENER,
            confianza=0.0,
            precio_entrada=precio_actual,
            stop_loss=0,
            take_profit=0,
            razones=["Datos insuficientes (menos de 30 velas)"]
        )

    cfg_ind = config.get("estrategia", {}).get("indicadores", {})
    cfg_señ = config.get("estrategia", {}).get("señales", {})
    cfg_riesgo = config.get("riesgo", {})

    rsi = calcular_rsi(closes, cfg_ind.get("rsi", {}).get("periodo", 14))
    ema_rapida = calcular_ema(closes, cfg_ind.get("ema_rapida", {}).get("periodo", 12))
    ema_lenta = calcular_ema(closes, cfg_ind.get("ema_lenta", {}).get("periodo", 26))
    macd_line, signal_line, histograma = calcular_macd(
        closes,
        cfg_ind.get("macd", {}).get("rapida", 12),
        cfg_ind.get("macd", {}).get("lenta", 26),
        cfg_ind.get("macd", {}).get("signal", 9)
    )
    atr = calcular_atr(highs, lows, closes, cfg_ind.get("atr", {}).get("periodo", 14))
    vol_media = calcular_volumen_media(volumes)

    # Evaluar señales de compra
    señales_compra = []
    razones_compra = []

    rsi_actual = rsi[-1] if rsi else 50
    if rsi_actual < cfg_señ.get("comprar", {}).get("rsi_debajo", 35):
        señales_compra.append("rsi")
        razones_compra.append(f"RSI {rsi_actual:.1f} < {cfg_señ.get('comprar', {}).get('rsi_debajo', 35)}")

    if detectar_cruce_arriba(ema_rapida, ema_lenta):
        señales_compra.append("ema_cruce")
        razones_compra.append("EMA rápida cruzó por encima de EMA lenta")

    if detectar_cruce_arriba(macd_line, signal_line):
        señales_compra.append("macd_cruce")
        razones_compra.append("MACD cruzó por encima de línea de señal")

    if volumes and vol_media and volumes[-1] > vol_media[-1] * cfg_ind.get("volumen", {}).get("multiplicador", 1.5):
        señales_compra.append("volumen")
        razones_compra.append(f"Volumen {volumes[-1]:.0f} > media {vol_media[-1]:.0f}")

    # Evaluar señales de venta
    señales_venta = []
    razones_venta = []

    if rsi_actual > cfg_señ.get("vender", {}).get("rsi_encima", 65):
        señales_venta.append("rsi")
        razones_venta.append(f"RSI {rsi_actual:.1f} > {cfg_señ.get('vender', {}).get('rsi_encima', 65)}")

    if detectar_cruce_abajo(ema_rapida, ema_lenta):
        señales_venta.append("ema_cruce")
        razones_venta.append("EMA rápida cruzó por debajo de EMA lenta")

    if detectar_cruce_abajo(macd_line, signal_line):
        señales_venta.append("macd_cruce")
        razones_venta.append("MACD cruzó por debajo de línea de señal")

    min_conf = cfg_señ.get("comprar", {}).get("min_confirmaciones", 3)

    atr_actual = atr[-1] if atr else precio_actual * 0.01
    multiplicador_sl = cfg_riesgo.get("stop_loss_atr_multiplicador", 2.0)
    multiplicador_tp = cfg_riesgo.get("take_profit_atr_multiplicador", 3.5)

    if len(señales_compra) >= min_conf:
        confianza = len(señales_compra) / 4
        return Señal(
            tipo=TipoSeñal.COMPRAR,
            confianza=min(confianza, 1.0),
            precio_entrada=precio_actual,
            stop_loss=precio_actual - (atr_actual * multiplicador_sl),
            take_profit=precio_actual + (atr_actual * multiplicador_tp),
            indicadores={"rsi": rsi_actual, "atr": atr_actual, "macd": macd_line[-1]},
            razones=razones_compra
        )

    if len(señales_venta) >= min_conf:
        confianza = len(señales_venta) / 4
        return Señal(
            tipo=TipoSeñal.VENDER,
            confianza=min(confianza, 1.0),
            precio_entrada=precio_actual,
            stop_loss=precio_actual + (atr_actual * multiplicador_sl),
            take_profit=precio_actual - (atr_actual * multiplicador_tp),
            indicadores={"rsi": rsi_actual, "atr": atr_actual, "macd": macd_line[-1]},
            razones=razones_venta
        )

    return Señal(
        tipo=TipoSeñal.MANTENER,
        confianza=0.0,
        precio_entrada=precio_actual,
        stop_loss=0,
        take_profit=0,
        indicadores={"rsi": rsi_actual, "atr": atr_actual, "macd": macd_line[-1]},
        razones=[f"Señales insuficientes: compra={len(señales_compra)}/{min_conf}, venta={len(señales_venta)}/{min_conf}"]
    )
