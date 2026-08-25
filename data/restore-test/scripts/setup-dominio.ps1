# ============================================================================
# TVS - GO-LIVE DO DOMINIO REAL: trinnityviseron.com
# O dominio JA ESTA REGISTADO (registrador: Hostalia) e a zona Cloudflare ja
# existe com os registos corretos. Falta SO o passo do registrador:
#   trocar os nameservers de servicio-online.net (Hostalia) para os da
#   Cloudflare. Isso SOH pode ser feito no painel da Hostalia (login do dono).
# ============================================================================
# USO:
#   npm run domain:check   -> valida NS, DNS e HTTPS atuais (usa -Validate)
# ============================================================================

param(
    [switch]$Validate
)

$Domain = "trinnityviseron.com"
$WWW = "www.$Domain"
$RenderApp = "viseron-web.onrender.com"

Write-Host ""
Write-Host "=============================================="
Write-Host "  TVS - DOMINIO: $WWW"
Write-Host "=============================================="

Write-Host ""
Write-Host "ESTADO ATUAL" -ForegroundColor Yellow

# 1) Nameservers autoritativos
Write-Host "`n[1] Nameservers (quem manda no DNS):" -ForegroundColor Yellow
$cloudflareNS = @()
try {
    $ns = Resolve-DnsName -Type NS -Name $Domain -ErrorAction Stop | Where-Object { $_.NameHost } | Select-Object -ExpandProperty NameHost
    foreach ($n in $ns) {
        $isCF = $n -match "cloudflare.com"
        Write-Host ("   {0}  {1}" -f $n, $(if ($isCF) { "[Cloudflare - OK]" } else { "[registrador: sera trocado]" }))
        if ($isCF) { $cloudflareNS += $n }
    }
} catch {
    Write-Host "   Nao foi possivel ler os nameservers." -ForegroundColor Red
}

# 2) Resolucao DNS do site
Write-Host "`n[2] Resolucao DNS:" -ForegroundColor Yellow
foreach ($name in @($Domain, $WWW)) {
    try {
        $r = Resolve-DnsName -Name $name -ErrorAction Stop
        $ips = ($r | Where-Object { $_.IPAddress } | Select-Object -First 3).IPAddress -join ", "
        Write-Host "   $name -> $ips" -ForegroundColor Green
    } catch {
        Write-Host "   $name -> nao resolve" -ForegroundColor Red
    }
}

# 3) HTTPS
Write-Host "`n[3] HTTPS:" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "https://$WWW" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "   https://$WWW -> HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   https://$WWW -> indisponivel" -ForegroundColor Red
}

Write-Host ""
Write-Host "====================================================================="
if ($cloudflareNS.Count -ge 2) {
    Write-Host "  RESULTADO: NAMESERVERS JAH NA CLOUDFLARE" -ForegroundColor Green
    Write-Host "  O dominio ja deve servir a app do Render em minutos."
    Write-Host "  Se ainda nao servir, verifique os registos DNS na Cloudflare:"
    Write-Host "    trinnityviseron.com  CNAME  $RenderApp"
    Write-Host "    www                  CNAME  $RenderApp"
} else {
    Write-Host "  RESULTADO: FALTA TROCAR OS NAMESERVERS NA HOSTALIA" -ForegroundColor Red
    Write-Host "====================================================================="
    Write-Host ""
    Write-Host "PASSO UNICO (so o dono pode fazer, 5 minutos no telemovel):" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Entra em https://www.hostalia.com -> Clica em 'ENTRAR' (topo)"
    Write-Host "     (login = email da conta Hostalia onde o dominio foi registado)"
    Write-Host "  2. Vai a: Dominios -> trinnityviseron.com -> 'Gestao de DNS'"
    Write-Host "     ou 'Nameservers' (DNS de terceiros)"
    Write-Host "  3. Substitui os nameservers atuais por estes da Cloudflare:"
    Write-Host ""
    Write-Host "       chad.ns.cloudflare.com"
    Write-Host "       kay.ns.cloudflare.com"
    Write-Host ""
    Write-Host "  4. Grava. A propagacao demora 5min a 24h."
    Write-Host ""
    Write-Host "  NOTA: os nomes exatos dos nameservers da tua zona estao em"
    Write-Host "  https://dash.cloudflare.com  -> trinnityviseron.com -> DNS -> Records"
    Write-Host "  (secção 'Nameservers' no rodapé). Usa AQUELES, nao os de cima."
    Write-Host ""
    Write-Host "  Depois da troca: npm run domain:check para confirmar,"
    Write-Host "  e a app + paginas do Render ficam acessiveis em:"
    Write-Host "  https://www.trinnityviseron.com"
    Write-Host "====================================================================="
}
Write-Host ""
