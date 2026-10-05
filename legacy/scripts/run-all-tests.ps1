# Chạy toàn bộ kiểm thử trước khi merge (xem README "Kiểm tra trước khi merge").
# Dùng từ gốc repo: powershell -File scripts/run-all-tests.ps1

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "--- [1/2] Python: kiểm tra quy tắc trường + pytest (pythonpath = . trong pytest.ini) ---" -ForegroundColor Yellow
python scripts/validate_school_rules.py
if ($LASTEXITCODE -ne 0) { Write-Host "validate_school_rules failed" -ForegroundColor Red; exit 1 }
python -m pytest -q
if ($LASTEXITCODE -ne 0) { Write-Host "pytest failed" -ForegroundColor Red; exit 1 }

Write-Host "--- [2/2] Frontend: lint, typecheck, test, build ---" -ForegroundColor Yellow
Push-Location frontend
try {
    foreach ($script in @("lint", "typecheck", "test", "build")) {
        npm run $script
        if ($LASTEXITCODE -ne 0) { Write-Host "npm run $script failed" -ForegroundColor Red; exit 1 }
    }
} finally {
    Pop-Location
}

Write-Host "All checks passed." -ForegroundColor Green
