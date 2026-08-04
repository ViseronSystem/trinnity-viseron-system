param(
  [string]$Version = "5.0.0"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Scripts = $PSScriptRoot
$Downloads = Join-Path $Root "src\dashboard\public\downloads"
$Apk = Join-Path $Downloads "TrinnityViseron.apk"
$Stage = Join-Path $env:TEMP "tvs-apk-installer"
$Icon = Join-Path $Root "electron\assets\icon.ico"
$Nsis = Join-Path $env:LOCALAPPDATA "electron-builder\Cache\nsis\nsis-3.0.4.1\makensis.exe"
$OutExe = Join-Path $Downloads "TrinnityViseron-APK-Setup-$Version.exe"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TVS - Windows Installer para o APK v$Version" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if (-not (Test-Path $Apk)) { throw "APK nao encontrado: $Apk" }
if (-not (Test-Path $Icon)) { throw "Icone nao encontrado: $Icon" }
if (-not (Test-Path $Nsis)) { throw "makensis nao encontrado em $Nsis" }

Write-Host "[1/4] A preparar ficheiros..." -ForegroundColor Yellow
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage | Out-Null
Copy-Item $Apk "$Stage\TrinnityViseron.apk"
Copy-Item (Join-Path $Scripts "apk-install-instructions.html") "$Stage\INSTRUCOES.html"
Copy-Item (Join-Path $Scripts "instalar.bat") "$Stage\instalar.bat"
Copy-Item $Icon "$Stage\icon.ico"

Write-Host "[2/4] A gerar script NSIS..." -ForegroundColor Yellow
$nsi = Get-Content (Join-Path $Scripts "apk-installer.nsi") -Raw
$stageNsi = Join-Path $Stage "apk-installer.nsi"
Set-Content -Path $stageNsi -Value $nsi -Encoding UTF8

Write-Host "[3/4] A compilar com makensis (APK 62MB, demora um pouco)..." -ForegroundColor Yellow
Push-Location $Stage
try {
  & $Nsis "-DAPKVER=$Version" $stageNsi
  if ($LASTEXITCODE -ne 0) { throw "makensis falhou (codigo $LASTEXITCODE)" }
} finally {
  Pop-Location
}

$built = Join-Path $Stage "TrinnityViseron-APK-Setup-$Version.exe"
if (-not (Test-Path $built)) { throw "Instalador nao foi gerado: $built" }

Write-Host "[4/4] A copiar para /downloads do site..." -ForegroundColor Yellow
Copy-Item $built $OutExe -Force

$sizeMb = [math]::Round((Get-Item $OutExe).Length / 1MB, 1)
Write-Host "`nOK! Instalador criado:" -ForegroundColor Green
Write-Host "  $OutExe" -ForegroundColor Green
Write-Host "  Tamanho: $sizeMb MB"
Write-Host "  Url do site: /downloads/TrinnityViseron-APK-Setup-$Version.exe" -ForegroundColor Green
