# Obsidian AI Agent Plugin Builder
# PowerShell version for better compatibility

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Obsidian AI Agent Plugin Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "[1/3] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "[OK] Node.js is installed" -ForegroundColor Green
    Write-Host "  Version: $nodeVersion" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "ERROR: Node.js not detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js:" -ForegroundColor Yellow
    Write-Host "1. Visit https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Download and install LTS version (18.x or 20.x recommended)" -ForegroundColor White
    Write-Host "3. Make sure to check 'Add to PATH' during installation" -ForegroundColor White
    Write-Host "4. IMPORTANT: Restart PowerShell terminal after installation!" -ForegroundColor White
    Write-Host ""
    Write-Host "You can verify by running: node -v" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm installation
Write-Host "[2/3] Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "npm not found"
    }
    Write-Host "[OK] npm is installed" -ForegroundColor Green
    Write-Host "  Version: $npmVersion" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "ERROR: npm not detected" -ForegroundColor Red
    Write-Host "npm usually comes with Node.js" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies and build
Write-Host "[3/3] Installing dependencies and building plugin..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Running: npm install..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Dependency installation failed" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "Running: npm run build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Generated file:" -ForegroundColor Yellow
if (Test-Path main.js) {
    Write-Host "[OK] main.js created" -ForegroundColor Green
} else {
    Write-Host "[WARNING] main.js not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy main.js and manifest.json to your Obsidian vault" -ForegroundColor White
Write-Host "2. Path: your-vault\.obsidian\plugins\obsidian-ai-agent\" -ForegroundColor White
Write-Host "3. Enable the plugin in Obsidian settings" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"