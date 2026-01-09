# 更新日志

## v1.1.0 - 2026-01-09

### 新增功能

#### 1. AI 处理时的持续连接提示
- 在 AI 处理大量文本或深度思考时，显示持续的"正在连接 AI，请稍候..."提示
- 避免用户在长时间处理时看不到任何反馈
- 自动在处理完成或失败时关闭提示

#### 2. 输入框快捷键支持
- 在"选择 AI 功能"界面的自定义 Prompt 输入框中绑定 Ctrl+Enter 快捷键
- 可直接通过快捷键提交，无需移动鼠标点击按钮
- 在提交按钮旁边显示快捷键提示："Ctrl+Enter 提交"
- 打开模态框时自动聚焦到输入框

#### 3. Prompt 模板显示控制
- 每个默认模板都有独立的开关按钮
- 可以单独启用/禁用每个内置模板
- 自定义模板只能删除，不能禁用
- 更灵活的模板管理方式

#### 4. 智谱 AI Base URL 可编辑
- 智谱 AI 的 Base URL 从硬编码改为可配置
- 支持私有代理设置
- 设置界面新增 Base URL 输入框

#### 5. OpenAI 模型支持
- 新增 OpenAI 提供商支持
- 支持 ChatGPT API 标准
- 支持自定义代理模式（Base URL 可配置）
- 支持自定义模型 ID
- 内置模型：GPT-4o、GPT-4o Mini
- 完整的模型管理功能（添加/删除自定义模型）

#### 6. Kimi API 支持
- 新增 Kimi（月之暗面）提供商支持
- 支持 Moonshot API 标准
- 支持私有代理设置（Base URL 可配置）
- 支持自定义模型 ID
- 内置模型：Moonshot V1 8K、Moonshot V1 32K
- 完整的模型管理功能（添加/删除自定义模型）

### 改进

- 更新 `testConnection` 方法以支持所有新增的提供商
- 改进设置界面的默认提供商选择器，包含所有四个选项
- 优化默认模型选择器，自动包含所有提供商的内置和自定义模型
- 增强加载时的兼容性处理，确保旧版本配置平滑升级

### 技术细节

#### 新增文件
- `providers/openaiProvider.ts` - OpenAI API 提供商实现
- `providers/kimiProvider.ts` - Kimi API 提供商实现

#### 修改文件
- `types.ts` - 扩展 AIProviderType 类型，新增配置字段
- `main.ts` - 实现所有新功能，更新设置界面
- `providers/zhipuProvider.ts` - 支持自定义 Base URL

### 配置迁移

升级到 v1.1.0 后，如果您的配置文件中缺少新字段，插件会自动使用默认值：
- `showDefaultTemplates`: 默认为 `true`
- `zhipuBaseUrl`: 默认为 `https://open.bigmodel.cn/api/paas/v4`
- `openaiApiKey`: 默认为空
- `openaiBaseUrl`: 默认为 `https://api.openai.com/v1`
- `kimiApiKey`: 默认为空
- `kimiBaseUrl`: 默认为 `https://api.moonshot.cn/v1`