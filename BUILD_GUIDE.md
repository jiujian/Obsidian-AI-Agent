# Obsidian AI Agent 构建指南

## 问题诊断

如果 `npm` 命令无法识别，可能的原因：

1. **Node.js 未正确安装**
2. **环境变量未配置**
3. **需要重启终端**

## 解决方案

### 方案一：检查 Node.js 安装

#### Windows

1. **检查安装路径**
   ```cmd
   where node
   where npm
   ```

2. **如果未找到，重新安装 Node.js**
   - 访问 https://nodejs.org/
   - 下载 LTS 版本（推荐 18.x 或 20.x）
   - 运行安装程序，确保勾选"Add to PATH"
   - **重启命令提示符或终端**

3. **验证安装**
   ```cmd
   node -v
   npm -v
   ```

#### macOS / Linux

```bash
# 检查是否安装
which node
which npm

# 如果未安装（使用 Homebrew）
brew install node

# 验证安装
node -v
npm -v
```

### 方案二：使用 nvm（推荐开发环境）

如果 Node.js 版本管理有问题，建议使用 nvm（Node Version Manager）：

#### Windows (nvm-windows)

1. 下载：https://github.com/coreybutler/nvm-windows/releases
2. 安装 nvm-windows
3. 打开新的命令提示符（重要！）
4. 安装 Node.js：
   ```cmd
   nvm install 20
   nvm use 20
   ```

#### macOS / Linux

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc  # 或 source ~/.zshrc

# 安装 Node.js
nvm install 20
nvm use 20
```

## 标准构建流程

### 1. 安装依赖

在项目目录执行：

```bash
npm install
```

这将安装以下依赖：
- obsidian
- @types/node
- typescript
- esbuild
- builtin-modules
- tslib

### 2. 构建插件

#### 开发模式（带源码映射）

```bash
npm run dev
```

此命令会：
- 编译 TypeScript
- 监听文件变化
- 自动重新构建
- 生成 main.js

#### 生产构建（优化）

```bash
npm run build
```

此命令会：
- 编译 TypeScript
- 压缩代码
- 生成优化的 main.js
- 不包含源码映射

### 3. 验证构建结果

成功构建后，项目目录应该包含：

```
obsidian-ai-agent/
├── main.js              # ✅ 编译后的插件文件（必须）
├── main.js.map         # 开发模式生成的源码映射（可选）
├── manifest.json       # ✅ 插件清单（必须）
├── styles.css          # 如果有样式（可选）
└── (其他源码文件)
```

### 4. 安装到 Obsidian

#### 手动安装（开发用）

```bash
# 假设你的 vault 在 ~/Documents/MyVault
# Windows
xcopy /E /I main.js C:\Users\你的用户名\Documents\MyVault\.obsidian\plugins\obsidian-ai-agent\

# macOS / Linux
cp main.js ~/Documents/MyVault/.obsidian/plugins/obsidian-ai-agent/
```

#### 使用符号链接（推荐开发环境）

```bash
# 创建插件目录
mkdir -p ~/Documents/MyVault/.obsidian/plugins/obsidian-ai-agent

# 创建符号链接到构建文件
ln -s $(pwd)/main.js ~/Documents/MyVault/.obsidian/plugins/obsidian-ai-agent/main.js

# 复制 manifest.json
cp manifest.json ~/Documents/MyVault/.obsidian/plugins/obsidian-ai-agent/
```

## 替代方案：在线构建

如果本地无法构建，可以使用在线服务：

### GitHub Actions（推荐）

1. 将项目推送到 GitHub
2. 创建 `.github/workflows/build.yml`:

```yaml
name: Build Plugin

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: plugin
          path: main.js
```

3. 推送代码后，自动构建
4. 从 Actions 页面下载构建产物

### StackBlitz / Replit

1. 访问 https://stackblitz.com/
2. 导入项目
3. 在线运行构建命令
4. 下载 main.js

## 手动编译（不推荐）

如果没有构建工具，可以：

1. 使用在线 TypeScript 编译器：https://www.typescriptlang.org/play
2. 将所有 .ts 文件内容复制到编辑器
3. 复制编译后的 JavaScript
4. 手动合并到 main.js

**注意**：这种方法很繁琐，不推荐。

## 常见问题

### Q1: npm install 报错

**错误信息**: `ENOENT: no such file or directory`

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### Q2: TypeScript 编译错误

**错误信息**: `Cannot find module 'obsidian'`

**解决方案**:
```bash
# 确保安装了依赖
npm install

# 如果还是有问题，手动安装
npm install --save-dev obsidian
```

### Q3: esbuild 错误

**错误信息**: `esbuild command not found`

**解决方案**:
```bash
# 本地安装 esbuild
npm install --save-dev esbuild

# 或者全局安装
npm install -g esbuild
```

### Q4: 构建的 main.js 文件很大

**原因**: 开发模式包含源码映射

**解决方案**: 使用生产构建
```bash
npm run build
```

### Q5: Windows 权限问题

**错误信息**: `Access denied`

**解决方案**:
```cmd
# 以管理员身份运行命令提示符
# 右键点击"命令提示符" → "以管理员身份运行"
```

## 验证构建成功

### 检查清单

- [ ] main.js 文件存在且不为空
- [ ] main.js 文件大小合理（通常 100KB - 500KB）
- [ ] manifest.json 文件存在
- [ ] 没有编译错误

### 在 Obsidian 中测试

1. 打开 Obsidian
2. 进入 设置 → 第三方插件
3. 确保"安全模式"已关闭
4. 点击"浏览" → 关联本地插件目录
5. 找到 obsidian-ai-agent 并启用
6. 测试基本功能

## 快速构建脚本

创建 `build.sh`（Linux/macOS）或 `build.bat`（Windows）：

### build.bat

```batch
@echo off
echo Installing dependencies...
call npm install
echo.
echo Building plugin...
call npm run build
echo.
echo Build complete!
echo.
echo Files generated:
dir main.js
echo.
echo To install, copy main.js and manifest.json to your Obsidian plugin folder.
pause
```

### build.sh

```bash
#!/bin/bash
echo "Installing dependencies..."
npm install

echo ""
echo "Building plugin..."
npm run build

echo ""
echo "Build complete!"
echo ""
echo "Files generated:"
ls -lh main.js

echo ""
echo "To install, copy main.js and manifest.json to your Obsidian plugin folder."
```

## 发布准备

如果要发布到插件市场，需要：

1. **确保版本号正确**
   - 更新 `manifest.json` 中的版本
   - 更新 `package.json` 中的版本

2. **清理构建文件**
   ```bash
   # 删除源码映射
   rm main.js.map
   ```

3. **创建发布包**
   ```bash
   # 创建发布目录
   mkdir release
   cp main.js manifest.json styles.css release/
   
   # 压缩
   zip -r obsidian-ai-agent-v1.0.0.zip release/
   ```

4. **更新文档**
   - 更新 README.md
   - 更新 CHANGELOG.md

## 获取帮助

如果仍然遇到问题：

1. 检查 Node.js 版本：`node -v`（建议 16.x+）
2. 检查 npm 版本：`npm -v`（建议 8.x+）
3. 查看完整错误日志
4. 在 GitHub 提交 Issue，包含：
   - 操作系统版本
   - Node.js 和 npm 版本
   - 完整的错误信息

---

**祝你构建顺利！** 🚀