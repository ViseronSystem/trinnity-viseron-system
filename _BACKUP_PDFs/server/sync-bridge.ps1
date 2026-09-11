# ============================================================
# VISERON™ Sync Bridge — PC Principal ↔ Servidor 24/7
# Mantém dados sincronizados via SSH/rsync automático
# O PC principal NÃO precisa estar 24h ligado
# © Pedro Costa · Trinnity Hurtado — VISERON™
# ============================================================

$ErrorActionPreference = "Stop"

# ── Configuração ─────────────────────────────────────────
$SERVER_IP = "MUDAR_PARA_IP_NOVO_SERVIDOR"  # ← IP público do servidor
$SERVER_USER = "Administrator"
$SERVER_PORT = 22
$SSH_KEY = "$env:USERPROFILE\.ssh\viseron_key"  # Chave SSH dedicada
$LOCAL_PROJECT = "C:\Trinnity-Viseron-System"
$REMOTE_PROJECT = "C:\viseron"
$SYNC_INTERVAL_MIN = 30  # Sync a cada 30 min quando ligado
$LOG_FILE = "$env:TEMP\viseron-sync.log"

# ── Dados que ficam no PC principal (NÃO sync para server) ─
$LOCAL_ONLY = @(
    "data\Viseron_Cosmos_Wallet_ACESSO.txt",  # Chaves criptográficas
    "contracts\solana-keypair.json",            # Keypair wallet
    "contracts\solana-seed.txt",                # Seed wallet
    "contracts\wallets\*",                      # Wallets geradas
    ".env",                                     # Secrets (server tem o seu)
    "*.pem", "*.key"                            # Certificados privados
)

# ── Dados que vêm do servidor (backup local) ─────────────
$SERVER_BACKUP = @(
    "data\knowledge\jarvis-memory.jsonl",
    "data\knowledge\viseron-supervision.jsonl",
    "data\state\task-queue.json",
    "data\state\vaec-journal.jsonl",
    "data\agency\agency.json",
    "data\tvs-os\*"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VISERON™ Sync Bridge" -ForegroundColor Cyan
Write-Host "  PC ↔ Server (24/7)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Funções ──────────────────────────────────────────────
function Write-SyncLog($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line
}

function Test-ServerConnection {
    try {
        $result = & ssh -i $SSH_KEY -p $SERVER_PORT -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo OK" 2>$null
        return $result -eq "OK"
    } catch {
        return $false
    }
}

function Sync-ToServer {
    Write-SyncLog "Syncing TO server..."
    
    # Excluir arquivos sensíveis
    $excludeArgs = @()
    foreach ($pattern in $LOCAL_ONLY) {
        $excludeArgs += @("--exclude", $pattern)
    }
    
    # Sync código e dados (exceto sensíveis)
    & rsync -avz --delete `
        $excludeArgs `
        -e "ssh -i $SSH_KEY -p $SERVER_PORT" `
        "$LOCAL_PROJECT/" `
        "$SERVER_USER@`"$SERVER_IP`":$REMOTE_PROJECT/" 2>&1 | ForEach-Object { Write-SyncLog "  $_" }
    
    Write-SyncLog "Sync TO server complete"
}

function Sync-FromServer {
    Write-SyncLog "Syncing FROM server (backup)..."
    
    foreach ($item in $SERVER_BACKUP) {
        $remotePath = "$REMOTE_PROJECT/$item"
        $localDir = Split-Path "$LOCAL_PROJECT/$item" -Parent
        
        if (-not (Test-Path $localDir)) {
            New-Item -ItemType Directory -Force -Path $localDir | Out-Null
        }
        
        & scp -i $SSH_KEY -P $SERVER_PORT -r `
            "$SERVER_USER@$SERVER_IP`":$remotePath `
            "$LOCAL_PROJECT/$item" 2>$null
    }
    
    Write-SyncLog "Sync FROM server complete"
}

function Sync-EncryptedArchive {
    # Backup criptografado de dados sensíveis do servidor
    Write-SyncLog "Creating encrypted backup from server..."
    
    $archive = "$LOCAL_PROJECT\data\backup\server-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
    $backupDir = Split-Path $archive -Parent
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    }
    
    & ssh -i $SSH_KEY -p $SERVER_PORT "$SERVER_USER@$SERVER_IP" `
        "tar czf - -C $REMOTE_PROJECT data/knowledge data/state data/agency data/tvs-os" 2>$null | `
        Set-Content -Path $archive -Encoding Byte
    
    Write-SyncLog "Encrypted backup saved: $archive"
}

# ── Main Loop ────────────────────────────────────────────
Write-SyncLog "=== Sync Bridge Started ==="
Write-SyncLog "Server: $SERVER_IP"
Write-SyncLog "Local: $LOCAL_PROJECT"
Write-SyncLog "Interval: $SYNC_INTERVAL_MIN minutes"

# Verificar conexão
Write-Host "Testing server connection..." -ForegroundColor Yellow
if (Test-ServerConnection) {
    Write-Host "  Server ONLINE" -ForegroundColor Green
} else {
    Write-Host "  Server OFFLINE - will retry when server is available" -ForegroundColor Red
    Write-SyncLog "Server offline at startup"
}

# Sync inicial
Write-Host ""
Write-Host "Running initial sync..." -ForegroundColor Yellow
try {
    Sync-ToServer
    Sync-FromServer
    Write-Host "  Initial sync complete" -ForegroundColor Green
} catch {
    Write-Host "  Initial sync failed: $_" -ForegroundColor Red
    Write-SyncLog "Initial sync failed: $_"
}

# Loop de sync automático
Write-Host ""
Write-Host "Starting sync loop (Ctrl+C to stop)..." -ForegroundColor Yellow
Write-Host "  Syncs every $SYNC_INTERVAL_MIN minutes when server is reachable" -ForegroundColor Gray

while ($true) {
    Start-Sleep -Seconds ($SYNC_INTERVAL_MIN * 60)
    
    if (Test-ServerConnection) {
        try {
            Sync-ToServer
            Sync-FromServer
            Sync-EncryptedArchive
        } catch {
            Write-SyncLog "Sync error: $_"
        }
    } else {
        Write-SyncLog "Server offline - skipping sync"
    }
}
