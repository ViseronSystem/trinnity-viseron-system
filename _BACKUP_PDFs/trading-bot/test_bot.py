import sys
import json
import random
sys.path.insert(0, '.')

from engine.paper import PaperTrader

config = json.load(open('config/bot-config.json'))
trader = PaperTrader(config)

for i in range(5):
    precio = 2000 + random.uniform(-20, 20)
    datos = []
    for j in range(35):
        p = precio + random.uniform(-10, 10)
        datos.append({'open': p, 'high': p+5, 'low': p-5, 'close': p+random.uniform(-3,3), 'volume': random.randint(1000, 50000)})
    ohlcv = {
        'opens': [d['open'] for d in datos],
        'highs': [d['high'] for d in datos],
        'lows': [d['low'] for d in datos],
        'closes': [d['close'] for d in datos],
        'volumes': [d['volume'] for d in datos],
    }
    trader.procesar_tick('XAUUSD', ohlcv)

estado = trader.obtener_estado()
print()
print('ESTADO PAPER TRADING:')
print(f"  Capital: ${estado['capital_actual']:,.2f}")
print(f"  PnL: ${estado['pnl_total']:+,.2f}")
print(f"  Posiciones: {estado['posiciones_abiertas']}")
print(f"  Trades cerrados: {estado['posiciones_cerradas']}")
