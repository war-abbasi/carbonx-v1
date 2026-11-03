# CarbonX — start everything locally (no cloud services needed)
#   Frontend  http://localhost:3000   (Vite + React)
#   Backend   http://localhost:5000   (Express + Prisma + SQLite)
#   ML        http://localhost:5001   (Flask: Prophet / XGBoost / Holt-Winters)
#   AI        hosted OpenAI-compatible API (key + model in backend/.env)
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\start-local.ps1

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# Pick up Node/Python even if this shell was opened before they were installed
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

Write-Host "`n== CarbonX local start ==" -ForegroundColor Green

# 1. AI key check (hosted, OpenAI-compatible provider configured in backend/.env)
$key = ((Get-Content "$root\backend\.env" | Where-Object { $_ -match '^LLM_API_KEY=' }) -replace '^LLM_API_KEY=', '').Trim()
if (-not $key) {
    Write-Host "LLM_API_KEY is empty in backend\.env - AI chat will be offline (rule-based insights still work)." -ForegroundColor Yellow
}

# 2. Backend deps + database
Push-Location "$root\backend"
if (-not (Test-Path node_modules)) { npm install }
npx prisma db push --skip-generate | Out-Null
npx prisma generate | Out-Null
node scripts/seedDemo.js
Pop-Location

# 3. Frontend deps
if (-not (Test-Path "$root\frontend\node_modules")) { Push-Location "$root\frontend"; npm install; Pop-Location }

# 4. ML service venv
$py = "$root\ml_service\.venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    python -m venv "$root\ml_service\.venv"
    & $py -m pip install flask flask-cors python-dotenv numpy pandas scikit-learn xgboost prophet requests python-dateutil
}

# 5. Launch the three services in their own windows
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\ml_service'; `$env:ML_SERVICE_PORT='5001'; & '$py' app.py"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\backend'; npm start"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\frontend'; npm run dev"

Write-Host "`nCarbonX is starting. Open http://localhost:3000" -ForegroundColor Green
Write-Host "  Admin: admin@carbonx.com / Admin@CarbonX1"
Write-Host "  User:  demo@carbonx.com  / Demo@CarbonX1`n"
