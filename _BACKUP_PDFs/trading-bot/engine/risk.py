"""
Sistema de Gestión de Riesgo
Position sizing, stop loss, take profit, trailing stop
"""
from dataclasses import dataclass, field
from typing import Optional
import json


@dataclass
class Posicion:
    id: str
    simbolo: str
    lado: str  # "compra" o "venta"
    volumen: float
    precio_entrada: float
    stop_loss: float
    take_profit: float
    trailing_stop: Optional[float] = None
    precio_actual: float = 0.0
    pnl: float = 0.0
    pnl_porcentaje: float = 0.0
    esta_viva: bool = True
    timestamp: str = ""


class GestorRiesgo:
    def __init__(self, config: dict):
        self.max_riesgo_por_trade = config.get("riesgo", {}).get("max_riesgo_por_trade", 0.015)
        self.max_drawdown = config.get("riesgo", {}).get("max_drawdown", 0.10)
        self.max_posiciones = config.get("riesgo", {}).get("max_posiciones_simultaneas", 3)
        self.max_riesgo_total = config.get("riesgo", {}).get("max_riesgo_total", 0.05)
        self.trailing_stop = config.get("riesgo", {}).get("trailing_stop", True)
        self.trailing_stop_atr = config.get("riesgo", {}).get("trailing_stop_atr", 1.5)
        self.capital_inicial = config.get("capital", {}).get("inicial", 10000)

        self.posiciones: list[Posicion] = []
        self.capital_actual = self.capital_inicial
        self.max_capital = self.capital_inicial
        self.historial: list[dict] = []

    def calcular_tamano_posicion(self, precio: float, stop_loss: float) -> float:
        """Calcula el tamaño de la posición basado en el riesgo máximo."""
        if precio <= 0 or stop_loss <= 0:
            return 0

        riesgo_por_unidad = abs(precio - stop_loss)
        if riesgo_por_unidad == 0:
            return 0

        riesgo_maximo = self.capital_actual * self.max_riesgo_por_trade
        tamano = riesgo_maximo / riesgo_por_unidad

        tamano = round(tamano, 4)
        return max(tamano, 0)

    def puede_abrir_posicion(self) -> tuple[bool, str]:
        """Verifica si se puede abrir una nueva posición."""
        posiciones_vivas = [p for p in self.posiciones if p.esta_viva]
        if len(posiciones_vivas) >= self.max_posiciones:
            return False, f"Máximo de posiciones simultáneas alcanzado ({self.max_posiciones})"

        drawdown = (self.max_capital - self.capital_actual) / self.max_capital
        if drawdown >= self.max_drawdown:
            return False, f"Drawdown máximo alcanzado ({drawdown:.1%} >= {self.max_drawdown:.1%})"

        riesgo_total = sum(
            abs(p.precio_entrada - p.stop_loss) * p.volumen
            for p in posiciones_vivas
        )
        if riesgo_total / self.capital_actual >= self.max_riesgo_total:
            return False, f"Riesgo total máximo alcanzado ({riesgo_total / self.capital_actual:.1%})"

        return True, "OK"

    def abrir_posicion(self, simbolo: str, lado: str, volumen: float,
                       precio: float, stop_loss: float, take_profit: float) -> Optional[Posicion]:
        """Abre una nueva posición si el riesgo lo permite."""
        puede, razon = self.puede_abrir_posicion()
        if not puede:
            return None

        if volumen <= 0:
            return None

        posicion = Posicion(
            id=f"pos_{len(self.posiciones) + 1}",
            simbolo=simbolo,
            lado=lado,
            volumen=volumen,
            precio_entrada=precio,
            stop_loss=stop_loss,
            take_profit=take_profit,
            precio_actual=precio,
            timestamp=str(__import__('datetime').datetime.now())
        )
        self.posiciones.append(posicion)
        return posicion

    def actualizar_posiciones(self, precios: dict[str, float]):
        """Actualiza PnL de todas las posiciones abiertas."""
        for pos in self.posiciones:
            if not pos.esta_viva:
                continue

            precio = precios.get(pos.simbolo, pos.precio_actual)
            pos.precio_actual = precio

            if pos.lado == "compra":
                pos.pnl = (precio - pos.precio_entrada) * pos.volumen
            else:
                pos.pnl = (pos.precio_entrada - precio) * pos.volumen

            pos.pnl_porcentaje = pos.pnl / self.capital_actual if self.capital_actual > 0 else 0

            # Trailing stop
            if self.trailing_stop and pos.trailing_stop is not None:
                if pos.lado == "compra" and precio > pos.precio_entrada:
                    nuevo_trailing = precio - (pos.precio_entrada - pos.stop_loss) * self.trailing_stop_atr / 2
                    if nuevo_trailing > pos.trailing_stop:
                        pos.trailing_stop = nuevo_trailing
                elif pos.lado == "venta" and precio < pos.precio_entrada:
                    nuevo_trailing = precio + (pos.stop_loss - pos.precio_entrada) * self.trailing_stop_atr / 2
                    if nuevo_trailing < pos.trailing_stop:
                        pos.trailing_stop = nuevo_trailing

    def verificar_cierres(self) -> list[Posicion]:
        """Verifica si alguna posición debe cerrarse (SL/TP/Trailing)."""
        cerradas = []
        for pos in self.posiciones:
            if not pos.esta_viva:
                continue

            debe_cerrar = False
            razon = ""

            if pos.lado == "compra":
                if pos.precio_actual <= pos.stop_loss:
                    debe_cerrar = True
                    razon = "Stop Loss"
                elif pos.precio_actual >= pos.take_profit:
                    debe_cerrar = True
                    razon = "Take Profit"
                elif pos.trailing_stop and pos.precio_actual <= pos.trailing_stop:
                    debe_cerrar = True
                    razon = "Trailing Stop"
            else:
                if pos.precio_actual >= pos.stop_loss:
                    debe_cerrar = True
                    razon = "Stop Loss"
                elif pos.precio_actual <= pos.take_profit:
                    debe_cerrar = True
                    razon = "Take Profit"
                elif pos.trailing_stop and pos.precio_actual >= pos.trailing_stop:
                    debe_cerrar = True
                    razon = "Trailing Stop"

            if debe_cerrar:
                pos.esta_viva = False
                self.capital_actual += pos.pnl
                self.max_capital = max(self.max_capital, self.capital_actual)
                self.historial.append({
                    "id": pos.id,
                    "simbolo": pos.simbolo,
                    "lado": pos.lado,
                    "volumen": pos.volumen,
                    "precio_entrada": pos.precio_entrada,
                    "precio_salida": pos.precio_actual,
                    "pnl": pos.pnl,
                    "pnl_porcentaje": pos.pnl_porcentaje,
                    "razon": razon,
                    "timestamp": pos.timestamp
                })
                cerradas.append(pos)

        return cerradas

    def obtener_estado(self) -> dict:
        """Retorna el estado actual del gestor de riesgo."""
        posiciones_vivas = [p for p in self.posiciones if p.esta_viva]
        total_pnl = sum(p.pnl for p in self.posiciones if not p.esta_viva)
        drawdown = (self.max_capital - self.capital_actual) / self.max_capital if self.max_capital > 0 else 0

        return {
            "capital_inicial": self.capital_inicial,
            "capital_actual": self.capital_actual,
            "max_capital": self.max_capital,
            "pnl_total": total_pnl,
            "pnl_porcentaje": total_pnl / self.capital_inicial * 100,
            "drawdown": drawdown,
            "posiciones_abiertas": len(posiciones_vivas),
            "posiciones_cerradas": len([p for p in self.posiciones if not p.esta_viva]),
            "trades_ganadores": len([h for h in self.historial if h["pnl"] > 0]),
            "trades_perdedores": len([h for h in self.historial if h["pnl"] <= 0]),
        }

    def guardar_estado(self, archivo: str):
        """Guarda el estado del gestor en un archivo JSON."""
        estado = self.obtener_estado()
        estado["posiciones"] = [
            {
                "id": p.id, "simbolo": p.simbolo, "lado": p.lado,
                "volumen": p.volumen, "precio_entrada": p.precio_entrada,
                "stop_loss": p.stop_loss, "take_profit": p.take_profit,
                "pnl": p.pnl, "esta_viva": p.esta_viva
            }
            for p in self.posiciones
        ]
        estado["historial"] = self.historial
        with open(archivo, "w") as f:
            json.dump(estado, f, indent=2)
