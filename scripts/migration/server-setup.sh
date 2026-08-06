#!/usr/bin/env bash
# =============================================================================
#  TVS server-setup.sh — Ubuntu 24.04 LTS / Debian 12
#  Instala e sobe o Trinnity Viseron System completo num servidor dedicado:
#    Node 24 · PM2 · Ollama (qwen2.5:3b + 1.5b) · Postgres cloud (Neon) ·
#    reverse proxy nginx + HTTPS · firewall · (opcional) toolchain APK
#
#  USO:
#    sudo ./server-setup.sh                          # instala tudo
#    sudo ./server-setup.sh --domain www.exemplo.io  # + HTTPS para o domínio
#    sudo ./server-setup.sh --no-apk                 # sem Android SDK/JDK
#    sudo ./server-setup.sh --no-ollama              # sem IA local
#    sudo ./server-setup.sh --no-nginx               # sem reverse proxy
#
#  PRÉ-REQUISITO: o pacote de migração (data-snapshot.tar.gz + .env) deve estar
#  na mesma pasta deste script (gerado por scripts/migration/migrate-pack.ps1).
# =============================================================================
set -euo pipefail

# ---- argumentos ----
DOMAIN=""
NO_APK=0
NO_OLLAMA=0
NO_NGINX=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --no-apk) NO_APK=1; shift ;;
    --no-ollama) NO_OLLAMA=1; shift ;;
    --no-nginx) NO_NGINX=1; shift ;;
    *) echo "Argumento desconhecido: $1"; exit 1 ;;
  esac
done

APP_DIR="/opt/tvs"
PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_URL="https://github.com/ViseronSystem/trinnity-viseron-system.git"
BRANCH="${BRANCH:-main}"

say()  { echo -e "\n\033[1;36m[TVS] $1\033[0m"; }
ok()   { echo -e "\033[1;32m  ✓ $1\033[0m"; }
warn() { echo -e "\033[1;33m  ! $1\033[0m"; }

if [[ $EUID -ne 0 ]]; then
  echo "Corre com sudo/root:  sudo $0 $*"
  exit 1
fi

echo ""
echo "══════════════════════════════════════════════════════"
echo "  TRINNITY VISERON SYSTEM — SETUP SERVIDOR DEDICADO"
echo "  ($(. /etc/os-release && echo "$PRETTY_NAME"))"
echo "══════════════════════════════════════════════════════"

# ------------------------------------------------------------------ 1) base
say "1/10 Pacotes base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git unzip build-essential ca-certificates gnupg \
  software-properties-common ufw jq >/dev/null
ok "pacotes base instalados"

# ------------------------------------------------------------------ 2) Node 24
say "2/10 Node.js 24 + PM2"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v24* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
npm install -g pm2 --silent >/dev/null
ok "node $(node -v) · npm $(npm -v) · pm2 $(pm2 -v)"

# ------------------------------------------------------------------ 3) Ollama
if [[ $NO_OLLAMA -eq 0 ]]; then
  say "3/10 Ollama + modelos locais (qwen2.5:3b + 1.5b)"
  if ! command -v ollama >/dev/null 2>&1; then
    curl -fsSL https://ollama.com/install.sh | sh
  fi
  systemctl enable ollama >/dev/null 2>&1 || true
  systemctl restart ollama
  for m in qwen2.5:3b qwen2.5:1.5b; do
    if ! ollama list | grep -q "^${m%%:*}"; then
      echo "  → pull ${m} (a primeira vez demora alguns minutos)"
      ollama pull "$m" >/dev/null
    fi
    ok "modelo $m pronto"
  done
  ok "Ollama em http://localhost:11434"
else
  warn "Ollama SKIP (--no-ollama). A IA local não estará disponível."
fi

# ------------------------------------------------------------------ 4) código
say "4/10 Código fonte (git clone → $APP_DIR)"
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git fetch origin --quiet && git checkout "$BRANCH" --quiet && git pull --ff-only origin "$BRANCH" --quiet || true
  ok "repo atualizado (reuso de $APP_DIR)"
else
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR" --quiet
  ok "repo clonado"
fi
cd "$APP_DIR"

# ------------------------------------------------------------------ 5) dados
say "5/10 Restaurar dados + configuração"
if [[ -f "$PKG_DIR/data-snapshot.tar.gz" ]]; then
  mkdir -p "$APP_DIR/data"
  tar -xzf "$PKG_DIR/data-snapshot.tar.gz" -C "$APP_DIR/data"
  ok "data-snapshot.tar.gz restaurado em $APP_DIR/data"
else
  warn "data-snapshot.tar.gz não encontrado — a começar com data/ vazio."
fi
if [[ -f "$PKG_DIR/.env" ]]; then
  cp -f "$PKG_DIR/.env" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  ok ".env restaurado (chmod 600)"
else
  warn ".env não encontrado — copia-o manualmente para $APP_DIR/.env"
fi
mkdir -p "$APP_DIR/data/logs"

# ------------------------------------------------------------------ 6) dependências + build
say "6/10 npm install + build (pode demorar)"
export PUPPETEER_SKIP_DOWNLOAD=1
cd "$APP_DIR"
npm ci --silent 2>/dev/null || npm install --silent
npm run build >/dev/null
ok "build OK (dist/src)"

# ------------------------------------------------------------------ 7) toolchain APK
if [[ $NO_APK -eq 0 ]]; then
  say "7/10 Toolchain APK (JDK 17 + Android SDK)"
  apt-get install -y -qq openjdk-17-jdk >/dev/null
  export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  if [[ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]]; then
    cd /tmp
    curl -fsSL -o cmdtools.zip "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    unzip -q -o cmdtools.zip -d "$ANDROID_HOME/cmdline-tools"
    mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
    rm -f cmdtools.zip
  fi
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null 2>&1 || true
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --install "platforms;android-35" "build-tools;35.0.0" "platform-tools" >/dev/null 2>&1 || true
  cat > /etc/profile.d/tvs-android.sh <<'EOF'
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
EOF
  ok "Android SDK em $ANDROID_HOME (JDK $(java -version 2>&1 | head -1 | grep -oP 'version \"\K[^\"]+' || true))"
  warn "Build APK:  ./android-build.sh   (dentro de $APP_DIR/mobile)"
else
  warn "Toolchain APK SKIP (--no-apk)"
fi

# ------------------------------------------------------------------ 8) PM2
say "8/10 PM2 — arranque automático (tvs + omniroute)"
cd "$APP_DIR"
pm2 delete tvs >/dev/null 2>&1 || true
pm2 delete omniroute >/dev/null 2>&1 || true
pm2 start node --name tvs --max-old-space-size=8192 -- dist/src/index.js
if [[ "${OMNIROUTE_ENABLED:-0}" == "1" ]] || grep -q "OMNIROUTE_ENABLED=1" .env; then
  pm2 start npx --name omniroute -- --yes omniroute --port 20128 --no-open
fi
pm2 save >/dev/null
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$(whoami)" --hp "$HOME" >/dev/null 2>&1 || true
ok "PM2: tvs + omniroute"

# ------------------------------------------------------------------ 9) firewall
say "9/10 Firewall (UFW)"
ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22/tcp
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null 2>&1 || true
ok "UFW ativo: 22, 80, 443"

# ------------------------------------------------------------------ 10) nginx + HTTPS
if [[ $NO_NGINX -eq 0 ]]; then
  say "10/10 Reverse proxy (nginx) + HTTPS"
  apt-get install -y -qq nginx >/dev/null
  if [[ -n "$DOMAIN" ]]; then
    CONF="/etc/nginx/sites-available/tvs.conf"
    cat > "$CONF" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};
    client_max_body_size 100m;

    location /api/  { proxy_pass http://127.0.0.1:32123; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }
    location /os        { proxy_pass http://127.0.0.1:32123; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }
    location /sites/    { proxy_pass http://127.0.0.1:32123; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; }
    location /socket.io { proxy_pass http://127.0.0.1:32123; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host \$host; }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
    ln -sf "$CONF" /etc/nginx/sites-enabled/tvs.conf
    rm -f /etc/nginx/sites-enabled/default
    nginx -t >/dev/null && systemctl reload nginx
    ok "nginx: http://${DOMAIN} → dashboard 3000 + /api → 32123"

    apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email -m "tvs@${DOMAIN#www.}" --redirect || warn "certbot falhou — corre manualmente: sudo certbot --nginx -d $DOMAIN"
    ok "HTTPS ativo para $DOMAIN"
  else
    warn "Sem --domain: nginx SKIP (corre depois: sudo ./server-setup.sh --domain www.seudominio.io)"
  fi
fi

# ------------------------------------------------------------------ verificação
say "Verificação de saúde"
sleep 20
health() { curl -sf --max-time 5 "http://localhost:$1/$2" >/dev/null 2>&1 && echo "ok" || echo "FALHOU"; }
echo "  /api/health  (32123): $(health 32123 api/health)"
echo "  /api/rcs/status (32123): $(health 32123 api/rcs/status)"
echo "  /api/os/status (32123): $(health 32123 api/os/status)"
if command -v ollama >/dev/null 2>&1; then
  echo "  Ollama: $(curl -sf --max-time 5 http://localhost:11434/api/version >/dev/null 2>&1 && echo ok || echo FALHOU)"
fi

echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✓ SETUP COMPLETO"
echo "  Dashboard:  http://localhost:3000"
echo "  Web API:    http://localhost:32123/api/health"
if [[ -n "$DOMAIN" ]]; then echo "  Público:    https://$DOMAIN"; fi
echo "  Gestão:     ./tvs-run.sh status | restart | logs"
echo "  APK:        $APP_DIR/mobile/android-build.sh (Linux) ou app:create"
echo ""
echo "  PRÓXIMOS PASSOS:"
echo "  1. Edita $APP_DIR/.env → TVS_PUBLIC_URL=https://$DOMAIN (ou http://IP)"
echo "  2. pm2 restart tvs"
echo "  3. (Para substituir o Render) aponta o DNS do domínio para o IP deste servidor."
echo "══════════════════════════════════════════════════════"
