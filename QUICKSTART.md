# Obsidian AI Agent 快速开始指南

## ⚡ 5 分钟快速开始

### 步骤 1：安装 Node.js（必须）

1. 访问：https://nodejs.org/
2. 下载 **LTS 版本**（推荐 18.x 或 20.x）
3. 运行安装程序
4. **重要**：安装时确保勾选 "Add to PATH"
5. 安装完成后，**重新打开命令提示符**（关闭旧窗口，打开新的）

验证安装：
```cmd
node -v
npm -v
```

如果显示版本号，说明安装成功！

### 步骤 2：构建插件

#### 方法 A：使用构建脚本（推荐）

双击运行 `build.bat` 文件，脚本会自动：
- 检查 Node.js 安装
- 安装依赖
- 构建插件
- 显示结果

#### 方法 B：手动命令

在项目目录打开命令提示符，运行：

```cmd
npm install
npm run build
```

### 步骤 3：安装到 Obsidian

1. 找到你的 Obsidian vault 文件夹
2. 进入 `.obsidian\plugins\` 目录
3. 创建文件夹 `obsidian-ai-agent`
4. 复制以下文件到该文件夹：
   - ✅ `main.js`（构建生成的）
   - ✅ `manifest.json`（项目中的）

5. 打开 Obsidian
6. 进入 设置 → 第三方插件
7. 找到 "Obsidian AI Agent" 并启用

### 步骤 4：配置 API Key

1. 在 Obsidian 设置中打开 "Obsidian AI Agent"
2. 填入你的 API Key：
   - **DeepSeek**: https://platform.deepseek.com/ 获取
   - **智谱 AI**: https://open.bigmodel.cn/ 获取
3. 点击"测试连接"验证

### 步骤 5：开始使用

- 选中文本按 `Ctrl + Shift + A` 处理选中文本
- 按 `Ctrl + Shift + F` 处理整个文件
- 或点击左侧工具栏的 AI 图标

## 📦 完整安装流程图

```
安装 Node.js
    ↓
验证: node -v, npm -v
    ↓
运行: npm install (安装依赖)
    ↓
运行: npm run build (编译插件)
    ↓
生成 main.js
    ↓
复制到 Obsidian 插件目录
    ↓
在 Obsidian 中启用
    ↓
配置 API Key
    ↓
✅ 开始使用
```

## 🔧 常见问题快速解决

### 问题：npm 命令无法识别

**症状**：运行 `npm -v` 提示"不是内部或外部命令"

**解决**：
1. 确认 Node.js 已安装
2. **重启命令提示符**（最重要！）
3. 如果还不行，重启电脑

### 问题：构建失败

**症状**：运行 `npm run build` 报错

**解决**：
```cmd
# 清除缓存并重试
npm cache clean --force
rmdir /s /q node_modules
npm install
npm run build
```

### 问题：插件在 Obsidian 中不显示

**症状**：设置中找不到插件

**解决**：
1. 确认文件在正确位置：`.obsidian/plugins/obsidian-ai-agent/`
2. 确保 `main.js` 和 `manifest.json` 都在该目录
3. 重启 Obsidian
4. 关闭"安全模式"

### 问题：API Key 测试失败

**症状**：点击"测试连接"提示失败

**解决**：
1. 检查 API Key 是否正确复制
2. 确认账户有足够的余额/额度
3. 检查网络连接
4. 尝试不同的 API 提供商

## 📁 项目文件说明

```
obsidian-ai-agent/
├── main.ts              # 源代码（不要手动复制）
├── types.ts             # 类型定义
├── providers/           # AI 提供商
├── manifest.json        # ⚠️ 需要复制到 Obsidian
├── package.json         # 项目配置
├── esbuild.config.mjs  # 构建配置
├── build.bat           # ⭐ Windows 快速构建脚本
├── main.js            # ✅ 构建后需要复制到 Obsidian
└── *.md               # 文档文件
```

## 🎯 快速测试

安装成功后，试试这个测试：

1. 新建一个笔记
2. 输入：`人工智能是计算机科学的一个分支。`
3. 选中这段文字
4. 按 `Ctrl + Shift + A`
5. 点击"总结"
6. 等待 AI 处理完成

如果看到 AI 生成的总结，恭喜你，一切正常！🎉

## 📚 更多资源

- **完整文档**：查看 README.md
- **安装指南**：查看 INSTALLATION.md
- **使用示例**：查看 USAGE_EXAMPLES.md
- **构建指南**：查看 BUILD_GUIDE.md
- **项目总结**：查看 PROJECT_SUMMARY.md

## 🆘 获取帮助

如果遇到问题：

1. 查看 BUILD_GUIDE.md 的详细故障排除
2. 检查 Obsidian 开发者控制台（Ctrl + Shift + I）
3. 在 GitHub 提交 Issue

## 🚀 下一步

配置完成后，你可以：

- 创建自定义 Prompt 模板
- 调整输出格式和位置
- 设置不同的 AI 模型
- 启用调用日志查看使用情况

---

**祝你使用愉快！** ✨