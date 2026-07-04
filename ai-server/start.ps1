# ============================================================
# start.ps1 -- Kiem tra va khoi dong AI Server (CCCD Verifier)
# Cach dung: cd D:\Hotel-management-system\Hotel-system-backend\ai-server
#            .\start.ps1
# ============================================================

$CONTAINER_NAME = "cccd-ai-server"
$IMAGE_NAME     = "cccd-ai-server:latest"
$PORT           = 8000
$HEALTH_URL     = "http://localhost:$PORT/health"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CCCD AI Server -- Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -- 1. Kiem tra Docker Desktop dang chay khong ---------------
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker not running" }
    Write-Host "[OK] Docker Desktop: Dang chay" -ForegroundColor Green
} catch {
    Write-Host "[ERR] Docker Desktop chua bat! Hay mo Docker Desktop truoc." -ForegroundColor Red
    exit 1
}

# -- 2. Kiem tra image da build chua --------------------------
$imageExists = docker images -q $IMAGE_NAME
if (-not $imageExists) {
    Write-Host "[WARN] Image '$IMAGE_NAME' chua duoc build." -ForegroundColor Yellow
    Write-Host "[...] Dang build image (lan dau mat 10-15 phut)..." -ForegroundColor Yellow
    docker build -t $IMAGE_NAME .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERR] Build that bai!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Build thanh cong!" -ForegroundColor Green
} else {
    Write-Host "[OK] Docker Image:   Da san sang" -ForegroundColor Green
}

# -- 3. Kiem tra container dang chay khong --------------------
$running = docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" -q
$stopped = docker ps -a --filter "name=$CONTAINER_NAME" --filter "status=exited" -q

if ($running) {
    Write-Host "[OK] Container:      Dang chay (port $PORT)" -ForegroundColor Green
} elseif ($stopped) {
    Write-Host "[WARN] Container bi dung. Dang khoi dong lai..." -ForegroundColor Yellow
    docker start $CONTAINER_NAME
    Write-Host "[OK] Container da khoi dong lai!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Container chua ton tai. Dang tao moi..." -ForegroundColor Yellow
    docker run -d `
        --name $CONTAINER_NAME `
        --restart always `
        -p "${PORT}:${PORT}" `
        $IMAGE_NAME
    Write-Host "[OK] Container da duoc tao va chay!" -ForegroundColor Green
}

# -- 4. Kiem tra health endpoint ------------------------------
Write-Host ""
Write-Host "[...] Cho server khoi dong (toi da 60s)..." -ForegroundColor Gray

$ok = $false
for ($i = 1; $i -le 12; $i++) {
    Start-Sleep -Seconds 5
    try {
        $res = Invoke-RestMethod -Uri $HEALTH_URL -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($res.status -eq "ok") {
            $ok = $true
            break
        }
    } catch {}
    Write-Host "  ... ($($i * 5)s)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($ok) {
    Write-Host "[ONLINE] AI Server dang chay tai: $HEALTH_URL" -ForegroundColor Green
    Write-Host "         Node.js backend co the goi duoc ngay!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Server chua phan hoi sau 60s." -ForegroundColor Yellow
    Write-Host "       Xem log: docker logs $CONTAINER_NAME" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
