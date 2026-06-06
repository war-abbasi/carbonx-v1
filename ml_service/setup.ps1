# CarbonX ML Service - Windows Setup Script
# Run this in PowerShell to set up the Python environment and dependencies

Write-Host "==================================================" -ForegroundColor Green
Write-Host "CarbonX ML Service - Windows Setup Script" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check Python
Write-Host ""
Write-Host "Checking Python installation..." -ForegroundColor Cyan

if (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonVersion = python3 --version 2>&1
    Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green
    $python = "python"
} else {
    Write-Host "❌ Python is not installed. Please install Python 3.11 or higher." -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path -Path "python")) {
    $python = "python3"
}

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Cyan

if (-not (Test-Path -Path "venv")) {
    & $python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Cyan

if (Test-Path -Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
Write-Host "(This may take 2-3 minutes on first install)" -ForegroundColor Yellow

pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "Configuring environment..." -ForegroundColor Cyan

if (-not (Test-Path -Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file (update with your settings)" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Create directories
Write-Host ""
Write-Host "Creating necessary directories..." -ForegroundColor Cyan

@("logs", "cache", "models") | ForEach-Object {
    if (-not (Test-Path -Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "✓ Created $_ directory" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Virtual environment is already activated (venv\Scripts\Activate.ps1)" -ForegroundColor White
Write-Host ""
Write-Host "2. Run tests:" -ForegroundColor White
Write-Host "   python test_models.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start the ML service:" -ForegroundColor White
Write-Host "   python app.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. (Optional) Run Jupyter notebook:" -ForegroundColor White
Write-Host "   jupyter notebook example_usage.ipynb" -ForegroundColor Cyan
Write-Host ""
Write-Host "ML Service will run on: http://localhost:5001" -ForegroundColor Green
Write-Host ""
