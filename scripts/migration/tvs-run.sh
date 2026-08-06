#!/usr/bin/env bash
# tvs-run.sh — gestão do processo TVS no servidor (via PM2).
#   ./tvs-run.sh status    -> estado dos processos + saúde
#   ./tvs-run.sh restart   -> reinício à prova de congelamento (tvs + omniroute)
#   ./tvs-run.sh stop      -> para tudo
#   ./tvs-run.sh start     -> arranca tudo
#   ./tvs-run.sh logs      -> segue os logs do tvs
#   ./tvs-run.sh logs:o    -> segue os logs do omniroute
set -euo pipefail
CMD="${1:-status}"
case "$CMD" in
  status)
    pm2 list
    echo "--- saúde ---"
    echo "  /api/health (32123): $(curl -sf --max-time 5 http://localhost:32123/api/health >/dev/null 2>&1 && echo ok || echo FALHOU)"
    echo "  dashboard  (3000):   $(curl -sf --max-time 5 http://localhost:3000/api/health >/dev/null 2>&1 && echo ok || echo FALHOU)"
    echo "  ollama:              $(curl -sf --max-time 5 http://localhost:11434/api/version >/dev/null 2>&1 && echo ok || echo FALHOU)"
    ;;
  restart)
    pm2 restart tvs omniroute --update-env
    sleep 20
    pm2 status
    echo "  health: $(curl -sf --max-time 8 http://localhost:32123/api/health >/dev/null 2>&1 && echo ok || echo FALHOU)"
    ;;
  stop)  pm2 stop tvs omniroute ;;
  start) pm2 start tvs omniroute ;;
  logs)  pm2 logs tvs --lines 50 ;;
  logs:o) pm2 logs omniroute --lines 50 ;;
  *) echo "uso: $0 status|restart|stop|start|logs|logs:o"; exit 1 ;;
esac
