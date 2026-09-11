# TVS Trading Bot v1.0

Bot de Trading Multi-Mercado con Gestión de Riesgo Avanzada.

**Autor:** Pedro Costa (Comandante) + Trinnity Hurtado (Rainha)

## Características

- **Multi-mercado:** Forex/Oro (MT5), Crypto (Binance), Acciones US (Alpaca)
- **Indicadores:** RSI, EMA, MACD, Volumen, ATR
- **Risk Management:** Stop Loss, Take Profit, Trailing Stop, Position Sizing
- **Modos:** Paper Trading, Backtest, Live (próximamente)
- **Gestión de riesgo:** Max 1.5% por trade, Max 10% drawdown, Max 3 posiciones

## Instalación

```bash
cd trading-bot
pip install -r requirements.txt  # (próximamente)
```

## Uso

### Backtest (probar estrategia)
```bash
python main.py --modo backtest
```

### Paper Trading (simulación)
```bash
python main.py --modo paper
```

### Live (dinero real - solo cuando estés listo)
```bash
python main.py --modo live
```

## Configuración

Edita `config/bot-config.json` para cambiar:
- Mercados habilitados
- Parámetros de indicadores
- Límites de riesgo
- Capital inicial

## Estructura

```
trading-bot/
├── main.py              # Punto de entrada
├── config/
│   └── bot-config.json  # Configuración
├── engine/
│   ├── signals.py       # Motor de señales (RSI/EMA/MACD)
│   ├── risk.py          # Gestión de riesgo
│   ├── paper.py         # Paper trading
│   └── backtest.py      # Backtesting
├── logs/                # Logs de señales y trades
└── data/                # Datos históricos
```

## Risk Management

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Max riesgo/trade | 1.5% | Máximo del capital por operación |
| Max drawdown | 10% | Detiene el bot si pierde 10% |
| Max posiciones | 3 | Posiciones abiertas simultáneas |
| Stop Loss | 2.0 ATR | Pérdida máxima por trade |
| Take Profit | 3.5 ATR | Ganancia objetivo |
| Trailing Stop | 1.5 ATR | Sigue tendencia y protege ganancias |

## Notas Importantes

1. **Empieza con paper trading** - Nunca uses dinero real sin probar primero
2. **Backtest primero** - Valida la estrategia antes de cualquier trade
3. **No hay garantías** - Ningún bot garantiza ganancias
4. **Gestión de riesgo** - El bot protege tu capital con límites estrictos
