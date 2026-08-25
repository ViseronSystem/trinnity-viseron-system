param(
  [string]$Target = "all"
)

$Root = Split-Path -Parent $PSScriptRoot
$Mobile = Join-Path $Root "mobile"
$Dist = Join-Path $Root "dist"

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TVS v7.0 - Cross-Platform Build System     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

function Build-Core {
  Write-Host "`n[1/3] Building TVS Core (TypeScript)..." -ForegroundColor Yellow
  Set-Location -LiteralPath $Root
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Core build failed" }
  Write-Host "[OK] Core built to dist/" -ForegroundColor Green
}

function Build-Mobile-Android {
  Write-Host "`n[2/3] Building Android APK..." -ForegroundColor Yellow
  Set-Location -LiteralPath $Mobile
  npm install
  npx expo run:android
  if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
  Write-Host "[OK] APK generated" -ForegroundColor Green
}

function Build-Mobile-iOS {
  Write-Host "`n[3/3] Building iOS IPA..." -ForegroundColor Yellow
  Set-Location -LiteralPath $Mobile
  npm install
  npx expo run:ios
  if ($LASTEXITCODE -ne 0) { throw "iOS build failed" }
  Write-Host "[OK] IPA generated" -ForegroundColor Green
}

function Build-Mobile-EAS-Android {
  Write-Host "`n[2/3] Building Android APK via EAS..." -ForegroundColor Yellow
  Set-Location -LiteralPath $Mobile
  npm install
  npx eas build --platform android --profile preview
  if ($LASTEXITCODE -ne 0) { throw "EAS Android build failed" }
  Write-Host "[OK] APK submitted to EAS" -ForegroundColor Green
}

function Build-Mobile-EAS-iOS {
  Write-Host "`n[3/3] Building iOS IPA via EAS..." -ForegroundColor Yellow
  Set-Location -LiteralPath $Mobile
  npm install
  npx eas build --platform ios --profile production
  if ($LASTEXITCODE -ne 0) { throw "EAS iOS build failed" }
  Write-Host "[OK] IPA submitted to EAS" -ForegroundColor Green
}

try {
  Build-Core

  switch ($Target.ToLower()) {
    "android" { Build-Mobile-Android }
    "ios" { Build-Mobile-iOS }
    "eas-android" { Build-Mobile-EAS-Android }
    "eas-ios" { Build-Mobile-EAS-iOS }
    "all" {
      Build-Mobile-Android
      Build-Mobile-iOS
    }
    "eas" {
      Build-Mobile-EAS-Android
      Build-Mobile-EAS-iOS
    }
    default {
      Write-Host "Unknown target: $Target" -ForegroundColor Red
      Write-Host "Valid targets: all, android, ios, eas, eas-android, eas-ios" -ForegroundColor Yellow
      exit 1
    }
  }

  Write-Host "`n[OK] All builds completed successfully!" -ForegroundColor Green
} catch {
  Write-Host "`n[X] Build failed: $_" -ForegroundColor Red
  exit 1
} finally {
  Set-Location -LiteralPath $Root
}
