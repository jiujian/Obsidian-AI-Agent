# Obsidian AI Agent

在 Obsidian 中无缝集成 DeepSeek 和智谱 AI，提供强大的 AI 辅助写作和处理功能。

## 功能特性

### 🤖 多模型支持
- **DeepSeek**: 支持 deepseek-chat 和 deepseek-reasoner 模型
- **智谱 AI (GLM)**: 支持 glm-4 和 glm-4-flash 模型
- **自定义模型**: 支持添加任意新模型，无需更新插件
- 统一的 AI 调用接口，便于扩展其他模型

### 🎯 多种使用方式
- **快捷键**: 
  - `Ctrl/Cmd + Shift + A`: 处理选中文本
  - `Ctrl/Cmd + Shift + F`: 处理当前文件
  - `Ctrl/Cmd + P` → 搜索 "AI" 相关命令
- **工具栏按钮**: 点击左侧功能区 AI 图标快速访问
- **AI 助手面板**: 集中管理和快速操作

### 📝 丰富的 Prompt 模板
内置 10 种常用模板：
- **总结**: 提取内容关键要点
- **要点提取**: 整理成清晰列表
- **翻译**: 中英互译
- **改写/润色**: 优化文本表达
- **代码解释**: 详细解释代码逻辑
- **扩展内容**: 增加细节和深度
- **简化内容**: 让文本更易理解
- **语法修正**: 检查拼写和语法
- **关键词提取**: 提取关键词
- **自定义模板**: 支持用户创建自己的模板

### ⚙️ 灵活的输出配置
- **插入位置**:
  - 光标位置
  - 选中内容下方
  - 新建 Markdown 文件
- **输出格式**:
  - 纯文本
  - Markdown 格式（带标题）
  - Callout 折叠块

### 🔒 隐私与安全
- 所有数据仅发送到您选择的 AI 模型 API
- 不上传任何内容到第三方服务器
- API Key 本地加密存储
- 可选的本地调用日志（记录调用历史和 Token 使用量）

## 安装方法

### 方法一：预编译版本安装（推荐）⭐

如果你已经有了编译好的文件，只需 2 个文件即可：

1. **找到你的 Obsidian vault 目录**
   - Windows: `C:\Users\你的用户名\Documents\你的Vault`
   - macOS: `~/Documents/你的Vault`
   - Linux: `~/Documents/你的Vault`

2. **创建插件目录**
   ```
   你的Vault\.obsidian\plugins\obsidian-ai-agent\
   ```
   
   如果 `plugins` 目录不存在，请先创建它。

3. **复制文件**
   将以下 2 个文件复制到上述目录：
   - `main.js` （必须）
   - `manifest.json` （必须）

4. **启用插件**
   - 打开 Obsidian
   - 进入 **设置** → **第三方插件**
   - 找到 "Obsidian AI Agent"
   - 点击启用开关

5. **配置 API Key**
   - 进入插件设置
   - 填入 DeepSeek 或智谱 AI 的 API Key
   - 点击"测试连接"验证

### 方法二：手动安装（源代码）

1. 克隆或下载此项目的所有文件
2. 复制到你的 Obsidian vault 的 `.obsidian/plugins/obsidian-ai-agent/` 目录
3. 运行 `npm install` 安装依赖
4. 运行 `npm run build` 编译插件
5. 在 Obsidian 设置中启用 "Obsidian AI Agent" 插件

### 方法三：从 Obsidian 社区插件市场安装【暂未发布】

1. 打开 Obsidian 设置 → 社区插件
2. 搜索 "Obsidian AI Agent"
3. 点击安装并启用

## 配置说明

### 1. DeepSeek 配置

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/) 获取 API Key
2. 在插件设置中填入 API Key
3. （可选）自定义 Base URL（如使用代理或私有部署）
4. 点击"测试连接"验证配置

**添加自定义 DeepSeek 模型**：
- 点击"添加 DeepSeek 自定义模型"按钮
- 输入模型 ID（例如：`deepseek-v3`）
- 输入显示名称（例如：`DeepSeek V3`）
- 点击确定，模型立即可用

### 2. 智谱 AI 配置

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/) 获取 API Key
2. 在插件设置中填入 API Key
3. 点击"测试连接"验证配置

**添加自定义智谱 AI 模型**：
- 点击"添加智谱 AI 自定义模型"按钮
- 输入模型 ID（例如：`glm-4-plus`）
- 输入显示名称（例如：`GLM-4 Plus`）
- 点击确定，模型立即可用

### 3. 默认设置

- **默认提供商**: 选择常用的 AI 提供商
- **默认模型**: 选择默认使用的模型（包含自定义模型）
- **最大 Tokens**: 控制单次请求的输出长度
- **Temperature**: 控制生成文本的随机性（0-2）

### 4. 输出设置

根据个人习惯配置 AI 回复的插入位置和格式。

### 5. Prompt 模板管理

- 查看所有内置和自定义模板
- 点击"添加"创建自定义模板
- 删除不需要的自定义模板

## 使用示例

### 示例 1：总结一段文本

1. 在笔记中选中要总结的文本
2. 按 `Ctrl/Cmd + Shift + A`
3. 选择"总结"模板
4. AI 会自动在选中内容下方插入总结

### 示例 2：翻译整个文档

1. 打开要翻译的文档
2. 按 `Ctrl/Cmd + Shift + F`
3. 选择"翻译为英文"模板
4. AI 处理完成后，结果会根据配置插入到指定位置

### 示例 3：使用自定义模型

1. 先在设置中添加自定义模型（见上方配置说明）
2. 在"默认模型"下拉框中选择新添加的模型
3. 正常使用 AI 功能即可

### 示例 4：自定义 Prompt

1. 在选择模板的弹窗中，下方有文本输入框
2. 输入你的自定义 Prompt，例如：
   ```
   请将以下内容改写成更适合博客文章的格式，并添加吸引人的标题：
   
   {{content}}
   ```
3. 点击"提交"即可

### 示例 5：从 AI 助手面板快速访问

1. 点击左侧工具栏的 AI 图标
2. 点击"处理选中文本"或"处理当前文件"
3. 点击"打开设置"快速进入插件配置

## 开发说明

### 项目结构

```
obsidian-ai-agent/
├── main.ts                 # 插件主入口
├── types.ts                # TypeScript 类型定义
├── promptTemplates.ts      # Prompt 模板管理
├── providers/              # AI 提供商实现
│   ├── deepseekProvider.ts
│   └── zhipuProvider.ts
├── manifest.json           # 插件清单
├── package.json            # npm 配置
├── tsconfig.json           # TypeScript 配置
└── README.md               # 说明文档
```

### 构建插件

```bash
# 安装依赖
npm install

# 开发模式（自动监听文件变化）
npm run dev

# 生产构建
npm run build

# Windows 快速构建
build.bat
```

### 添加新的 AI 提供商

1. 在 `providers/` 目录下创建新的 provider 文件
2. 实现 `IAIProvider` 接口
3. 在 `main.ts` 中导入并注册新的 provider
4. 在类型定义中添加新的 provider 类型

### 添加内置 Prompt 模板

在 `promptTemplates.ts` 的 `BUILTIN_PROMPTS` 数组中添加新模板：

```typescript
{
  id: 'your-template-id',
  name: '模板名称',
  content: '你的 prompt 内容，使用 {{content}} 作为占位符',
  isBuiltIn: true
}
```

## 常见问题

### Q: API Key 存储在哪里？

A: API Key 存储在 Obsidian 的插件数据目录中，仅在本地保存，不会上传到任何第三方。

### Q: 支持哪些模型？

A: 
- **DeepSeek**: deepseek-chat, deepseek-reasoner
- **智谱 AI**: glm-4, glm-4-flash
- **自定义模型**: 你可以随时添加新的模型 ID，无需更新插件

### Q: 如何添加新模型？

A: 
1. 打开插件设置
2. 找到对应的模型管理部分
3. 点击"添加自定义模型"
4. 输入模型 ID 和显示名称
5. 立即生效，无需重启

### Q: 如何查看调用历史？

A: 
1. 在设置中启用"调用日志"
2. 点击左侧 AI 图标打开 AI 助手面板
3. 查看"调用次数"和"总 Token"统计

### Q: 网络请求失败怎么办？

A: 
1. 检查 API Key 是否正确
2. 检查网络连接
3. 如果使用代理，确认 Base URL 配置正确
4. 查看 Obsidian 开发者控制台的错误信息

### Q: Token 使用量如何计算？

A: 插件会记录每次调用的输入 Token 和输出 Token，并在日志中显示。Token 计费由各 AI 提供商决定。

### Q: 自定义模型能用吗？

A: 完全可以！只要 API 提供商支持该模型 ID，你就可以添加并使用。API URL 保持不变，只需添加新的模型 ID。

### Q: 如何从 AI 助手打开设置？

A: 点击左侧工具栏的 AI 图标，然后点击"打开设置"链接即可。

## 隐私政策

本插件承诺：
- ✅ 不收集任何用户数据
- ✅ 不上传笔记内容到任何第三方（除选择的 AI API 外）
- ✅ API Key 仅用于调用相应的 AI 服务
- ✅ 所有配置和数据均存储在本地
- ✅ 调用日志仅保存在本地

## 未来计划

- [ ] 支持更多国产模型（通义千问、百川等）
- [ ] 本地向量检索（RAG）
- [ ] 与 Vault 知识联动
- [ ] 自动生成双链和标签
- [ ] AI Agent（多步任务）
- [ ] 流式输出支持
- [ ] 对话历史记录
- [ ] Markdown 编辑器内联 AI 助手

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- [Obsidian](https://obsidian.md/) - 强大的笔记应用
- [DeepSeek](https://www.deepseek.com/) - 开源 AI 模型
- [智谱 AI](https://www.bigmodel.cn/) - 国产大模型

## 快速链接

- [快速开始指南](QUICKSTART.md) - 5 分钟上手
- [使用示例](USAGE_EXAMPLES.md) - 详细示例
- [安装指南](INSTALLATION.md) - 完整安装步骤
- [构建指南](BUILD_GUIDE.md) - 开发和构建说明

---

**享受 AI 增强的 Obsidian 体验！** 🚀