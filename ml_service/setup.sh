#!/bin/bash

# CarbonX ML Service Setup Script
# Run this to set up the Python environment and dependencies

set -e

echo "=================================================="
echo "CarbonX ML Service - Setup Script"
echo "=================================================="

# Check Python version
echo ""
echo "Checking Python installation..."
python_version=$(python3 --version 2>&1)
echo "Found: $python_version"

if ! python3 --version &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo ""
echo "Installing Python dependencies..."
echo "(This may take 2-3 minutes on first install)"
pip install -r requirements.txt

# Create .env file if it doesn't exist
echo ""
echo "Configuring environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ Created .env file (update with your settings)"
else
    echo "✓ .env file already exists"
fi

# Create directories
echo ""
echo "Creating necessary directories..."
mkdir -p logs
mkdir -p cache
mkdir -p models

echo ""
echo "=================================================="
echo "✓ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Run tests:"
echo "   python test_models.py"
echo ""
echo "3. Start the ML service:"
echo "   python app.py"
echo ""
echo "4. (Optional) Run Jupyter notebook:"
echo "   jupyter notebook example_usage.ipynb"
echo ""
echo "ML Service will run on: http://localhost:5001"
echo ""
