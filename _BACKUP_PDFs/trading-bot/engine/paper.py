"""
Modo Paper Trading - Ejecución simulada sin dinero real
"""
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Optional
from engine.signals import analizar, TipoSeñal, Señal
from engine.risk import GestorRiesgo


class PaperTrader:
    def __init__(self, config: dict):
        self.config = config
        self.gestor = GestorRiesgo(config)
        self.archivo_señales = config.get("logging", {}).get("archivo_señales", "logs/señales.csv")
        self.archivo_trades = config.get("logging", {}).get("archivo_trades", "logs/trades.csv")
        self.archivo_resumen = config.get("logging", {}).get("archivo_resumen", "logs/resumen_diario.json")
        self._iniciar_archivos()

    def _iniciar_archivos(self):
        """Crea los archivos CSV si no existen."""
        Path(self.archivo_señales).parent.mkdir(parents=True, exist_ok=True)
        if not Path(self.archivo_señales).exists():
            with open(self.archivo_señales, "w", newline="") as f:
                csv.writer(f).writerow(["timestamp", "simbolo", "señal", "confianza", "precio", "razones"])
        if not Path(self.archivo_trades).exists():
            with open(self.archivo_trades, "w", newline="") as f:
                csv.writer(f).writerow(["timestamp", "id", "simbolo", "lado", "volumen", "entrada", "salida", "pnl", "razon"])

    def procesar_tick(self, simbolo: str, ohlcv: dict) -> Optional[Señal]:
        """Procesa un tick de datos y ejecuta si hay señal."""
        señal = analizar(self.config, ohlcv)

        with open(self.archivo_señales, "a", newline="") as f:
            csv.writer(f).writerow([
                datetime.now().isoformat(), simbolo, señal.tipo.value,
                f"{señal.confianza:.2f}", f"{señal.precio_entrada:.5f}",
                "; ".join(señal.razones)
            ])

        if señal.tipo == TipoSeñal.MANTENER:
            return señal

        self.gestor.actualizar_posiciones({simbolo: señal.precio_entrada})
        cerradas = self.gestor.verificar_cierres()
        for pos in cerradas:
            self._registrar_trade(pos)

        if señal.tipo in (TipoSeñal.COMPRAR, TipoSeñal.VENDER):
            volumen = self.gestor.calcular_tamano_posicion(señal.precio_entrada, señal.stop_loss)
            if volumen > 0:
                lado = "compra" if señal.tipo == TipoSeñal.COMPRAR else "venta"
                pos = self.gestor.abrir_posicion(
                    simbolo=simbolo, lado=lado, volumen=volumen,
                    precio=señal.precio_entrada,
                    stop_loss=señal.stop_loss,
                    take_profit=señal.take_profit
                )
                if pos:
                    print(f"  [PAPER] {lado.upper()} {simbolo}: {volumen} @ {señal.precio_entrada:.5f}")
                    print(f"     SL: {señal.stop_loss:.5f} | TP: {señal.take_profit:.5f}")
                    print(f"     Confianza: {señal.confianza:.0%} | Razones: {', '.join(señal.razones)}")

        return señal

    def _registrar_trade(self, pos):
        """Registra un trade cerrado."""
        with open(self.archivo_trades, "a", newline="") as f:
            csv.writer(f).writerow([
                datetime.now().isoformat(), pos.id, pos.simbolo, pos.lado,
                pos.volumen, f"{pos.precio_entrada:.5f}", f"{pos.precio_actual:.5f}",
                f"{pos.pnl:.2f}", "cierre_automatico"
            ])
        emoji = "+" if pos.pnl > 0 else "-"
        print(f"  [{emoji}] CERRADO {pos.simbolo}: PnL {pos.pnl:+.2f} USD ({pos.pnl_porcentaje:+.2%})")

    def obtener_estado(self) -> dict:
        """Retorna el estado del paper trading."""
        estado = self.gestor.obtener_estado()
        estado["modo"] = "paper"
        return estado

    def guardar_resumen(self):
        """Guarda el resumen diario."""
        estado = self.obtener_estado()
        with open(self.archivo_resumen, "w") as f:
            json.dump(estado, f, indent=2)
