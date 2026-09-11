# ============================================================
# VISERON™ SSH Tunnel Setup
# Cria túnel direto PC ↔ Servidor para acesso remoto
# © Pedro Costa · Trinnity Hurtado — VISERON™
# ============================================================

$ErrorActionPreference = "Stop"

$SERVER_IP = "MUDAR_PARA_IP_NOVO_SERVIDOR"
$SERVER_USER = "Administrator"
$SSH_KEY = "$env:USERPROFILE\.ssh\viseron_key"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VISERON™ SSH Tunnel Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Gerar chave SSH (se não existe) ──────────────────
Write-Host "[1/4] Checking SSH key..." -ForegroundColor Yellow
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "  Generating new SSH key pair..." -ForegroundColor Gray
    & ssh-keygen -t ed25519 -f $SSH_KEY -N "" -C "viseron-sync"
    Write-Host "  SSH key generated" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "  IMPORTANT: Copy this public key to the server:" -ForegroundColor Yellow
    Write-Host "  On server, run:" -ForegroundColor Gray
    Write-Host "    New-Item -ItemType Directory -Force -Path ~\.ssh" -ForegroundColor Gray
    Write-Host "    Add-Content ~\.ssh\authorized_keys '$(Get-Content $SSH_KEY.pub)'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Press Enter when done..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "  SSH key exists" -ForegroundColor Green
}

# ── 2. Testar conexão ──────────────────────────────────
Write-Host "[2/4] Testing connection..." -ForegroundColor Yellow
try {
    $test = & ssh -i $SSH_KEY -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo CONNECTED" 2>$null
    if ($test -eq "CONNECTED") {
        Write-Host "  Connection OK" -ForegroundColor Green
    } else {
        Write-Host "  Connection failed. Check server IP and SSH key." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  Connection failed: $_" -ForegroundColor Red
    exit 1
}

# ── 3. Criar túnel persistente ──────────────────────────
Write-Host "[3/4] Setting up persistent tunnel..." -ForegroundColor Yellow

# Script de túnel
$tunnelScript = @"
# VISERON™ Persistent SSH Tunnel
# Mantém túnel aberto entre PC e servidor
# Executar via Task Scheduler a cada 5 minutos (auto-reconnect)

`$SERVER_IP = "$SERVER_IP"
`$SERVER_USER = "$SERVER_USER"
`$SSH_KEY = "$SSH_KEY"

# Portas mapeadas (PC → Server)
`$TUNNELS = @(
    @{ Local=32123; Remote=32123; Name="VISERON-Core" },
    @{ Local=11434; Remote=11434; Name="Ollama" },
    @{ Local=6333;  Remote=6333;  Name="Qdrant" },
    @{ Local=5432;  Remote=5432;  Name="PostgreSQL" }
)

foreach (`$tunnel in `$TUNNELS) {
    # Check if tunnel already exists
    `$existing = Get-NetTCPConnection -LocalPort `$tunnel.Local -ErrorAction SilentlyContinue | 
        Where-Object { `$_.State -eq "Listen" }
    
    if (-not `$existing) {
        # Create tunnel
        Start-Process "ssh" -ArgumentList @(
            "-i", "`$SSH_KEY",
            "-N", "-L", "`$(`$tunnel.Local):localhost:`$(`$tunnel.Remote)",
            "`$SERVER_USER@`$SERVER_IP"
        ) -WindowStyle Hidden
        
        Write-Host "Tunnel `$(`$tunnel.Name): localhost:`$(`$tunnel.Local) → server:`$(`$tunnel.Remote)" -ForegroundColor Green
    }
}
"@

$tunnelPath = "$env:USERPROFILE\viseron-tunnel.ps1"
Set-Content -Path $tunnelPath -Value $tunnelScript -Encoding UTF8

# Task Scheduler para auto-reconnect
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$tunnelPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "VISERON-SSHTunnel" -Action $action -Trigger $trigger -Settings $settings -Force -Description "VISERON™ SSH Tunnel Auto-Reconnect" 2>$null

Write-Host "  Persistent tunnel configured" -ForegroundColor Green

# ── 4. Testar túneis ────────────────────────────────────
Write-Host "[4/4] Testing tunnels..." -ForegroundColor Yellow

# Iniciar túneis
& $tunnelPath

Start-Sleep -Seconds 3

foreach ($tunnel in @(
    @{ Port=32123; Name="VISERON" },
    @{ Port=11434; Name="Ollama" },
    @{ Port=6333;  Name="Qdrant" },
    @{ Port=5432;  Name="PostgreSQL" }
)) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $tunnel.Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
        if ($conn) {
            Write-Host "  $($tunnel.Name) tunnel: OK (port $($tunnel.Port))" -ForegroundColor Green
        } else {
            Write-Host "  $($tunnel.Name) tunnel: NOT ACTIVE" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  $($tunnel.Name) tunnel: ERROR" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SSH Tunnel Setup COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tunnels active:" -ForegroundColor Cyan
Write-Host "  localhost:32123 → Server VISERON Core" -ForegroundColor White
Write-Host "  localhost:11434 → Server Ollama" -ForegroundColor White
Write-Host "  localhost:6333  → Server Qdrant" -ForegroundColor White
Write-Host "  localhost:5432  → Server PostgreSQL" -ForegroundColor White
Write-Host ""
Write-Host "You can now access the server dashboard at:" -ForegroundColor Yellow
Write-Host "  http://localhost:32123" -ForegroundColor White
Write-Host ""
