#!/usr/bin/env pwsh
# ReviewLens Development Startup Script
# Usage: .\start-dev.ps1

Write-Host "🚀 Starting ReviewLens Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python from https://www.python.org" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js and Python detected" -ForegroundColor Green
Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

# Install backend dependencies if needed
$backendVenv = "backend/venv"
if (-not (Test-Path $backendVenv)) {
    Write-Host "📦 Setting up backend Python environment..." -ForegroundColor Yellow
    cd backend/app
    python -m venv ../venv
    & ../venv/Scripts/Activate.ps1
    pip install -r requirements.txt
    cd ../..
    Write-Host "✅ Backend environment ready" -ForegroundColor Green
} else {
    Write-Host "✅ Backend environment already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start backend in background
Write-Host "📡 Starting backend API on http://localhost:8000" -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-Command cd backend/app; & ../../backend/venv/Scripts/Activate.ps1; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -PassThru

# Start frontend
Write-Host "🌐 Starting frontend on http://localhost:3000" -ForegroundColor Yellow
cd frontend
npm run dev

# Cleanup on exit
trap {
    Write-Host ""
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 0
}
