# PowerShell script to help verify PostgreSQL password

Write-Host "`n🔍 PostgreSQL Password Verification`n" -ForegroundColor Cyan

Write-Host "Step 1: Let's test if 'admin' password works..." -ForegroundColor Yellow
Write-Host "Run this command and enter 'admin' when prompted:`n" -ForegroundColor White
Write-Host "  psql -h localhost -U postgres -d react_flow_db`n" -ForegroundColor Green

Write-Host "If that fails, try connecting with pgAdmin:" -ForegroundColor Yellow
Write-Host "  1. Open pgAdmin" -ForegroundColor White
Write-Host "  2. Try to connect with:" -ForegroundColor White
Write-Host "     - Username: postgres" -ForegroundColor White
Write-Host "     - Password: admin" -ForegroundColor White
Write-Host "`nIf connection fails, your password is NOT 'admin'`n" -ForegroundColor Red

Write-Host "Step 2: Check your .env file:" -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    Write-Host "✅ .env file found at: $envPath" -ForegroundColor Green
    Write-Host "`nCurrent content:" -ForegroundColor Cyan
    Get-Content $envPath | ForEach-Object {
        if ($_ -match "PASSWORD") {
            Write-Host "  $_" -ForegroundColor Yellow
        } else {
            Write-Host "  $_"
        }
    }
} else {
    Write-Host "❌ .env file NOT found at: $envPath" -ForegroundColor Red
    Write-Host "`nCreating .env file with default values..." -ForegroundColor Yellow
    @"
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=react_flow_db
DB_USER=postgres
DB_PASSWORD=admin
CORS_ORIGIN=http://localhost:5173
"@ | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "✅ Created .env file. Please update DB_PASSWORD with your actual password." -ForegroundColor Green
}

Write-Host "`nStep 3: To update password in .env file:" -ForegroundColor Yellow
Write-Host "  Edit server\.env and change DB_PASSWORD=your_actual_password" -ForegroundColor White
Write-Host "`n" -ForegroundColor White



