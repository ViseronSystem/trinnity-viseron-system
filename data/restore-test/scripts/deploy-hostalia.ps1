param(
    [switch]$CleanRemote
)

$Root = "C:\Trinnity-Viseron-System"
$SiteDir = Join-Path $Root "trinnityviseron.com"

function Write-Step {
    param([string]$Message, [string]$Status = "INFO")
    $Color = @{INFO = "Cyan"; OK = "Green"; WARN = "Yellow"; ERROR = "Red"}[$Status]
    Write-Host "[$Status] $Message" -ForegroundColor $Color
}

function Get-EnvValue {
    param([string]$Key)
    $EnvFile = Join-Path $Root ".env"
    if (-not (Test-Path $EnvFile)) { return $null }
    $Line = Get-Content $EnvFile | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $Line) { return $null }
    return ($Line -replace "^$Key=", "").Trim().Trim('"').Trim("'")
}

function Invoke-FtpRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [byte[]]$Content = $null,
        [string]$RemoteName = $null,
        [string]$FtpHost,
        [string]$FtpUser,
        [string]$FtpPass,
        [bool]$UseSsl
    )
    $Req = [System.Net.FtpWebRequest]::Create($Uri)
    $Req.Method = $Method
    $Req.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
    $Req.KeepAlive = $false
    $Req.UseBinary = $true
    $Req.UsePassive = $true
    $Req.EnableSsl = $UseSsl
    if ($Content) {
        $Req.ContentLength = $Content.Length
        $Stream = $Req.GetRequestStream()
        $Stream.Write($Content, 0, $Content.Length)
        $Stream.Close()
    }
    $Resp = $Req.GetResponse()
    $Resp.Close()
}

function Test-FtpDir {
    param(
        [string]$Uri,
        [string]$FtpHost,
        [string]$FtpUser,
        [string]$FtpPass,
        [bool]$UseSsl
    )
    try {
        $Req = [System.Net.FtpWebRequest]::Create($Uri)
        $Req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $Req.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
        $Req.KeepAlive = $false
        $Req.UsePassive = $true
        $Req.EnableSsl = $UseSsl
        $Resp = $Req.GetResponse()
        $Reader = New-Object System.IO.StreamReader($Resp.GetResponseStream())
        $null = $Reader.ReadToEnd()
        $Reader.Close()
        $Resp.Close()
        return $true
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TRINNITY VISERON - DEPLOY HOSTALIA (FTP)         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$FtpHost = Get-EnvValue "HOSTALIA_FTP_HOST"
$FtpUser = Get-EnvValue "HOSTALIA_FTP_USER"
$FtpPass = Get-EnvValue "HOSTALIA_FTP_PASS"
$FtpPath = Get-EnvValue "HOSTALIA_FTP_PATH"
$SslRaw = Get-EnvValue "HOSTALIA_FTP_SSL"
$UseSsl = $false
if ($SslRaw -eq "true" -or $SslRaw -eq "1" -or $SslRaw -eq "yes") { $UseSsl = $true }

if (-not $FtpHost -or -not $FtpUser -or -not $FtpPass) {
    Write-Step "Credenciais FTP nao configuradas!" "ERROR"
    Write-Host ""
    Write-Host "Adicione ao arquivo .env (na raiz):" -ForegroundColor Yellow
    Write-Host '  HOSTALIA_FTP_HOST=ftp.seusite.com.br' -ForegroundColor Cyan
    Write-Host '  HOSTALIA_FTP_USER=seu_usuario' -ForegroundColor Cyan
    Write-Host '  HOSTALIA_FTP_PASS=sua_senha' -ForegroundColor Cyan
    Write-Host '  HOSTALIA_FTP_PATH=/web' -ForegroundColor Cyan
    Write-Host '  HOSTALIA_FTP_SSL=true' -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

if ($FtpPath -notmatch "^/") { $FtpPath = "/$FtpPath" }
if (-not $FtpPath) { $FtpPath = "/" }

if (-not (Test-Path $SiteDir)) {
    Write-Step "Pasta $SiteDir nao encontrada!" "ERROR"
    exit 1
}

Write-Step "Conectando em $FtpHost..." "INFO"
$BaseUri = "ftp://$FtpHost$FtpPath"
if (-not (Test-FtpDir -Uri $BaseUri -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl)) {
    Write-Step "Pasta remota $FtpPath nao existe. Tentando criar..." "WARN"
    $RootUri = "ftp://$FtpHost/"
    if (Test-FtpDir -Uri $RootUri -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl) {
        $Parts = $FtpPath.Split("/", [System.StringSplitOptions]::RemoveEmptyEntries)
        $Cur = "ftp://$FtpHost"
        foreach ($Part in $Parts) {
            $Cur = "$Cur/$Part"
            if (-not (Test-FtpDir -Uri $Cur -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl)) {
                try {
                    Invoke-FtpRequest -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory) -Uri $Cur -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl
                    Write-Step "  Criando pasta: $Cur" "OK"
                } catch {
                    Write-Step "  Falha ao criar ${Cur}: $($_.Exception.Message)" "WARN"
                }
            }
        }
    } else {
        Write-Step "Raiz FTP inacessível (verifique host/credenciais)." "ERROR"
        exit 1
    }
    if (-not (Test-FtpDir -Uri $BaseUri -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl)) {
        Write-Step "Pasta $FtpPath continua inexistente após tentativa. Ajuste HOSTALIA_FTP_PATH no .env" "WARN"
        exit 1
    }
}

$Files = Get-ChildItem -Path $SiteDir -Recurse -File -Force | Where-Object {
    $_.FullName -notlike "*\.vercel\*" -and
    $_.Name -ne "vercel.json" -and
    $_.Name -ne ".gitignore"
}

Write-Step "Enviando $($Files.Count) arquivos para Hostalia..." "INFO"

$Uploaded = 0
$Failed = 0
foreach ($File in $Files) {
    $RelPath = $File.FullName.Substring($SiteDir.Length).Replace("\", "/")
    $RemoteDir = ($BaseUri + $RelPath.Substring(0, $RelPath.LastIndexOf("/")))
    $RemoteFile = ($BaseUri + $RelPath)

    $DirExists = Test-FtpDir -Uri $RemoteDir -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl
    if (-not $DirExists) {
        $Parts = $RelPath.Substring(0, $RelPath.LastIndexOf("/")).Split("/", [System.StringSplitOptions]::RemoveEmptyEntries)
        $Cur = $BaseUri
        foreach ($Part in $Parts) {
            $Cur = "$Cur/$Part"
            if (-not (Test-FtpDir -Uri $Cur -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl)) {
                try {
                    Invoke-FtpRequest -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory) -Uri $Cur -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl
                    Write-Step "  Criando pasta: $Cur" "INFO"
                } catch {
                    Write-Step "  Falha ao criar pasta $Cur" "WARN"
                }
            }
        }
    }

    try {
        $Bytes = [System.IO.File]::ReadAllBytes($File.FullName)
        Invoke-FtpRequest -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile) -Uri $RemoteFile -Content $Bytes -FtpHost $FtpHost -FtpUser $FtpUser -FtpPass $FtpPass -UseSsl $UseSsl
        Write-Step "  OK: $RelPath" "OK"
        $Uploaded++
    } catch {
        Write-Step "  FALHA: $RelPath - $($_.Exception.Message)" "ERROR"
        $Failed++
    }
}

if ($CleanRemote) {
    Write-Step "Modo -CleanRemote: pastas extras nao sao removidas automaticamente." "WARN"
    Write-Step "Remova manualmente pelo gerenciador de arquivos do Hostalia." "WARN"
}

Write-Step "Envio concluido: $Uploaded ok, $Failed falhas" ($(if ($Failed -eq 0) { "OK" } else { "ERROR" }))
Write-Host ""
Write-Host "Site publicado em: http://$FtpHost" -ForegroundColor Green
Write-Host "Edite os arquivos pelo painel Hostalia (File Manager) se precisar." -ForegroundColor Cyan
Write-Host ""
