# Obsidian AI Agent 安装指南

本指南将帮助你安装和配置 Obsidian AI Agent 插件。

## 系统要求

- Obsidian 桌面应用（Windows / macOS / Linux）
- Obsidian 版本 0.15.0 或更高
- 至少一个 AI 提供商的 API Key（DeepSeek 或智谱 AI）

## 安装方法

### 方法一：从 GitHub 下载（推荐）

#### 步骤 1：下载插件

1. 访问插件的 GitHub 仓库
2. 点击 "Code" → "Download ZIP" 下载最新版本
3. 解压 ZIP 文件到任意位置

#### 步骤 2：复制到 Obsidian 插件目录

**Windows**:
```
1. 打开你的 Obsidian vault 所在文件夹
2. 进入 `.obsidian/plugins/` 目录
3. 创建新文件夹 `obsidian-ai-agent`
4. 将解压后的所有文件复制到该文件夹
```

**macOS / Linux**:
```bash
# 假设你的 vault 在 ~/Documents/MyVault
cd ~/Documents/MyVault/.obsidian/plugins
mkdir obsidian-ai-agent
# 将插件文件复制到 obsidian-ai-agent 目录
```

#### 步骤 3：启用插件

1. 打开 Obsidian
2. 进入 设置 → 第三方插件
3. 找到 "Obsidian AI Agent" 并启用

### 方法二：使用 Obsidian 插件市场（如果已发布）

1. 打开 Obsidian
2. 进入 设置 → 社区插件
3. 关闭"安全模式"（如果已启用）
4. 点击"浏览"按钮
5. 搜索 "Obsidian AI Agent"
6. 点击"安装"按钮
7. 安装完成后，点击"启用"

### 方法三：开发模式（用于开发者）

如果你是开发者或想要从源代码构建：

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/obsidian-ai-agent.git
cd obsidian-ai-agent

# 2. 安装依赖
npm install

# 3. 构建插件
npm run build

# 4. 将 main.js 和 manifest.json 复制到 Obsidian 插件目录
# (见方法一的步骤 2)
```

## 配置指南

### 1. 获取 API Key

#### DeepSeek API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 点击"创建 API Key"
5. 复制生成的 API Key（格式如：sk-xxxxx）

#### 智谱 AI API Key

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入 API Key 管理页面
4. 创建新的 API Key
5. 复制生成的 API Key

### 2. 配置插件

#### 基础配置

1. 打开 Obsidian 设置 → 第三方插件 → Obsidian AI Agent
2. 在"DeepSeek 配置"或"智谱 AI 配置"部分填入你的 API Key
3. 点击"测试连接"验证配置是否正确
4. 如果测试成功，会显示"连接成功"提示

#### 高级配置

**Base URL（仅 DeepSeek）**:
- 默认：`https://api.deepseek.com`
- 如果使用代理或私有部署，可以修改此 URL

**默认提供商**:
- 选择常用的 AI 提供商
- 建议选择你拥有 API Key 的提供商

**默认模型**:
- DeepSeek: `deepseek-chat`（推荐）或 `deepseek-reasoner`
- 智谱 AI: `glm-4` 或 `glm-4-flash`（更快）

**最大 Tokens**:
- 控制单次请求的输出长度
- 推荐值：1000-3000
- 值越大，输出越长，但成本也越高

**Temperature**:
- 控制生成文本的随机性
- 范围：0-2
- 0：确定性输出
- 1：平衡输出
- 2：高度随机输出

#### 输出配置

**插入位置**:
- 光标位置：在光标处插入
- 选中内容下方：在选中文本后插入
- 新建文件：创建新文件并写入内容

**插入格式**:
- 纯文本：简单文本
- Markdown：带标题的 Markdown 格式
- Callout：折叠块格式（适合管理大量 AI 生成内容）

## 验证安装

### 快速测试

1. 打开一个新的 Markdown 文件
2. 输入一段测试文本，例如：
   ```
   人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
   ```
3. 选中这段文本
4. 按 `Ctrl/Cmd + Shift + A` 或点击工具栏 AI 图标
5. 选择"总结"模板
6. 如果看到 AI 生成的总结，说明安装成功！

### 检查日志

如果遇到问题，可以查看日志：

1. 按 `Ctrl/Cmd + Shift + I` 打开开发者工具
2. 切换到 "Console" 标签
3. 查找相关错误信息

## 常见问题

### Q: 插件没有出现在设置中

**A**: 
1. 确认文件是否在正确的目录：`.obsidian/plugins/obsidian-ai-agent/`
2. 检查 `manifest.json` 文件是否存在
3. 重启 Obsidian

### Q: 点击"测试连接"失败

**A**: 
1. 检查 API Key 是否正确
2. 确认账户有足够的余额/额度
3. 检查网络连接
4. 查看 Obsidian 控制台的错误信息

### Q: 快捷键不工作

**A**: 
1. 进入 设置 → 快捷键
2. 搜索 "AI"
3. 检查快捷键是否被占用
4. 可以手动设置新的快捷键

### Q: AI 输出为空或中断

**A**: 
1. 增加设置中的 "最大 Tokens" 值
2. 检查网络连接
3. 尝试使用不同的模型
4. 减少输入文本的长度

### Q: TypeScript 编译错误

**A**: 
1. 运行 `npm install` 安装依赖
2. 确保 Node.js 版本 >= 16
3. 删除 `node_modules` 和 `package-lock.json`，重新安装

## 卸载插件

### 完全卸载

1. 进入 Obsidian 设置 → 第三方插件
2. 找到 "Obsidian AI Agent" 并禁用
3. 删除 `.obsidian/plugins/obsidian-ai-agent/` 目录
4. （可选）删除插件数据：`.obsidian/plugins/obsidian-ai-agent/data.json`

### 保留配置卸载

1. 仅禁用插件（不删除文件）
2. 配置会被保留，下次启用时可以直接使用

## 更新插件

### 方法一：重新下载

1. 下载最新版本
2. 覆盖现有文件（保留 `data.json` 以保留配置）
3. 重启 Obsidian

### 方法二：Git 更新（开发者）

```bash
cd obsidian-ai-agent
git pull
npm install
npm run build
```

## 安全建议

1. **保护 API Key**: 不要将 API Key 分享给他人
2. **定期更换**: 定期更换 API Key 以提高安全性
3. **监控使用量**: 在各 AI 提供商网站监控 API 使用量
4. **本地存储**: 插件仅将 API Key 存储在本地，不会上传到任何地方

## 获取帮助

如果遇到问题：

1. 查看 [README.md](README.md) 了解功能详情
2. 查看 [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) 查看使用示例
3. 在 GitHub 提交 Issue
4. 加入用户社区讨论

## 下一步

安装完成后，建议阅读：

- [使用示例](USAGE_EXAMPLES.md) - 学习如何高效使用插件
- [自定义 Prompt 模板](README.md#添加内置-prompt-模板) - 创建适合你的模板
- [工作流程示例](USAGE_EXAMPLES.md#工作流程示例) - 优化你的工作流

---

**祝你使用愉快！** 🚀