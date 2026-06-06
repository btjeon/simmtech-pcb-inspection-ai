# PCB Inspection AI - 서버 시작 스크립트
# 현재 WiFi IP를 자동 감지하여 환경변수에 적용

$ErrorActionPreference = "Stop"

# 현재 IP 감지 (Wi-Fi 우선, 없으면 이더넷)
$ip = (Get-NetIPAddress -AddressFamily IPv4 `
    | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } `
    | Sort-Object -Property PrefixLength -Descending `
    | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "[ERROR] IP 주소를 감지할 수 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PCB Inspection AI 서버 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  현재 IP: $ip" -ForegroundColor Yellow
Write-Host "  프론트엔드: http://$($ip):3000" -ForegroundColor Green
Write-Host "  백엔드 API: http://$($ip):8000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root "services\frontend"
$backendDir  = Join-Path $root "services\backend-core"
$envFile     = Join-Path $frontendDir ".env.local"

# .env.local의 NEXTAUTH_URL을 현재 IP로 동적 업데이트
$envContent = Get-Content $envFile -Raw
$envContent = $envContent -replace 'NEXTAUTH_URL="http://[^"]*"', "NEXTAUTH_URL=`"http://$($ip):3000`""
Set-Content $envFile $envContent -NoNewline
Write-Host "[OK] NEXTAUTH_URL → http://$($ip):3000" -ForegroundColor Green

# 백엔드 시작 (새 창)
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$backendDir'; Write-Host '[Backend] 시작 중...' -ForegroundColor Cyan; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

# 프론트엔드 시작 (현재 창)
Write-Host "[Frontend] 시작 중..." -ForegroundColor Cyan
Set-Location $frontendDir
npm run dev
