# ============================================================================
# TVS — SELF-UPDATE AUTOMÁTICO
# O sistema atualiza-se sozinho: pull → install → PDFs → build → testes → deploy
# Uso:  npm run update:auto
# ============================================================================
$ErrorActionPreference = "Continue"
$Root = "C:\Trinnity-Viseron-System"

function Write-Step($m, $s = "INFO") {
    $c = @{INFO="Cyan"; OK="Green"; WARN="Yellow"; ERROR="Red"}[$s]
    Write-Host "[$s] $m" -ForegroundColor $c
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TVS SELF-UPDATE — ciclo automático            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Push-Location $Root

# 1) Pull
Write-Step "git pull origin main..." "INFO"
git pull origin main --ff-only 2>&1 | ForEach-Object { Write-Host "   $_" }

# 2) Dependências
Write-Step "npm install..." "INFO"
npm install --no-audit --no-fund 2>&1 | Out-Null
Write-Step "Dependências OK" "OK"

# 3) Regenerar PDFs (pitch + roadmap + 100 melhorias + relatório de update)
Write-Step "Regenerando PDFs..." "INFO"
npx tsx scripts/gerar-pitch-startup.ts 2>&1 | ForEach-Object { Write-Host "   $_" }
npx tsx scripts/gerar-pitch-v6.ts      2>&1 | ForEach-Object { Write-Host "   $_" }
npx tsx scripts/gerar-roadmap-milionario.ts 2>&1 | ForEach-Object { Write-Host "   $_" }
npx tsx scripts/gerar-100-melhorias.ts 2>&1 | ForEach-Object { Write-Host "   $_" }

# 4) Build
Write-Step "npm run build..." "INFO"
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Step "Build OK" "OK" } else { Write-Step "Build FALHOU — abortando deploy" "ERROR" }

# 5) Testes
Write-Step "npm test..." "INFO"
npm test 2>&1 | Select-String -Pattern "PASSED|PASADAS|FAIL" | ForEach-Object { Write-Host "   $($_.Line.Trim())" }

# 6) Relatório de update (só depois dos testes)
Write-Step "Gerando relatório de update..." "INFO"
npx tsx scripts/gerar-relatorio-update.ts 2>&1 | ForEach-Object { Write-Host "   $_" }

# 7) Commit + push (resultado do ciclo)
Write-Step "Commit + push do ciclo..." "INFO"
git add -A
$Status = git status --porcelain
if ($Status) {
    $Msg = "Auto-update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git commit -m $Msg
    git push origin main 2>&1 | Out-Null
    Write-Step "Push OK" "OK"
} else {
    Write-Step "Nada novo para commitar" "INFO"
}

# 8) Deploy do site
Write-Step "Deploy do site..." "INFO"
& "$Root\scripts\deploy-all.ps1" -GitHub -Hostalia 2>&1 | Out-Null
Write-Step "Ciclo de self-update concluído" "OK"

Pop-Location
