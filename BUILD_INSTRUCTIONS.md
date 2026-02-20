# 构建脚本使用说明

本项目提供了两个构建脚本，分别适用于不同的命令行环境：

## 脚本说明

### 1. `build.ps1` (推荐)
- **适用环境**: PowerShell (Windows PowerShell 或 PowerShell 7+)
- **优点**: 
  - 彩色输出，更易读
  - 更好的错误处理
  - 兼容性更好
  - 无编码问题
- **使用方法**: 在 PowerShell 中运行 `.\build.ps1`

### 2. `build.bat`
- **适用环境**: Windows 命令提示符 (cmd.exe)
- **使用方法**: 在 cmd 中运行 `build.bat`

## 使用步骤

### PowerShell 环境（推荐）
1. 在项目根目录打开 PowerShell
2. 如果遇到执行策略限制，运行：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. 运行构建脚本：
   ```powershell
   .\build.ps1
   ```
4. 脚本会自动：
   - 检查 Node.js 和 npm 安装
   - 安装依赖包
   - 构建插件
   - 显示构建结果

### CMD 环境
1. 在项目根目录打开命令提示符
2. 运行构建脚本：
   ```cmd
   build.bat
   ```
3. 脚本会自动完成上述步骤

## 常见问题

### Q: 提示"未检测到 Node.js"，但我已经安装了
**A**: 可能的原因和解决方案：
1. Node.js 未添加到 PATH 环境变量
   - 重新安装 Node.js，确保勾选"Add to PATH"选项
   - 或手动将 Node.js 安装路径添加到 PATH
2. 环境变量未生效
   - 关闭所有命令行窗口（包括 VS Code 终端）
   - 重新打开命令行窗口
3. 验证安装
   - 运行 `node -v` 检查 Node.js 是否可访问

### Q: PowerShell 提示"无法加载文件，因为在此系统上禁止运行脚本"
**A**: 这是 PowerShell 的执行策略限制。解决方法：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q: 构建成功后如何使用插件？
**A**: 
1. 将 `main.js` 和 `manifest.json` 复制到你的 Obsidian vault
2. 路径：`你的vault\.obsidian\plugins\obsidian-ai-agent\`
3. 在 Obsidian 设置中启用插件

### Q: 如何只安装依赖或只构建？
**A**: 
- 只安装依赖：`npm install`
- 只构建：`npm run build`
- 开发模式：`npm run dev`

## 构建输出

构建成功后，会在项目根目录生成以下文件：
- `main.js` - 编译后的插件主文件
- `manifest.json` - 插件清单文件（已存在）

## 系统要求

- Node.js: 18.x 或更高版本（推荐 LTS 版本）
- npm: 随 Node.js 自动安装
- PowerShell 或 cmd

## 技术支持

如遇到其他问题，请检查：
1. Node.js 和 npm 版本是否符合要求
2. 网络连接是否正常（用于下载依赖）
3. 磁盘空间是否充足
4. 是否有足够的文件读写权限