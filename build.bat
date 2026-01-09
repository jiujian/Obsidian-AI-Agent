@echo off
chcp 65001 >nul
echo ========================================
echo   Obsidian AI Agent 插件构建脚本
echo ========================================
echo.

REM 检查 Node.js 是否安装
echo [1/3] 检查 Node.js 安装...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js
    echo.
    echo 请按以下步骤安装：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本（推荐 18.x 或 20.x）
    echo 3. 安装时确保勾选 "Add to PATH"
    echo 4. 重要：重启此命令提示符窗口！
    echo 5. 然后重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
node -v
echo.

REM 检查 npm 是否安装
echo [2/3] 检查 npm 安装...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 npm
    pause
    exit /b 1
)

echo ✓ npm 已安装
npm -v
echo.

REM 安装依赖
echo [3/3] 安装依赖并构建插件...
echo.
echo 正在运行: npm install...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ 依赖安装失败
    echo.
    pause
    exit /b 1
)
echo.
echo ✓ 依赖安装成功
echo.
echo 正在运行: npm run build...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 构建失败
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================
echo   ✓ 构建成功！
echo ========================================
echo.
echo 生成的文件：
dir main.js | findstr main.js
echo.
echo 下一步：
echo 1. 将 main.js 和 manifest.json 复制到你的 Obsidian vault
echo 2. 路径：你的vault\.obsidian\plugins\obsidian-ai-agent\
echo 3. 在 Obsidian 设置中启用插件
echo.
echo 按任意键退出...
pause >nul
