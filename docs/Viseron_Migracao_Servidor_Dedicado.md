# VISERON — Migración a Servidor Dedicado / Migração para Servidor Dedicado / Dedicated Server Migration

**TVS v5.0 · Trinnity Viseron System** — Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)

> Documento trilingue · Trilingual document · Documento trilingüe (ES · PT · EN)

---

## Resumen / Resumo / Overview

El sistema completo (API + web + JARVIS + IA local Ollama + agentes + TVS OS + builds APK) se instala en un servidor dedicado. El código ya está en GitHub (`ViseronSystem/trinnity-viseron-system`); solo se transportan **datos de estado** (`data/`) y **segredos** (`.env`), que genera el paquete de migración.

O sistema completo (API + web + JARVIS + IA local Ollama + agentes + TVS OS + builds APK) instala-se num servidor dedicado. O código já está no GitHub (`ViseronSystem/trinnity-viseron-system`); só se transportam **dados de estado** (`data/`) e **segredos** (`.env`), gerados pelo pacote de migração.

The full system (API + web + JARVIS + local AI Ollama + agents + TVS OS + APK builds) is installed on a dedicated server. The code is already on GitHub (`ViseronSystem/trinnity-viseron-system`); only **state data** (`data/`) and **secrets** (`.env`) are carried over, produced by the migration package.

| Componente | Tamaño / Size | Origen / Source |
|---|---|---|
| Código / Code | ~568 ficheiros | GitHub (git clone) |
| Datos / Data | ~8 MB | `data-snapshot.tar.gz` |
| Segredos / Secrets | ~2 KB | `.env` |
| node_modules | ~353 MB | `npm install` (regenerable) |
| Ollama qwen2.5:3b+1.5b | ~3 GB | `ollama pull` (descarga en el server) |
| Postgres | cloud (Neon) | ya en `DATABASE_URL` (no cambia) |

---

## 1. En la máquina actual / Na máquina atual / On the current machine (Windows)

Genera el paquete (datos + .env + scripts + runbook):
Gera o pacote (dados + .env + scripts + runbook):
Generate the package (data + .env + scripts + runbook):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\migration\migrate-pack.ps1
```

Resultado: carpeta `migracao/` / pasta `migracao/` / folder `migracao/`:
- `data-snapshot.tar.gz` — estado real (cuentas, mensajes, knowledge, agency, PDFs, minds…)
- `.env` — **CONFIDENCIAL / CONFIDENTIAL** (no subas este archivo a GitHub / não subas para o GitHub)
- `server-setup.sh`, `server-setup.ps1`, `android-build.sh`, `tvs-run.sh`, `RUNBOOK_MIGRACAO.md`, `CHECKSUMS.txt`

Transfiere la carpeta al servidor:
Transfere a pasta para o servidor:
Transfer the folder to the server:

```bash
scp -r migracao user@SERVIDOR:/home/user/
# o en Windows PowerShell:  scp -r migracao user@SERVIDOR:/home/user/
```

---

## 2. Ubuntu 24.04 LTS / Debian 12 (ruta principal / caminho principal / main path)

### 2.1 Primer acceso / Primeiro acesso / First login

```bash
ssh user@SERVIDOR
sudo apt update && sudo apt upgrade -y
```

### 2.2 Verificar integridad / Verificar integridade / Verify integrity

```bash
cd ~/migracao
sha256sum -c CHECKSUMS.txt
```

### 2.3 Instalar todo / Instalar tudo / Install everything

```bash
chmod +x server-setup.sh
sudo ./server-setup.sh --domain www.trinnityviseronsystem.io
```

Opciones / Opções / Options:
- `--no-apk` → sin Android SDK/JDK / sem toolchain APK (más rápido / faster)
- `--no-ollama` → sin IA local / sem IA local
- `--no-nginx` → sin reverse proxy (ya tienes otro proxy)

El script (idempotente, repetible) instala: Node 24, PM2, Ollama + modelos, clona el repo en `/opt/tvs`, restaura `data/` + `.env`, `npm ci && npm run build`, arranca PM2 (`tvs` en 3000+32123, `omniroute` en 20128), firewall UFW y nginx+HTTPS (Let's Encrypt) si pasas `--domain`.

O script (idempotente, repetível) instala: Node 24, PM2, Ollama + modelos, clona o repo em `/opt/tvs`, restaura `data/` + `.env`, `npm ci && npm run build`, arranca PM2 (`tvs` em 3000+32123, `omniroute` em 20128), firewall UFW e nginx+HTTPS (Let's Encrypt) se passares `--domain`.

### 2.4 Verificar / Verificar / Verify

```bash
./tvs-run.sh status          # pm2 + saúde (health/ollama)
curl http://localhost:32123/api/health
curl http://localhost:32123/api/rcs/status
```

- Dashboard: `http://localhost:3000`
- Web API: `http://localhost:32123`
- Público (con --domain): `https://www.trinnityviseronsystem.io`

### 2.5 Ajustar .env en el servidor / Ajustar .env no servidor / Tune .env on server

```bash
sudo nano /opt/tvs/.env
# TVS_PUBLIC_URL=https://www.trinnityviseronsystem.io
# PUBLIC_HOSTNAME=www.trinnityviseronsystem.io
sudo pm2 restart tvs
```

### 2.6 Build de APK (opcional) / Build APK (opcional)

```bash
cd /opt/tvs
./mobile/android-build.sh            # app principal
./mobile/android-build.sh derecho-internacional   # app de la factory
```

---

## 3. Debian 12

Idéntico al Ubuntu 24.04 — usa el mismo `server-setup.sh` (el script detecta la distro y usa `apt`). La única diferencia: confirma que el kernel incluye la gestión de paquetes esperada (todas las dependencias están en los repos de Debian).

Idêntico ao Ubuntu 24.04 — usa o mesmo `server-setup.sh` (o script deteta a distro e usa `apt`). A única diferença: confirma que o kernel inclui a gestão de pacotes esperada (todas as dependências estão nos repositórios do Debian).

Same as Ubuntu 24.04 — use the same `server-setup.sh` (it detects the distro and uses `apt`).

---

## 4. Windows Server 2019/2022

```powershell
cd migracao
powershell -ExecutionPolicy Bypass -File .\server-setup.ps1
# con toolchain APK:
powershell -ExecutionPolicy Bypass -File .\server-setup.ps1 -AndroidSDK
```

El script instala Node 24 (MSI), Git, PM2, Ollama + modelos, clona el repo en `C:\tvs`, restaura `data/` + `.env`, `npm ci && npm run build`, arranca PM2 y crea una **tarea programada (Task Scheduler)** para arrancar al boot, más reglas de firewall 3000/32123.

O script instala Node 24 (MSI), Git, PM2, Ollama + modelos, clona o repo em `C:\tvs`, restaura `data/` + `.env`, `npm ci && npm run build`, arranca PM2 e cria uma **tarefa agendada (Task Scheduler)** para arrancar no boot, mais regras de firewall 3000/32123.

---

## 5. Después de la migración / Depois da migração / After migration

### 5.1 Reemplazar Render / Substituir o Render / Replace Render (cuando decidas / quando decidires / when you decide)

1. Registra un `A` record para `www` (y `@`) → **IP del servidor dedicado** en Cloudflare.
2. HTTPS ya está activo (certbot `--nginx` o el proxy que uses).
3. Si aún no usas dominio: `TVS_PUBLIC_URL=http://<IP>` (RCS/webhooks dependerán de que el dominio apunte al server).

### 5.2 Backup automático / Backup automático / Automatic backup

```bash
# Linux — cron diario
crontab -e
0 2 * * * cd /opt/tvs && git pull --ff-only origin main && npm run build && pm2 restart tvs >> /opt/tvs/data/backup-cron.log 2>&1
```

### 5.3 Actualizar el sistema / Atualizar o sistema / Update the system

```bash
cd /opt/tvs
git pull --ff-only origin main
npm ci && npm run build
pm2 restart tvs omniroute --update-env
```

---

## 6. Verificación final / Verificação final / Final checklist

- [ ] `curl http://localhost:32123/api/health` → `ok`
- [ ] `curl http://localhost:32123/api/rcs/status` → canal RCS con logo
- [ ] `curl http://localhost:3000/api/agents` → agentes activos
- [ ] Ollama: `curl http://localhost:11434/api/version` → `ok`
- [ ] JARVIS responde (post `/api/jarvis/chat`)
- [ ] Billing/Avirato y webhooks apuntan al nuevo dominio
- [ ] Backup del servidor activo

---

## Propiedad / Propriedade / Ownership

© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha) — Trinnity Viseron System. Decisões finais sobre arquitetura, domínio e receita pertencem aos comandantes. Todo artefacto mantém esta autoria.
