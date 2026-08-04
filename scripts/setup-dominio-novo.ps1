# ============================================================================
# TVS - GO-LIVE DO NOVO DOMINIO: trinnityviseronsystem.io
# O dominio NAO ESTA REGISTADO ainda. Este script:
#   1. Verifica se ja esta registado/disponivel
#   2. Mostra o estado DNS/HTTPS atual
#   3. Da o passo a passo de registo + nameservers + vercel
# USO:  npm run domain:novo  (ou  domain:check)
# ============================================================================

param(
    [switch]$Validate
)

$Domain = "trinnityviseronsystem.io"
$WWW = "www.$Domain"
$RenderApp = "viseron-web.onrender.com"
$NewVercelDir = "$PSScriptRoot\..\trinnityviseronsystem.io"

Write-Host ""
Write-Host "=============================================="
Write-Host "  TVS - NOVO DOMINIO: $WWW"
Write-Host "=============================================="

Write-Host "`n[0] Registo do dominio:" -ForegroundColor Yellow
$registered = $false
try {
    $r = Invoke-RestMethod -Uri "https://rdap.org/domain/$Domain" -TimeoutSec 15 -ErrorAction Stop
    if ($r.ldhName) {
        $registered = $true
        Write-Host "   $Domain -> JA REGISTADO ($($r.ldhName))" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "   $Domain -> DISPONIVEL PARA REGISTO (ainda nao registado)" -ForegroundColor Yellow
    } else {
        Write-Host "   $Domain -> nao foi possivel verificar" -ForegroundColor Red
    }
}

Write-Host "`n[1] Nameservers:" -ForegroundColor Yellow
try {
    $ns = Resolve-DnsName -Type NS -Name $Domain -ErrorAction Stop | Where-Object { $_.NameHost } | Select-Object -ExpandProperty NameHost
    foreach ($n in $ns) { Write-Host "   $n" -ForegroundColor Green }
} catch {
    Write-Host "   sem nameservers (nao registado / sem DNS)" -ForegroundColor Red
}

Write-Host "`n[2] Resolucao DNS do site:" -ForegroundColor Yellow
foreach ($name in @($Domain, $WWW)) {
    try {
        $r = Resolve-DnsName -Name $name -ErrorAction Stop
        $ips = ($r | Where-Object { $_.IPAddress } | Select-Object -First 3).IPAddress -join ", "
        Write-Host "   $name -> $ips" -ForegroundColor Green
    } catch {
        Write-Host "   $name -> nao resolve" -ForegroundColor Red
    }
}

Write-Host "`n[3] HTTPS:" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "https://$WWW" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "   https://$WWW -> HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   https://$WWW -> indisponivel" -ForegroundColor Red
}

Write-Host "`n[4] Site pronto para deploy (Vercel):" -ForegroundColor Yellow
if (Test-Path "$NewVercelDir\index.html") {
    Write-Host "   $NewVercelDir\index.html + vercel.json (proxy /api -> Render) prontos" -ForegroundColor Green
} else {
    Write-Host "   pasta $NewVercelDir inexistente" -ForegroundColor Red
}

Write-Host ""
Write-Host "====================================================================="
if (-not $registered) {
    Write-Host "  ACAO NECESSARIA (so o dono): REGISTAR O DOMINIO" -ForegroundColor Cyan
    Write-Host "====================================================================="
    Write-Host ""
    Write-Host "  O dominio trinnityviseronsystem.io esta DISPONIVEL. Passos:"
    Write-Host ""
    Write-Host "  OPCAO A (recomendada - Cloudflare Registrar, ~20 EUR/ano):"
    Write-Host "    1. https://dash.cloudflare.com -> Domain Registration -> Register Domain"
    Write-Host "    2. Regista trinnityviseronsystem.io (a zona fica logo na Cloudflare)"
    Write-Host "    3. Pronto - o setup-dominio do Render usa chad/kay.ns.cloudflare.com"
    Write-Host ""
    Write-Host "  OPCAO B (Namecheap/GoDaddy/Hostalia/Dynadot, ja tens conta):"
    Write-Host "    1. Regista trinnityviseronsystem.io onde preferires"
    Write-Host "    2. Cria a zona na Cloudflare (Free): https://dash.cloudflare.com -> Add site"
    Write-Host "    3. No fim do passo 2 a Cloudflare mostra-te 2 nameservers NOVOS"
    Write-Host "       (ex: xxx.ns.cloudflare.com / yyy.ns.cloudflare.com - especificos desta zona)."
    Write-Host "       Guarda-os e no registador troca os nameservers para ESSES."
    Write-Host "  Depois de registado (qualquer opcao):"
    Write-Host "    4. Na zona Cloudflare, cria os registos (DNS -> Records):"
    Write-Host "       - Tipo A, nome @,  IP 76.76.21.21 (Vercel), Proxy ON (nuvem laranja)"
    Write-Host "       - Tipo CNAME, nome www, alvo cname.vercel-dns.com, Proxy ON"
    Write-Host "    5. vercel login            (ligar a conta Vercel - browser)"
    Write-Host "    6. cd trinnityviseronsystem.io && vercel --prod --yes"
    Write-Host "    7. No dashboard Vercel: Project -> Settings -> Domains -> adiciona"
    Write-Host "       trinnityviseronsystem.io e www.trinnityviseronsystem.io"
    Write-Host "    8. Render: Settings -> Custom Domains -> www.trinnityviseronsystem.io (opcional, para a API)"
    Write-Host ""
    Write-Host "  A API continua em https://viseron-web.onrender.com e o site novo"
    Write-Host "  redireciona /api/* para ela automaticamente (vercel.json)."
    Write-Host "  Depois dos nameservers trocados, valida com: npm run domain:novo:check"
} else {
    Write-Host "  O dominio JA esta registado." -ForegroundColor Green
    Write-Host "  Confirma o HTTPS em https://$WWW e a API em https://$RenderApp/api/health"
}
Write-Host "====================================================================="
Write-Host ""
