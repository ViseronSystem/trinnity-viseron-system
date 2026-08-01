# ============================================================================
# TVS — SETUP DOMÍNIO NOVO: www.trinnityviseronsystem.io
# Onde registar + DNS + validação + automação
# ============================================================================
# ONDE REGISTAR (escolha um):
#   1. Cloudflare Registrar  -> https://dash.cloudflare.com  (recomendado: DNS + CDN + SSL grátis)
#   2. Namecheap             -> https://www.namecheap.com    (barato, fácil)
#   3. GoDaddy               -> https://www.godaddy.com
#   4. Porkbun               -> https://porkbun.com          (acessível)
#
# Após registar o domínio, aponte os nameservers para a Cloudflare
# (ou use os DNS do próprio registar) e adicione os registos abaixo.
# ============================================================================

param(
    [switch]$Validate,
    [switch]$GenEnv
)

$Domain = "trinnityviseronsystem.io"
$WWW = "www.$Domain"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗"
Write-Host "║   TVS - DOMAIN SETUP: $WWW`  " -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝"
Write-Host ""

Write-Host "1) ONDE REGISTAR O DOMÍNIO" -ForegroundColor Yellow
Write-Host "   → Cloudflare (recomendado): https://dash.cloudflare.com"
Write-Host "   → Namecheap:                https://www.namecheap.com"
Write-Host "   → GoDaddy:                  https://www.godaddy.com"
Write-Host "   → Porkbun:                  https://porkbun.com"
Write-Host ""

Write-Host "2) REGISTOS DNS A CRIAR" -ForegroundColor Yellow
Write-Host "   TIPO    NOME                       VALOR / ALVO"
Write-Host "   ─────   ─────────────────────────  ─────────────────────────────"
Write-Host "   A       @                          76.76.21.21  (Vercel anycast)"
Write-Host "   CNAME   www                        cname.vercel-dns.com"
Write-Host ""
Write-Host "   Para apontar para o Render (back-end web):"
Write-Host "   CNAME   www                        viseron-web.onrender.com"
Write-Host "   CNAME   api                         viseron-web.onrender.com"
Write-Host ""
Write-Host "3) SSL/HTTPS" -ForegroundColor Yellow
Write-Host "   Cloudflare: modo Full (strict) -> emissão automática de certificado."
Write-Host ""

$envFile = "C:\Trinnity-Viseron-System\.env"
if ($GenEnv) {
    $add = @(
        ""
        "# ===== DOMINIO NOVO ====="
        "TVS_DOMAIN=$WWW"
        "TVS_SITE_URL=https://$WWW"
        "PUBLIC_SITE=https://$WWW"
    )
    Add-Content -Path $envFile -Value $add
    Write-Host "[OK] .env atualizado com o novo domínio" -ForegroundColor Green
}

if ($Validate) {
    Write-Host "4) VALIDAÇÃO DNS (nslookup)" -ForegroundColor Yellow
    foreach ($name in @($Domain, $WWW)) {
        try {
            $r = Resolve-DnsName -Name $name -ErrorAction Stop
            $ips = ($r | Where-Object { $_.IPAddress } | Select-Object -First 3).IPAddress -join ", "
            Write-Host "   $name -> $ips" -ForegroundColor Green
        } catch {
            Write-Host "   $name -> NÃO RESOLVE AINDA (aguarde propagação 5min-24h)" -ForegroundColor Red
        }
    }
    try {
        $r = Invoke-WebRequest -Uri "https://$WWW" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        Write-Host "   HTTPS $WWW -> HTTP $($r.StatusCode) ✓" -ForegroundColor Green
    } catch {
        Write-Host "   HTTPS $WWW -> ainda indisponível (verifique deploy + DNS)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Resumo do fluxo automatizado:" -ForegroundColor Cyan
Write-Host "  npm run deploy:domain   -> este script (setup DNS + .env)"
Write-Host "  npm run deploy:site     -> publica a página no domínio novo"
Write-Host "  npm run update:auto     -> self-update (pull + build + testes + PDFs + deploy)"
Write-Host ""
