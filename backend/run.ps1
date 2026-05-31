# Sets up (first run) and starts the Marginal Django backend.
# Usage:  right-click > Run with PowerShell, or:  .\run.ps1
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv .venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\.venv\Scripts\Activate.ps1"

Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host "Applying migrations..." -ForegroundColor Cyan
python manage.py makemigrations api
python manage.py migrate

# Seed demo data only if the database has no projects yet.
$projectCount = python manage.py shell -c "from api.models import Project; print(Project.objects.count())"
if ($projectCount.Trim() -eq "0") {
    Write-Host "Seeding demo data..." -ForegroundColor Cyan
    python manage.py seed
}

Write-Host "Starting server on http://127.0.0.1:8000 ..." -ForegroundColor Green
python manage.py runserver 0.0.0.0:8000
