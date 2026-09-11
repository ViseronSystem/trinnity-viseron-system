# ============================================================
# VISERON™ DEPLOY RÁPIDO — 15 MINUTOS
# Executar TUDO no servidor via RDP ou SSH
# © Pedro Costa · Trinnity Hurtado — VISERON™
# ============================================================

$ErrorActionPreference = "Stop"
$VISERON_HOME = "C:\viseron"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  VISERON™ Deploy Rapido v8.0" -ForegroundColor Cyan
Write-Host "  Tempo estimado: 10-15 minutos" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── FASE 1: Node.js 22 ─────────────────────────────────
Write-Host "[1/6] Node.js 22..." -ForegroundColor Yellow
try { $nv = & node --version 2>$null; if ($nv -match "v2") { Write-Host "  OK: $nv" -ForegroundColor Green } else { throw "" } } catch {
    Write-Host "  Instalando..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v22.18.0/node-v22.18.0-x64.msi" -OutFile "$env:TEMP\node.msi" -UseBasicParsing
    Start-Process msiexec.exe -Wait -ArgumentList "/i $env:TEMP\node.msi /quiet /norestart"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "  Instalado" -ForegroundColor Green
}

# ── FASE 2: Ollama + Modelos ───────────────────────────
Write-Host "[2/6] Ollama..." -ForegroundColor Yellow
try { & ollama --version 2>$null | Out-Null; Write-Host "  OK" -ForegroundColor Green } catch {
    Write-Host "  Instalando..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile "$env:TEMP\ollama.exe" -UseBasicParsing
    Start-Process "$env:TEMP\ollama.exe" -Wait -ArgumentList "/S"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "  Instalado" -ForegroundColor Green
}
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden -ErrorAction SilentlyContinue
Start-Sleep 3
Write-Host "  Baixando modelos (3b + minilm)..." -ForegroundColor Gray
& ollama pull qwen2.5:3b 2>$null
& ollama pull all-minilm:l6-v2 2>$null
Write-Host "  Modelos prontos" -ForegroundColor Green

# ── FASE 3: PostgreSQL ─────────────────────────────────
Write-Host "[3/6] PostgreSQL 16..." -ForegroundColor Yellow
try { & psql --version 2>$null | Out-Null; Write-Host "  OK" -ForegroundColor Green } catch {
    Write-Host "  Instalando..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://get.enterprisedb.com/postgresql/postgresql-16.8-1-windows-x64.exe" -OutFile "$env:TEMP\pg.exe" -UseBasicParsing
    Start-Process "$env:TEMP\pg.exe" -Wait -ArgumentList "--mode unattended --superpassword viseron2026 --serverport 5432"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "  Instalado" -ForegroundColor Green
}
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
& "$pgBin\psql.exe" -U postgres -c "CREATE DATABASE viseron;" 2>$null
& "$pgBin\psql.exe" -U postgres -d viseron -c "CREATE TABLE IF NOT EXISTS users (id VARCHAR(64) PRIMARY KEY, email VARCHAR(255), name VARCHAR(255), plan VARCHAR(32) DEFAULT 'free', created_at TIMESTAMP DEFAULT NOW()); CREATE TABLE IF NOT EXISTS usage_events (id SERIAL PRIMARY KEY, user_id VARCHAR(64), event_type VARCHAR(64), tokens_in INT DEFAULT 0, cost_usd DECIMAL(10,6) DEFAULT 0, created_at TIMESTAMP DEFAULT NOW()); CREATE TABLE IF NOT EXISTS conversations (id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64), role VARCHAR(16), content TEXT, created_at TIMESTAMP DEFAULT NOW());" 2>$null
Write-Host "  Banco criado" -ForegroundColor Green

# ── FASE 4: Qdrant ─────────────────────────────────────
Write-Host "[4/6] Qdrant..." -ForegroundColor Yellow
try { $q = Invoke-WebRequest -Uri "http://localhost:6333/healthz" -UseBasicParsing -TimeoutSec 3; Write-Host "  OK" -ForegroundColor Green } catch {
    Write-Host "  Baixando..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-pc-windows-msvc.zip" -OutFile "$env:TEMP\qdrant.zip" -UseBasicParsing
    Expand-Archive -Path "$env:TEMP\qdrant.zip" -DestinationPath "C:\viseron\bin\qdrant" -Force
    $qe = Get-ChildItem "C:\viseron\bin\qdrant" -Recurse -Filter "qdrant.exe" | Select-Object -First 1
    if ($qe) { Start-Process $qe.FullName -WindowStyle Hidden }
    Start-Sleep 5
    Write-Host "  Instalado" -ForegroundColor Green
}

# ── FASE 5: Firewall + .env ────────────────────────────
Write-Host "[5/6] Config..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "VISERON" -Direction Inbound -Protocol TCP -LocalPort 32123 -Action Allow 2>$null
New-Item -ItemType Directory -Force -Path $VISERON_HOME | Out-Null
New-Item -ItemType Directory -Force -Path "$VISERON_HOME\data" | Out-Null

$jwt = [guid]::NewGuid().ToString()
@"
NODE_ENV=production
PORT=32123
HOST=0.0.0.0
VISERON_HOME=$VISERON_HOME
DATA_DIR=$VISERON_HOME\data
OLLAMA_HOST=http://localhost:11434
DATABASE_URL=postgresql://postgres:viseron2026@localhost:5432/viseron
QDRANT_URL=http://localhost:6333
TVS_JWT_SECRET=$jwt
TVS_PUBLIC_URL=http://localhost:32123
"@ | Set-Content "$VISERON_HOME\.env" -Encoding UTF8
Write-Host "  Config pronta" -ForegroundColor Green

# ── FASE 6: Task Scheduler ─────────────────────────────
Write-Host "[6/6] Auto-start..." -ForegroundColor Yellow
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File C:\viseron\start-viseron.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "VISERON-AutoStart" -Action $action -Trigger $trigger -Settings $settings -Force 2>$null
Write-Host "  Auto-start configurado" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  BASE PRONTA!" -ForegroundColor Green
Write-Host "  Proximo: extrair codigo em C:\viseron" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
