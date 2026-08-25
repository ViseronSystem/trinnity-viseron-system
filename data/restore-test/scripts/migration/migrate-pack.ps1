# migrate-pack.ps1 — Empacota o TVS para migrar para um servidor dedicado.
# Corre NESTA máquina (Windows). Cria a pasta `migracao/` com:
#   data-snapshot.tar.gz -> estado real do sistema (data/ minus .apk, logs, backups)
#   .env                -> segredos/configuração (CONFIDENCIAL — gitignored)
#   server-setup.sh     -> setup automático Ubuntu 24.04 / Debian 12
#   server-setup.ps1    -> setup Windows Server
#   android-build.sh    -> build de APK no Linux
#   tvs-run.sh          -> gestão PM2 (start/stop/restart/status/logs)
#   CHECKSUMS.txt       -> SHA256 do snapshot + .env (verifica integridade no servidor)
#
# Uso:  powershell -ExecutionPolicy Bypass -File scripts\migration\migrate-pack.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Out = Join-Path $Root "migracao"
$Data = Join-Path $Root "data"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗"
Write-Host "║  TVS - PACOTE DE MIGRAÇÃO (maquina atual)        ║"
Write-Host "╚══════════════════════════════════════════════════╝"

if (Test-Path $Out) { Remove-Item -Recurse -Force $Out }
New-Item -ItemType Directory -Path $Out -Force | Out-Null

# ── 1) Snapshot de data/ (exclui .apk regeneráveis, logs e backups locais) ──
Write-Host "[1/5] A criar data-snapshot.tar.gz ..."
$Exclude = @("*.apk")
$SnapDir = Join-Path $Out "data-snapshot"
New-Item -ItemType Directory -Path $SnapDir -Force | Out-Null
Get-ChildItem -Path $Data -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {
  $_.FullName -notmatch "\\logs(\\|$)" -and
  $_.FullName -notmatch "\\backups(\\|$)" -and
  $_.FullName -notmatch "\\apps\\[^\\]+\.apk$" -and
  $_.Name -notmatch "^server.*\.log(\.err)?$" -and
  $_.Name -ne "restart.log"
} | ForEach-Object {
  $rel = $_.FullName.Substring($Data.Length + 1)
  $dest = Join-Path $SnapDir $rel
  if ($_.PSIsContainer) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
  } else {
    $dir = Split-Path -Parent $dest
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -LiteralPath $_.FullName -Destination $dest -Force
  }
}
$Zip = Join-Path $Out "data-snapshot.tar.gz"
if (Test-Path $Zip) { Remove-Item $Zip }
# tar.exe (bsdtar) — usa separadores "/" no arquivo (compativel com Linux).
& tar.exe -czf $Zip -C $SnapDir . | Out-Null
Remove-Item -Recurse -Force $SnapDir
$snapMB = [math]::Round((Get-Item $Zip).Length / 1MB, 1)
Write-Host "  -> $Zip ($snapMB MB)"

# ── 2) .env (segredos) ──
Write-Host "[2/5] A copiar .env (confidencial)..."
$EnvFile = Join-Path $Root ".env"
if (Test-Path $EnvFile) {
  Copy-Item $EnvFile (Join-Path $Out ".env")
  Write-Host "  -> migracao\.env"
} else {
  Write-Host "  AVISO: .env não encontrado!"
}

# ── 3) Scripts de servidor ──
Write-Host "[3/5] A copiar scripts de servidor..."
Copy-Item (Join-Path $PSScriptRoot "server-setup.sh")     (Join-Path $Out "server-setup.sh")
Copy-Item (Join-Path $PSScriptRoot "server-setup.ps1")    (Join-Path $Out "server-setup.ps1")
Copy-Item (Join-Path $PSScriptRoot "android-build.sh")    (Join-Path $Out "android-build.sh")
Copy-Item (Join-Path $PSScriptRoot "tvs-run.sh")          (Join-Path $Out "tvs-run.sh")
Copy-Item (Join-Path $PSScriptRoot "..\..\docs\Viseron_Migracao_Servidor_Dedicado.md") (Join-Path $Out "RUNBOOK_MIGRACAO.md")

# ── 4) Instrução de uso ──
$Readme = @"
TVS - PACOTE DE MIGRACAO
========================
Este pacote migra o Trinnity Viseron System para um servidor dedicado.

CONTEUDO:
  data-snapshot.tar.gz  estado real (contas, mensagens, knowledge, agency, PDFs, ...)
  .env               segredos e config (NAO partilhar este ficheiro)
  server-setup.sh    setup automatico Ubuntu 24.04 / Debian 12
  server-setup.ps1   setup Windows Server
  android-build.sh   build de APK no Linux (Java 17 + Android SDK)
  tvs-run.sh         gestao do processo via PM2
  CHECKSUMS.txt      SHA256 para verificar a integridade no servidor
  RUNBOOK_MIGRACAO.md passos detalhados (es/pt/en)

COMO USAR (Linux):
  1. Copiar a pasta 'migracao/' para o servidor (scp/sftp/panela).
  2. ssh user@servidor
  3. cd migracao && sha256sum -c CHECKSUMS.txt
  4. chmod +x server-setup.sh && sudo ./server-setup.sh --domain www.trinnityviseronsystem.io
  5. Script instala tudo, sobe PM2 e verifica a saude.

COMO USAR (Windows Server):
  powershell -ExecutionPolicy Bypass -File .\server-setup.ps1

DEPOIS:
  - Atualiza .env no servidor: TVS_PUBLIC_URL=http://localhost:3000 (ou dominio).
  - Gere o DNS do dominio para o IP do servidor quando quiseres substituir o Render.
"@
Set-Content -LiteralPath (Join-Path $Out "LEIA-ME.txt") -Value $Readme -Encoding UTF8

# ── 5) Checksums ──
Write-Host "[4/5] A gerar CHECKSUMS.txt..."
$sums = @()
foreach ($f in @("data-snapshot.tar.gz", ".env")) {
  $p = Join-Path $Out $f
  if (Test-Path $p) {
    $hash = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower()
    $sums += "$hash *$f"
  }
}
Set-Content -LiteralPath (Join-Path $Out "CHECKSUMS.txt") -Value $sums -Encoding ASCII

Write-Host "[5/5] Pacote pronto!"
Write-Host ""
Write-Host "  Pasta:  $Out"
Write-Host "  Tamanho: $([math]::Round(((Get-ChildItem $Out -Recurse -File | Measure-Object Length -Sum).Sum/1MB),1)) MB"
Write-Host "  Transfere com:  scp -r migracao user@SERVIDOR:/home/user/"
Write-Host ""
