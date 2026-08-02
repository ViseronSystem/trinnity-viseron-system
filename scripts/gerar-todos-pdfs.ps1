# ============================================================================
# TVS - REGENERAR TODOS OS PDFS
# Cada atualizacao/novo comando -> correr este script e o PDF fica atualizado.
# Uso:  npm run pdfs:all
# ============================================================================
$ErrorActionPreference = "Continue"
$Root = "C:\Trinnity-Viseron-System"

function Write-Step($m, $s = "INFO") {
    $c = @{INFO="Cyan"; OK="Green"; WARN="Yellow"; ERROR="Red"}[$s]
    Write-Host "[$s] $m" -ForegroundColor $c
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TVS - REGENERAR TODOS OS PDFS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Push-Location $Root

$Generators = @(
    @{ Name = "Pitch startup (3 idiomas)";     Script = "scripts/gerar-pitch-startup.ts" },
    @{ Name = "Pitch investidores v5";         Script = "scripts/gerar-pitch-investidores.ts" },
    @{ Name = "Pitch v6";                      Script = "scripts/gerar-pitch-v6.ts" },
    @{ Name = "Roadmap milionario";            Script = "scripts/gerar-roadmap-milionario.ts" },
    @{ Name = "100 melhorias de integracao";   Script = "scripts/gerar-100-melhorias.ts" },
    @{ Name = "Manual de comandos Viseron";    Script = "scripts/gerar-manual-comandos-viseron.ts" },
    @{ Name = "Manual Viseron";                Script = "scripts/gerar-manual-viseron.ts" },
    @{ Name = "Manual completo";               Script = "scripts/gerar-manual-completo.ts" }
)

foreach ($g in $Generators) {
    Write-Step "Gerando: $($g.Name)..." "INFO"
    npx tsx $g.Script 2>&1 | ForEach-Object { Write-Host "   $_" }
}

# Relatorio de update (ultimo - reflete tudo que foi gerado)
Write-Step "Gerando relatorio de update..." "INFO"
npx tsx scripts/gerar-relatorio-update.ts 2>&1 | ForEach-Object { Write-Host "   $_" }

# Relatorio de estado (o que pode fazer + estado real do sistema)
Write-Step "Gerando relatorio de estado..." "INFO"
npx tsx scripts/gerar-relatorio-estado.ts 2>&1 | ForEach-Object { Write-Host "   $_" }

# Auditoria operacional ARKOM / AIOX
Write-Step "Gerando auditoria ARKOM/AIOX..." "INFO"
npx tsx scripts/audit-arkom.ts 2>&1 | ForEach-Object { Write-Host "   $_" }

# Plano de receita real
Write-Step "Gerando plano de receita..." "INFO"
npx tsx scripts/gerar-pipeline-receita.ts 2>&1 | ForEach-Object { Write-Host "   $_" }

Write-Step "Todos os PDFs regenerados!" "OK"
Pop-Location
