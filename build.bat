@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Obsidian AI Agent Plugin Builder
echo ========================================
echo.

REM Check Node.js installation
echo [1/3] Checking Node.js installation...
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
if "%NODE_VERSION%"=="" (
    echo ERROR: Node.js not detected
    echo.
    echo Please install Node.js:
    echo 1. Visit https://nodejs.org/
    echo 2. Download and install LTS version (18.x or 20.x recommended)
    echo 3. Make sure to check "Add to PATH" during installation
    echo 4. IMPORTANT: Restart command prompt after installation!
    echo.
    echo You can verify by running: node -v
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo   Version: %NODE_VERSION%
echo.

REM Check npm installation
echo [2/3] Checking npm installation...
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
if "%NPM_VERSION%"=="" (
    echo ERROR: npm not detected
    echo npm usually comes with Node.js
    echo.
    pause
    exit /b 1
)

echo [OK] npm is installed
echo   Version: %NPM_VERSION%
echo.

REM Install dependencies and build
echo [3/3] Installing dependencies and building plugin...
echo.
echo Running: npm install...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Dependency installation failed
    echo.
    pause
    exit /b 1
)
echo.
echo [OK] Dependencies installed
echo.
echo Running: npm run build...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================
echo   Build successful!
echo ========================================
echo.
echo Generated file:
if exist main.js (
    echo [OK] main.js created
) else (
    echo [WARNING] main.js not found
)
echo.
echo Next steps:
echo 1. Copy main.js and manifest.json to your Obsidian vault
echo 2. Path: your-vault\.obsidian\plugins\obsidian-ai-agent\
echo 3. Enable the plugin in Obsidian settings
echo.
echo Press any key to exit...
pause >nul