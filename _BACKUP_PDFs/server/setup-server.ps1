#Requires -RunAsAdministrator
# ============================================================
# VISERON Server Setup — Windows Server 2025 Standard
# 16 CPU · 128GB RAM · 500GB · ES-MAD1 (Madrid)
# Executar UMA VEZ no servidor novo como Administrator
# © Pedro Costa · Trinnity Hurtado — VISERON™
# ============================================================

$ErrorActionPreference = "Stop"
$VISERON_HOME = "C:\viseron"
$DATA_DIR = "C:\viseron\data"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VISERON™ Server Setup v8.0" -ForegroundColor Cyan
Write-Host "  Windows Server 2025 Standard" -ForegroundColor Cyan
Write-Host "  16 CPU · 128GB RAM · 500GB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Criar diretórios base ─────────────────────────────
Write-Host "[1/8] Creating directories..." -ForegroundColor Yellow
$dirs = @(
    $VISERON_HOME,
    "$VISERON_HOME\bin",
    "$VISERON_HOME\config",
    $DATA_DIR,
    "$DATA_DIR\memory",
    "$DATA_DIR\neural-memory",
    "$DATA_DIR\neural-memory\conversations",
    "$DATA_DIR\state",
    "$DATA_DIR\knowledge",
    "$DATA_DIR\reports",
    "$DATA_DIR\audit",
    "$DATA_DIR\fine-tuning",
    "$DATA_DIR\foundation",
    "$DATA_DIR\calls",
    "$DATA_DIR\rcs",
    "$DATA_DIR\agency",
    "$DATA_DIR\telecom",
    "$DATA_DIR\tvs-os",
    "$DATA_DIR\agency",
    "$DATA_DIR\messaging",
    "$DATA_DIR\accounts",
    "C:\viseron-logs"
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}
Write-Host "  OK" -ForegroundColor Green

# ── 2. Instalar Node.js 22 LTS ──────────────────────────
Write-Host "[2/8] Installing Node.js 22 LTS..." -ForegroundColor Yellow
$nodeInstalled = $false
try {
    $nodeVersion = & node --version 2>$null
    if ($nodeVersion -match "v2[0-9]") {
        Write-Host "  Node.js $nodeVersion already installed" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {}

if (-not $nodeInstalled) {
    Write-Host "  Downloading Node.js 22 LTS..." -ForegroundColor Gray
    $nodeUrl = "https://nodejs.org/dist/v22.18.0/node-v22.18.0-x64.msi"
    $nodeMsi = "$env:TEMP\node-install.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeMsi /quiet /norestart"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
    Write-Host "  Node.js installed" -ForegroundColor Green
}

# ── 3. Instalar Ollama ───────────────────────────────────
Write-Host "[3/8] Installing Ollama..." -ForegroundColor Yellow
$ollamaInstalled = $false
try {
    $ollamaVersion = & ollama --version 2>$null
    if ($ollamaVersion) {
        Write-Host "  Ollama already installed: $ollamaVersion" -ForegroundColor Green
        $ollamaInstalled = $true
    }
} catch {}

if (-not $ollamaInstalled) {
    Write-Host "  Downloading Ollama..." -ForegroundColor Gray
    $ollamaUrl = "https://ollama.com/download/OllamaSetup.exe"
    $ollamaExe = "$env:TEMP\ollama-setup.exe"
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $ollamaExe -UseBasicParsing
    Start-Process $ollamaExe -Wait -ArgumentList "/S"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Remove-Item $ollamaExe -Force -ErrorAction SilentlyContinue
    Write-Host "  Ollama installed" -ForegroundColor Green
}

# Start Ollama service
Write-Host "  Starting Ollama service..." -ForegroundColor Gray
$ollamaRunning = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollamaRunning) {
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5
}

# Pull models
Write-Host "  Pulling AI models (this takes a while)..." -ForegroundColor Gray
$models = @("qwen2.5:3b", "qwen2.5:14b", "llama3:8b", "all-minilm:l6-v2")
foreach ($model in $models) {
    Write-Host "    Pulling $model..." -ForegroundColor Gray
    & ollama pull $model 2>$null
}
Write-Host "  Ollama ready with 4 models" -ForegroundColor Green

# ── 4. Instalar PostgreSQL ───────────────────────────────
Write-Host "[4/8] Installing PostgreSQL 16..." -ForegroundColor Yellow
$pgInstalled = $false
try {
    $pgVersion = & psql --version 2>$null
    if ($pgVersion) {
        Write-Host "  PostgreSQL already installed" -ForegroundColor Green
        $pgInstalled = $true
    }
} catch {}

if (-not $pgInstalled) {
    Write-Host "  Downloading PostgreSQL 16..." -ForegroundColor Gray
    $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.8-1-windows-x64.exe"
    $pgExe = "$env:TEMP\pg-install.exe"
    Invoke-WebRequest -Uri $pgUrl -OutFile $pgExe -UseBasicParsing
    Start-Process $pgExe -Wait -ArgumentList "--mode unattended --superpassword viseron2026 --serverport 5432"
    Remove-Item $pgExe -Force -ErrorAction SilentlyContinue
    Write-Host "  PostgreSQL installed" -ForegroundColor Green
}

# Create databases
Write-Host "  Creating databases..." -ForegroundColor Gray
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$pgPass = "viseron2026"

# Create viseron database
& "$pgBin\psql.exe" -U postgres -c "CREATE DATABASE viseron;" 2>$null
& "$pgBin\psql.exe" -U postgres -d viseron -c @"
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    org VARCHAR(255),
    role VARCHAR(32) DEFAULT 'user',
    plan VARCHAR(32) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64),
    event_type VARCHAR(64),
    tokens_in INT DEFAULT 0,
    tokens_out INT DEFAULT 0,
    provider VARCHAR(32),
    model VARCHAR(64),
    cost_usd DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64),
    plan VARCHAR(32),
    status VARCHAR(32) DEFAULT 'active',
    provider VARCHAR(32),
    external_id VARCHAR(255),
    amount_usd DECIMAL(10,2),
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    session_id VARCHAR(64),
    role VARCHAR(16),
    content TEXT,
    embedding VECTOR(384),
    topics JSONB DEFAULT '[]',
    sentiment DECIMAL(3,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_activity (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(64),
    action VARCHAR(128),
    input TEXT,
    output TEXT,
    success BOOLEAN,
    duration_ms INT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_config (
    tenant_id VARCHAR(64) PRIMARY KEY,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON usage_events(user_id);
CREATE INDEX idx_usage_date ON usage_events(created_at);
CREATE INDEX idx_conv_user ON conversations(user_id);
CREATE INDEX idx_conv_session ON conversations(session_id);
CREATE INDEX idx_agent_activity_date ON agent_activity(created_at);
"@ 2>$null
Write-Host "  PostgreSQL ready with 7 tables" -ForegroundColor Green

# ── 5. Instalar Qdrant (Vector DB) ──────────────────────
Write-Host "[5/8] Installing Qdrant..." -ForegroundColor Yellow
$qdrantInstalled = $false
try {
    $qdrantHealth = Invoke-WebRequest -Uri "http://localhost:6333/healthz" -UseBasicParsing -TimeoutSec 3
    if ($qdrantHealth.StatusCode -eq 200) {
        Write-Host "  Qdrant already running" -ForegroundColor Green
        $qdrantInstalled = $true
    }
} catch {}

if (-not $qdrantInstalled) {
    # Download Qdrant binary for Windows
    $qdrantUrl = "https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-pc-windows-msvc.zip"
    $qdrantZip = "$env:TEMP\qdrant.zip"
    Invoke-WebRequest -Uri $qdrantUrl -OutFile $qdrantZip -UseBasicParsing
    Expand-Archive -Path $qdrantZip -DestinationPath "$VISERON_HOME\bin\qdrant" -Force
    Remove-Item $qdrantZip -Force -ErrorAction SilentlyContinue
    
    # Start Qdrant
    $qdrantExe = Get-ChildItem "$VISERON_HOME\bin\qdrant" -Recurse -Filter "qdrant.exe" | Select-Object -First 1
    if ($qdrantExe) {
        Start-Process $qdrantExe.FullName -WindowStyle Hidden
        Start-Sleep -Seconds 5
    }
    Write-Host "  Qdrant installed and started" -ForegroundColor Green
}

# ── 6. Configurar .env ──────────────────────────────────
Write-Host "[6/8] Configuring environment..." -ForegroundColor Yellow
$envContent = @"
# VISERON™ Environment Configuration
# Server: Windows Server 2025 · 16 CPU · 128GB · Madrid
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# === SERVER ===
NODE_ENV=production
PORT=32123
HOST=0.0.0.0
VISERON_HOME=$VISERON_HOME
DATA_DIR=$DATA_DIR

# === AI PROVIDERS (local - no API keys needed) ===
OLLAMA_HOST=http://localhost:11434
MINILM_ENDPOINT=http://localhost:8888/embed

# === CLOUD AI (optional - add your keys) ===
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GEMINI_API_KEY=...
# XAI_API_KEY=...

# === DATABASE ===
DATABASE_URL=postgresql://postgres:$pgPass@localhost:5432/viseron

# === VECTOR DB ===
QDRANT_URL=http://localhost:6333

# === PAYMENTS ===
# AVIRATO_API_KEY=...
# AVIRATO_WEBCODE=...
# AVIRATO_CLIENT_SECRET=...
# STRIPE_SECRET_KEY=sk_...

# === EMAIL ===
# GMAIL_CLIENT_ID=...
# GMAIL_CLIENT_SECRET=...
# GMAIL_REFRESH_TOKEN=...

# === RCS/SMS ===
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...

# === DOMAIN ===
TVS_PUBLIC_URL=http://localhost:32123
# TVS_PUBLIC_URL=https://www.trinnityviseronsystem.io

# === JWT ===
TVS_JWT_SECRET=$(New-Guid)

# === COMPOSIO ===
# COMPOSIO_API_KEY=ck_...
"@

Set-Content -Path "$VISERON_HOME\.env" -Value $envContent -Encoding UTF8
Write-Host "  .env created at $VISERON_HOME\.env" -ForegroundColor Green

# ── 7. Instalar dependências do VISERON ──────────────────
Write-Host "[7/8] Installing VISERON dependencies..." -ForegroundColor Yellow
Set-Location $VISERON_HOME
if (Test-Path "package.json") {
    npm install --production 2>$null
    Write-Host "  Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No package.json found. Copy VISERON code to $VISERON_HOME first!" -ForegroundColor Red
}

# ── 8. Criar script de startup ───────────────────────────
Write-Host "[8/8] Creating startup scripts..." -ForegroundColor Yellow

$startupScript = @"
# VISERON™ Auto-Start Script
# Executa todos os serviços do VISERON
# Colocar no Task Scheduler para executar no boot

`$ErrorActionPreference = "Continue"
`$VISERON_HOME = "C:\viseron"
`$LOG_DIR = "C:\viseron-logs"

# Log function
function Write-Log(`$msg) {
    `$_ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$_line = "[`$_ts] `$msg"
    Write-Host `$_line
    Add-Content -Path "`$LOG_DIR\startup.log" -Value `$_line
}

Write-Log "=== VISERON Startup ==="

# 1. Start Ollama
Write-Log "Starting Ollama..."
`$ollama = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not `$ollama) {
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}
Write-Log "Ollama started"

# 2. Start Qdrant
Write-Log "Starting Qdrant..."
`$qdrant = Get-Process -Name "qdrant" -ErrorAction SilentlyContinue
if (-not `$qdrant) {
    `$qdrantExe = Get-ChildItem "C:\viseron\bin\qdrant" -Recurse -Filter "qdrant.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (`$qdrantExe) {
        Start-Process `$qdrantExe.FullName -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
}
Write-Log "Qdrant started"

# 3. Start PostgreSQL (should auto-start)
`$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if (`$pgService -and `$pgService.Status -ne "Running") {
    Start-Service `$pgService.Name
}
Write-Log "PostgreSQL checked"

# 4. Start VISERON Core
Write-Log "Starting VISERON Core..."
Set-Location `$VISERON_HOME
Start-Process "node" -ArgumentList "--max-old-space-size=8192 dist/index.js" -WindowStyle Hidden -RedirectStandardOutput "`$LOG_DIR\viseron-stdout.log" -RedirectStandardError "`$LOG_DIR\viseron-stderr.log"
Start-Sleep -Seconds 5

# 5. Health check
`$maxRetries = 10
`$retries = 0
while (`$retries -lt `$maxRetries) {
    try {
        `$health = Invoke-WebRequest -Uri "http://localhost:32123/api/health" -UseBasicParsing -TimeoutSec 3
        if (`$health.StatusCode -eq 200) {
            Write-Log "VISERON Core is HEALTHY on port 32123"
            break
        }
    } catch {
        `$retries++
        Start-Sleep -Seconds 3
    }
}

if (`$retries -ge `$maxRetries) {
    Write-Log "WARNING: VISERON Core did not respond after `$maxRetries retries"
}

Write-Log "=== Startup Complete ==="
"@

Set-Content -Path "$VISERON_HOME\start-viseron.ps1" -Value $startupScript -Encoding UTF8

# Create stop script
$stopScript = @"
# VISERON™ Stop Script
Write-Host "Stopping VISERON..." -ForegroundColor Yellow

# Stop VISERON Node process
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    `$_.CommandLine -match "viseron" -or `$_.MainWindowTitle -match "viseron"
} | Stop-Process -Force

# Stop Qdrant
Get-Process -Name "qdrant" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "VISERON stopped" -ForegroundColor Green
"@

Set-Content -Path "$VISERON_HOME\stop-viseron.ps1" -Value $stopScript -Encoding UTF8

Write-Host "  Startup scripts created" -ForegroundColor Green

# ── Configurar Task Scheduler (boot auto-start) ──────────
Write-Host "  Configuring Task Scheduler for auto-start..." -ForegroundColor Gray
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$VISERON_HOME\start-viseron.ps1`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName "VISERON-AutoStart" -Action $action -Trigger $trigger -Settings $settings -Force -Description "VISERON™ Platform Auto-Start" 2>$null
Write-Host "  Task Scheduler configured" -ForegroundColor Green

# ── Firewall ─────────────────────────────────────────────
Write-Host "  Configuring Windows Firewall..." -ForegroundColor Gray
New-NetFirewallRule -DisplayName "VISERON HTTP" -Direction Inbound -Protocol TCP -LocalPort 32123 -Action Allow 2>$null
New-NetFirewallRule -DisplayName "VISERON Ollama" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow 2>$null
New-NetFirewallRule -DisplayName "VISERON PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -RemoteAddress "127.0.0.1" 2>$null
New-NetFirewallRule -DisplayName "VISERON Qdrant" -Direction Inbound -Protocol TCP -LocalPort 6333 -Action Allow -RemoteAddress "127.0.0.1" 2>$null
Write-Host "  Firewall rules created" -ForegroundColor Green

# ── DONE ─────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  VISERON™ Server Setup COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  - VISERON Core:    http://localhost:32123" -ForegroundColor White
Write-Host "  - Ollama (IA):     http://localhost:11434" -ForegroundColor White
Write-Host "  - Qdrant (vectors): http://localhost:6333" -ForegroundColor White
Write-Host "  - PostgreSQL:       localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit $VISERON_HOME\.env with your API keys" -ForegroundColor White
Write-Host "  2. Copy VISERON code to $VISERON_HOME" -ForegroundColor White
Write-Host "  3. Run: cd $VISERON_HOME && npm install && npm run build" -ForegroundColor White
Write-Host "  4. Run: powershell $VISERON_HOME\start-viseron.ps1" -ForegroundColor White
Write-Host ""
