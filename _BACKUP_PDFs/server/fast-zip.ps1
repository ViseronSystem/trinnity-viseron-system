# VISERON Fast Build — ZIP simples e rápido
$ErrorActionPreference = "Stop"
$BUILD = "C:\temp\viseron-build"
$OUT = "C:\Trinnity-Viseron-System\viseron-deploy.zip"
$SRC = "C:\Trinnity-Viseron-System"

if (Test-Path $BUILD) { Remove-Item -Recurse -Force $BUILD }
if (Test-Path $OUT) { Remove-Item -Force $OUT }
New-Item -ItemType Directory -Force -Path $BUILD | Out-Null

Write-Host "Copiando codigo..." -ForegroundColor Yellow
# src (sem node_modules/android/build)
robocopy "$SRC\src" "$BUILD\src" /E /XD node_modules .git dist __pycache__ .gradle build android ios /XF *.log *.tmp /NFL /NDL /NJH /NJS /NC /NS /NP

# Pastas essenciais
foreach ($d in @("contracts","config","scripts","server","tests")) {
    if (Test-Path "$SRC\$d") { robocopy "$SRC\$d" "$BUILD\$d" /E /XD node_modules /NFL /NDL /NJH /NJS /NC /NS /NP }
}

# Root files
foreach ($f in @("package.json","tsconfig.json","opencode.json","AGENTS.md","README.md")) {
    if (Test-Path "$SRC\$f") { Copy-Item "$SRC\$f" "$BUILD\$f" -Force }
}

Write-Host "Criando ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$BUILD\*" -DestinationPath $OUT -Force
$sz = [math]::Round((Get-Item $OUT).Length/1MB,1)
Write-Host "ZIP pronto: $sz MB" -ForegroundColor Green

Remove-Item -Recurse -Force $BUILD -ErrorAction SilentlyContinue
