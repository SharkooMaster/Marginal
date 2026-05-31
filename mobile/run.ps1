# Installs dependencies (first run) and starts the Marginal Expo app (web).
# Usage:  right-click > Run with PowerShell, or:  .\run.ps1
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies (this can take a few minutes)..." -ForegroundColor Cyan
    npm install
}

Write-Host "Starting Expo (web). Press 'w' for web, or scan the QR with Expo Go." -ForegroundColor Green
npm run web
