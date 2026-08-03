param(
    [string]$BackupRoot = "C:\Trinnity-Viseron-System\backups",
    [int]$RetentionDays = 30
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -Path $RepoRoot

$Date = Get-Date -Format "yyyy-MM-dd_HHmmss"
$BackupDir = Join-Path -Path $BackupRoot -ChildPath $Date
$LogFile = Join-Path -Path $BackupRoot -ChildPath "backup-log.txt"

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$Timestamp - $Message" | Out-File -FilePath $LogFile -Append -Encoding UTF8
    Write-Host "$Timestamp - $Message"
}

Write-Log "=== INICIANDO BACKUP: $Date ==="

# Create backup directory structure
$Dirs = @(
    "config", "data", "database", "src", "scripts",
    "agents", "packages", "mobile", "electron", "docs"
)
foreach ($Dir in $Dirs) {
    $null = New-Item -ItemType Directory -Path (Join-Path -Path $BackupDir -ChildPath $Dir) -Force
}

# Backup config files
Write-Log "Backup config..."
if (Test-Path "config") {
    Copy-Item -Path "config\*" -Destination (Join-Path -Path $BackupDir -ChildPath "config") -Recurse -Force
}
# Segurança: .env (chaves API/secrets) NÃO vai para o backup. Só o template sanitizado.
if (Test-Path ".env.example") {
    Copy-Item -Path ".env.example" -Destination (Join-Path -Path $BackupDir -ChildPath ".env.example") -Force -ErrorAction SilentlyContinue
} else {
    Write-Log "AVISO: .env NÃO incluído no backup (secrets). Restaure-o manualmente."
}
Copy-Item -Path "package.json" -Destination (Join-Path -Path $BackupDir -ChildPath "package.json") -Force -ErrorAction SilentlyContinue
Copy-Item -Path "tsconfig.json" -Destination (Join-Path -Path $BackupDir -ChildPath "tsconfig.json") -Force -ErrorAction SilentlyContinue
Copy-Item -Path "railway.json" -Destination (Join-Path -Path $BackupDir -ChildPath "railway.json") -Force -ErrorAction SilentlyContinue
Copy-Item -Path "docker-compose.yml" -Destination (Join-Path -Path $BackupDir -ChildPath "docker-compose.yml") -Force -ErrorAction SilentlyContinue
Copy-Item -Path "Dockerfile" -Destination (Join-Path -Path $BackupDir -ChildPath "Dockerfile") -Force -ErrorAction SilentlyContinue

# Backup data
Write-Log "Backup data..."
if (Test-Path "data") {
    Copy-Item -Path "data\*" -Destination (Join-Path -Path $BackupDir -ChildPath "data") -Recurse -Force
}

# Backup database
Write-Log "Backup database..."
if (Test-Path "database") {
    Copy-Item -Path "database\*" -Destination (Join-Path -Path $BackupDir -ChildPath "database") -Recurse -Force
}

# Backup source
Write-Log "Backup src..."
if (Test-Path "src") {
    Copy-Item -Path "src\*" -Destination (Join-Path -Path $BackupDir -ChildPath "src") -Recurse -Force -Exclude "node_modules"
}

# Backup scripts
Write-Log "Backup scripts..."
if (Test-Path "scripts") {
    Copy-Item -Path "scripts\*" -Destination (Join-Path -Path $BackupDir -ChildPath "scripts") -Recurse -Force
}

# Backup agents
Write-Log "Backup agents..."
if (Test-Path "agents") {
    Copy-Item -Path "agents\*" -Destination (Join-Path -Path $BackupDir -ChildPath "agents") -Recurse -Force
}

# Backup packages
Write-Log "Backup packages..."
if (Test-Path "packages") {
    Copy-Item -Path "packages\*" -Destination (Join-Path -Path $BackupDir -ChildPath "packages") -Recurse -Force -Exclude "node_modules"
}

# Backup mobile src
Write-Log "Backup mobile source..."
if (Test-Path "mobile\src") {
    $mobileSrcDest = Join-Path -Path $BackupDir -ChildPath "mobile\src"
    New-Item -ItemType Directory -Path $mobileSrcDest -Force | Out-Null
    Copy-Item -Path "mobile\src\*" -Destination $mobileSrcDest -Recurse -Force
}
if (Test-Path "mobile\App.tsx") {
    Copy-Item -Path "mobile\App.tsx" -Destination (Join-Path -Path $BackupDir -ChildPath "mobile\App.tsx") -Force
}
if (Test-Path "mobile\package.json") {
    Copy-Item -Path "mobile\package.json" -Destination (Join-Path -Path $BackupDir -ChildPath "mobile\package.json") -Force
}
if (Test-Path "mobile\eas.json") {
    Copy-Item -Path "mobile\eas.json" -Destination (Join-Path -Path $BackupDir -ChildPath "mobile\eas.json") -Force
}

# Backup electron config
Write-Log "Backup electron config..."
if (Test-Path "electron\main.js") {
    Copy-Item -Path "electron\main.js" -Destination (Join-Path -Path $BackupDir -ChildPath "electron\main.js") -Force
    Copy-Item -Path "electron\preload.js" -Destination (Join-Path -Path $BackupDir -ChildPath "electron\preload.js") -Force
    Copy-Item -Path "electron\package.json" -Destination (Join-Path -Path $BackupDir -ChildPath "electron\package.json") -Force
}

# Backup docs (PDFs, markdown)
Write-Log "Backup documentation..."
$DocsFiles = @("AGENTS.md", "ANTIGRAVITY.md", "README.md")
foreach ($Doc in $DocsFiles) {
    if (Test-Path $Doc) {
        Copy-Item -Path $Doc -Destination (Join-Path -Path $BackupDir -ChildPath "docs\$Doc") -Force
    }
}

# Backup PDFs
Write-Log "Backup PDFs..."
$PdfFiles = Get-ChildItem -Path "." -Recurse -Filter "*.pdf" -File | Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.build\*" }
foreach ($Pdf in $PdfFiles) {
    $PdfDest = Join-Path -Path $BackupDir -ChildPath "pdfs"
    $null = New-Item -ItemType Directory -Path $PdfDest -Force
    Copy-Item -Path $Pdf.FullName -Destination (Join-Path -Path $PdfDest -ChildPath $Pdf.Name) -Force
}

# Compress backup
Write-Log "Compressing backup..."
$ZipPath = Join-Path -Path $BackupRoot -ChildPath "$Date.zip"
Compress-Archive -Path "$BackupDir\*" -DestinationPath $ZipPath -Force

# Remove uncompressed backup
Remove-Item -Path $BackupDir -Recurse -Force

# Cleanup old backups (older than RetentionDays)
Write-Log "Cleaning backups older than $RetentionDays days..."
$Cutoff = (Get-Date).AddDays(-$RetentionDays)
$OldBackups = Get-ChildItem -Path $BackupRoot -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt $Cutoff }
foreach ($Old in $OldBackups) {
    Remove-Item -Path $Old.FullName -Force
    Write-Log "Removed old backup: $($Old.Name)"
}

$Size = "{0:N2} MB" -f ((Get-Item $ZipPath).Length / 1MB)
Write-Log "=== BACKUP COMPLETO: $Date.zip ($Size) ==="
Write-Host ""
Write-Host "Backup criado: $ZipPath" -ForegroundColor Green
Write-Host "Tamanho: $Size" -ForegroundColor Green

# Return backup info
@{
    Path = $ZipPath
    Size = $Size
    Date = $Date
}
