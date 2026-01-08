import { Plugin, TFile, Notice, Modal, Setting, PluginSettingTab } from 'obsidian';
import { MarkdownView } from 'obsidian';
import { 
  AIAgentSettings, 
  AIProviderType, 
  AIRequest, 
  ModelInfo, 
  InsertPosition, 
  InsertFormat,
  CallLog,
  PromptTemplate
} from './types';
import { DeepSeekProvider } from './providers/deepseekProvider';
import { ZhipuProvider } from './providers/zhipuProvider';
import { BUILTIN_PROMPTS, expandTemplate } from './promptTemplates';

const DEFAULT_SETTINGS: AIAgentSettings = {
  // DeepSeek 配置
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com',
  deepseekModels: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', enabled: true },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek', enabled: true }
  ],
  deepseekCustomModels: [], // 自定义 DeepSeek 模型
  
  // 智谱 AI 配置
  zhipuApiKey: '',
  zhipuModels: [
    { id: 'glm-4', name: 'GLM-4', provider: 'zhipu', enabled: true },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: 'zhipu', enabled: true }
  ],
  zhipuCustomModels: [], // 自定义智谱 AI 模型
  
  // 默认设置
  defaultProvider: 'deepseek',
  defaultModel: 'deepseek-chat',
  
  // 调用设置
  timeout: 30000,
  maxTokens: 2000,
  temperature: 0.7,
  
  // 输出设置
  insertPosition: 'below-selection',
  insertFormat: 'markdown',
  
  // Prompt 模板
  promptTemplates: [...BUILTIN_PROMPTS],
  
  // 日志设置
  enableLogging: true
};

export default class AIAgentPlugin extends Plugin {
  settings: AIAgentSettings;
  callLogs: CallLog[] = [];

  async onload() {
    await this.loadSettings();

    // 添加功能区图标
    this.addRibbonIcon('bot', 'AI 助手', () => {
      this.showAIPanel();
    });

    // 注册命令
    this.addCommand({
      id: 'ai-process-selection',
      name: '使用 AI 处理选中文本',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'a' }],
      callback: () => this.processSelection()
    });

    this.addCommand({
      id: 'ai-process-file',
      name: '使用 AI 处理当前文件',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'f' }],
      callback: () => this.processFile()
    });

    this.addCommand({
      id: 'ai-show-panel',
      name: '显示 AI 助手面板',
      callback: () => this.showAIPanel()
    });

    // 添加设置页面
    this.addSettingTab(new AIAgentSettingTab(this.app, this));

    console.log('Obsidian AI Agent 插件已加载');
  }

  onunload() {
    console.log('Obsidian AI Agent 插件已卸载');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.callLogs = this.settings.enableLogging ? [] : [];
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // 获取当前活跃的编辑器
  getActiveEditor() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView?.editor;
  }

  // 处理选中文本
  async processSelection() {
    const editor = this.getActiveEditor();
    if (!editor) {
      new Notice('请先打开一个 Markdown 文件');
      return;
    }

    const selection = editor.getSelection();
    if (!selection) {
      new Notice('请先选择要处理的文本');
      return;
    }

    this.showPromptModal(selection, 'selection');
  }

  // 处理当前文件
  async processFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('请先打开一个文件');
      return;
    }

    const content = await this.app.vault.read(activeFile);
    this.showPromptModal(content, 'file');
  }

  // 显示 AI 面板
  showAIPanel() {
    new AIPanelModal(this.app, this).open();
  }

  // 显示 Prompt 选择模态框
  showPromptModal(content: string, source: 'selection' | 'file') {
    new PromptSelectionModal(this.app, this, content, source).open();
  }

  // 调用 AI
  async callAI(prompt: string, content: string, provider: AIProviderType, modelId: string) {
    const request: AIRequest = {
      prompt,
      content,
      modelId,
      provider,
      maxTokens: this.settings.maxTokens,
      temperature: this.settings.temperature
    };

    let providerInstance;
    
    switch (provider) {
      case 'deepseek':
        providerInstance = new DeepSeekProvider(this.settings.deepseekApiKey, this.settings.deepseekBaseUrl);
        break;
      case 'zhipu':
        providerInstance = new ZhipuProvider(this.settings.zhipuApiKey);
        break;
      default:
        throw new Error(`不支持的提供商: ${provider}`);
    }

    return await providerInstance.call(request);
  }

  // 插入 AI 响应
  async insertResponse(response: string, source: 'selection' | 'file', originalContent?: string) {
    const editor = this.getActiveEditor();
    if (!editor) return;

    let formattedResponse = response;

    // 根据插入格式进行格式化
    switch (this.settings.insertFormat) {
      case 'markdown':
        formattedResponse = `\n\n**AI 回复**\n\n${response}\n\n`;
        break;
      case 'callout':
        formattedResponse = `\n\n> [!ai] AI 回复\n> ${response.split('\n').join('\n> ')}\n\n`;
        break;
      case 'plain':
        formattedResponse = `\n\n${response}\n\n`;
        break;
    }

    // 根据插入位置插入
    switch (this.settings.insertPosition) {
      case 'cursor':
        editor.replaceRange(formattedResponse, editor.getCursor());
        break;
      case 'below-selection':
        if (source === 'selection' && originalContent) {
          const cursor = editor.getCursor();
          editor.replaceRange(formattedResponse, { line: cursor.line + 1, ch: 0 });
        } else {
          const lastLine = editor.lastLine();
          editor.replaceRange(formattedResponse, { line: lastLine + 1, ch: 0 });
        }
        break;
      case 'new-file':
        const newFileName = `AI-${new Date().toISOString().slice(0, 10)}.md`;
        await this.app.vault.create(newFileName, formattedResponse);
        new Notice('已创建新文件');
        break;
    }
  }

  // 记录调用日志
  logCall(call: CallLog) {
    if (!this.settings.enableLogging) return;
    
    this.callLogs.push(call);
    
    // 只保留最近 100 条记录
    if (this.callLogs.length > 100) {
      this.callLogs = this.callLogs.slice(-100);
    }
  }

  // 测试 API 连接
  async testConnection(provider: AIProviderType): Promise<boolean> {
    try {
      const request: AIRequest = {
        prompt: '你好',
        modelId: provider === 'deepseek' ? 'deepseek-chat' : 'glm-4',
        provider,
        maxTokens: 10
      };

      await this.callAI(request.prompt, '', provider, request.modelId);
      return true;
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }
}

// 添加自定义模型 Modal
class AddCustomModelModal extends Modal {
  constructor(
    app: any,
    private plugin: AIAgentPlugin,
    private providerType: AIProviderType,
    private onCloseCallback: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    const providerName = this.providerType === 'deepseek' ? 'DeepSeek' : '智谱 AI';
    
    contentEl.createEl('h2', { text: `添加 ${providerName} 自定义模型` });

    // 模型 ID 输入
    const modelIdContainer = contentEl.createDiv();
    modelIdContainer.style.marginTop = '20px';
    modelIdContainer.createEl('label', { text: '模型 ID', cls: 'setting-item' });
    
    const modelIdInput = modelIdContainer.createEl('input', { 
      type: 'text',
      placeholder: '例如: deepseek-v3 或 glm-4-plus'
    });
    modelIdInput.style.width = '100%';
    modelIdInput.style.marginTop = '5px';
    modelIdInput.style.padding = '5px';

    // 模型名称输入
    const nameContainer = contentEl.createDiv();
    nameContainer.style.marginTop = '15px';
    nameContainer.createEl('label', { text: '显示名称', cls: 'setting-item' });
    
    const nameInput = nameContainer.createEl('input', { 
      type: 'text',
      placeholder: '例如: DeepSeek V3 或 GLM-4 Plus'
    });
    nameInput.style.width = '100%';
    nameInput.style.marginTop = '5px';
    nameInput.style.padding = '5px';

    // 按钮容器
    const buttonContainer = contentEl.createDiv();
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.marginTop = '20px';

    // 取消按钮
    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.onclick = () => this.close();

    // 确定按钮
    const confirmBtn = buttonContainer.createEl('button', { 
      text: '确定',
      cls: 'mod-cta'
    });
    confirmBtn.style.padding = '8px 16px';
    confirmBtn.onclick = () => {
      const modelId = modelIdInput.value.trim();
      const modelName = nameInput.value.trim();

      if (!modelId) {
        new Notice('请输入模型 ID');
        return;
      }

      if (!modelName) {
        new Notice('请输入显示名称');
        return;
      }

      const newModel: ModelInfo = {
        id: modelId,
        name: modelName,
        provider: this.providerType,
        enabled: true
      };

      if (this.providerType === 'deepseek') {
        this.plugin.settings.deepseekCustomModels.push(newModel);
      } else {
        this.plugin.settings.zhipuCustomModels.push(newModel);
      }

      this.plugin.saveSettings();
      new Notice('模型添加成功！');
      this.close();
      this.onCloseCallback();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Prompt 选择模态框
class PromptSelectionModal extends Modal {
  constructor(
    app: any,
    private plugin: AIAgentPlugin,
    private content: string,
    private source: 'selection' | 'file'
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '选择 AI 功能' });

    // 创建按钮容器
    const buttonContainer = contentEl.createDiv({ cls: 'ai-button-container' });
    buttonContainer.style.display = 'grid';
    buttonContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    // 添加 Prompt 按钮
    this.plugin.settings.promptTemplates.forEach(template => {
      const btn = buttonContainer.createEl('button', { text: template.name });
      btn.style.padding = '10px';
      btn.style.cursor = 'pointer';
      btn.onclick = async () => {
        this.processWithPrompt(template);
        this.close();
      };
    });

    // 自定义 Prompt 输入
    const customInput = contentEl.createEl('textarea', {
      placeholder: '或输入自定义 Prompt...',
      cls: 'ai-custom-prompt'
    });
    customInput.style.width = '100%';
    customInput.style.height = '100px';
    customInput.style.marginTop = '20px';

    const submitBtn = contentEl.createEl('button', { text: '提交' });
    submitBtn.style.marginTop = '10px';
    submitBtn.style.padding = '10px 20px';
    submitBtn.onclick = () => {
      const customPrompt = customInput.value.trim();
      if (customPrompt) {
        this.processWithCustomPrompt(customPrompt);
      }
      this.close();
    };
  }

  async processWithPrompt(template: PromptTemplate) {
    await this.executePrompt(template.content);
  }

  async processWithCustomPrompt(prompt: string) {
    await this.executePrompt(prompt);
  }

  async executePrompt(prompt: string) {
    const { plugin, content, source } = this;
    const activeFile = plugin.app.workspace.getActiveFile();

    try {
      new Notice('正在调用 AI...', 2000);

      const expandedPrompt = expandTemplate(
        prompt,
        content,
        activeFile?.basename,
        new Date().toLocaleDateString('zh-CN')
      );

      const response = await plugin.callAI(
        expandedPrompt,
        content,
        plugin.settings.defaultProvider,
        plugin.settings.defaultModel
      );

      // 记录日志
      if (plugin.settings.enableLogging) {
        plugin.logCall({
          timestamp: Date.now(),
          provider: plugin.settings.defaultProvider,
          model: plugin.settings.defaultModel,
          prompt: expandedPrompt,
          response: response.content,
          inputTokens: response.usage?.promptTokens,
          outputTokens: response.usage?.completionTokens,
          totalTokens: response.usage?.totalTokens
        });
      }

      // 插入响应
      await plugin.insertResponse(response.content, source, content);
      
      new Notice('AI 处理完成');
    } catch (error) {
      console.error('AI 调用失败:', error);
      new Notice(`AI 调用失败: ${error.message}`);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// AI 面板模态框
class AIPanelModal extends Modal {
  constructor(app: any, private plugin: AIAgentPlugin) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'AI 助手' });

    // 快捷操作
    const quickActions = contentEl.createDiv({ cls: 'ai-quick-actions' });
    quickActions.style.marginTop = '20px';
    quickActions.style.display = 'grid';
    quickActions.style.gridTemplateColumns = 'repeat(2, 1fr)';
    quickActions.style.gap = '10px';

    const processSelBtn = quickActions.createEl('button', { text: '处理选中文本' });
    processSelBtn.style.padding = '10px';
    processSelBtn.onclick = () => {
      this.plugin.processSelection();
      this.close();
    };

    const processFileBtn = quickActions.createEl('button', { text: '处理当前文件' });
    processFileBtn.style.padding = '10px';
    processFileBtn.onclick = () => {
      this.plugin.processFile();
      this.close();
    };

    // 设置链接
    const settingsLink = contentEl.createEl('a', { text: '打开设置' });
    settingsLink.href = '#';
    settingsLink.style.display = 'block';
    settingsLink.style.marginTop = '20px';
    settingsLink.onclick = () => {
      // 打开 Obsidian 设置
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById('obsidian-ai-agent');
      this.close();
    };

    // 统计信息
    if (this.plugin.settings.enableLogging) {
      const stats = contentEl.createDiv({ cls: 'ai-stats' });
      stats.style.marginTop = '20px';
      stats.style.padding = '10px';
      stats.style.border = '1px solid var(--background-modifier-border)';
      stats.style.borderRadius = '4px';

      stats.createEl('p', { text: `调用次数: ${this.plugin.callLogs.length}` });
      
      const totalTokens = this.plugin.callLogs.reduce((sum: number, log: CallLog) => sum + (log.totalTokens || 0), 0);
      stats.createEl('p', { text: `总 Token: ${totalTokens}` });
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// 设置页面
class AIAgentSettingTab extends PluginSettingTab {
  plugin: AIAgentPlugin;

  constructor(app: any, plugin: AIAgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const containerEl = (this as any).containerEl;
    containerEl.empty();

    // DeepSeek 配置
    containerEl.createEl('h2', { text: 'DeepSeek 配置' });
    
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('DeepSeek API Key')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.deepseekApiKey)
        .onChange(async (value) => {
          this.plugin.settings.deepseekApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Base URL')
      .setDesc('DeepSeek API 基础 URL（支持私有代理）')
      .addText(text => text
        .setPlaceholder('https://api.deepseek.com')
        .setValue(this.plugin.settings.deepseekBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.deepseekBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('测试连接')
      .addButton(button => button
        .setButtonText('测试')
        .setClass('mod-cta')
        .onClick(async () => {
          button.setButtonText('测试中...');
          const success = await this.plugin.testConnection('deepseek');
          if (success) {
            new Notice('DeepSeek 连接成功！');
          } else {
            new Notice('DeepSeek 连接失败，请检查 API Key');
          }
          button.setButtonText('测试');
        }));

    // DeepSeek 模型管理
    this.addDeepSeekModelSection(containerEl);

    // 智谱 AI 配置
    containerEl.createEl('h2', { text: '智谱 AI 配置' });
    
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('智谱 AI API Key')
      .addText(text => text
        .setPlaceholder('...')
        .setValue(this.plugin.settings.zhipuApiKey)
        .onChange(async (value) => {
          this.plugin.settings.zhipuApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('测试连接')
      .addButton(button => button
        .setButtonText('测试')
        .setClass('mod-cta')
        .onClick(async () => {
          button.setButtonText('测试中...');
          const success = await this.plugin.testConnection('zhipu');
          if (success) {
            new Notice('智谱 AI 连接成功！');
          } else {
            new Notice('智谱 AI 连接失败，请检查 API Key');
          }
          button.setButtonText('测试');
        }));

    // 智谱 AI 模型管理
    this.addZhipuModelSection(containerEl);

    // 默认设置
    containerEl.createEl('h2', { text: '默认设置' });

    new Setting(containerEl)
      .setName('默认提供商')
      .setDesc('选择默认使用的 AI 提供商')
      .addDropdown(dropdown => dropdown
        .addOption('deepseek', 'DeepSeek')
        .addOption('zhipu', '智谱 AI')
        .setValue(this.plugin.settings.defaultProvider)
        .onChange(async (value) => {
          this.plugin.settings.defaultProvider = value as AIProviderType;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('默认模型')
      .setDesc('选择默认使用的模型（包含自定义模型）')
      .addDropdown(dropdown => {
        const allModels = [
          ...this.plugin.settings.deepseekModels,
          ...this.plugin.settings.deepseekCustomModels,
          ...this.plugin.settings.zhipuModels,
          ...this.plugin.settings.zhipuCustomModels
        ];
        allModels.forEach(model => {
          dropdown.addOption(model.id, `${model.name} (${model.provider})`);
        });
        dropdown.setValue(this.plugin.settings.defaultModel);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultModel = value;
          await this.plugin.saveSettings();
        });
      });

    // 调用设置
    containerEl.createEl('h2', { text: '调用设置' });

    new Setting(containerEl)
      .setName('最大 Tokens')
      .setDesc('单次请求的最大返回 Token 数')
      .addText(text => text
        .setPlaceholder('2000')
        .setValue(String(this.plugin.settings.maxTokens))
        .onChange(async (value) => {
          this.plugin.settings.maxTokens = parseInt(value) || 2000;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Temperature')
      .setDesc('控制生成文本的随机性（0-2，越高越随机）')
      .addSlider(slider => slider
        .setLimits(0, 2, 0.1)
        .setValue(this.plugin.settings.temperature)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.temperature = value;
          await this.plugin.saveSettings();
        }));

    // 输出设置
    containerEl.createEl('h2', { text: '输出设置' });

    new Setting(containerEl)
      .setName('插入位置')
      .setDesc('选择 AI 回复的插入位置')
      .addDropdown(dropdown => dropdown
        .addOption('cursor', '光标位置')
        .addOption('below-selection', '选中内容下方')
        .addOption('new-file', '新建文件')
        .setValue(this.plugin.settings.insertPosition)
        .onChange(async (value) => {
          this.plugin.settings.insertPosition = value as InsertPosition;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('插入格式')
      .setDesc('选择 AI 回复的格式')
      .addDropdown(dropdown => dropdown
        .addOption('plain', '纯文本')
        .addOption('markdown', 'Markdown 格式')
        .addOption('callout', '折叠块/Callout')
        .setValue(this.plugin.settings.insertFormat)
        .onChange(async (value) => {
          this.plugin.settings.insertFormat = value as InsertFormat;
          await this.plugin.saveSettings();
        }));

    // Prompt 模板管理
    containerEl.createEl('h2', { text: 'Prompt 模板' });
    
    this.plugin.settings.promptTemplates.forEach((template, index) => {
      const setting = new Setting(containerEl);
      
      if (template.isBuiltIn) {
        setting.setName(template.name);
        setting.setDesc(template.content.substring(0, 50) + '...');
      } else {
        setting.setName(template.name);
        setting.addExtraButton(button => button
          .setIcon('trash')
          .setTooltip('删除')
          .onClick(async () => {
            this.plugin.settings.promptTemplates.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
      }
    });

    new Setting(containerEl)
      .setName('添加自定义模板')
      .setDesc('创建新的 Prompt 模板')
      .addButton(button => button
        .setButtonText('添加')
        .setClass('mod-cta')
        .onClick(() => {
          const name = prompt('模板名称:');
          if (!name) return;
          const content = prompt('模板内容（使用 {{content}} 作为占位符）:');
          if (!content) return;
          
          this.plugin.settings.promptTemplates.push({
            id: 'custom-' + Date.now(),
            name,
            content,
            isBuiltIn: false
          });
          this.plugin.saveSettings();
          this.display();
        }));

    // 其他设置
    containerEl.createEl('h2', { text: '其他' });

    new Setting(containerEl)
      .setName('启用调用日志')
      .setDesc('记录 AI 调用历史（本地存储）')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableLogging)
        .onChange(async (value) => {
          this.plugin.settings.enableLogging = value;
          await this.plugin.saveSettings();
        }));
  }

  // DeepSeek 模型管理部分
  private addDeepSeekModelSection(containerEl: any) {
    containerEl.createEl('h3', { text: 'DeepSeek 模型' });
    
    // 内置模型列表
    this.plugin.settings.deepseekModels.forEach(model => {
      new Setting(containerEl)
        .setName(model.name)
        .setDesc(`ID: ${model.id}（内置）`)
        .addExtraButton(button => button
          .setIcon('info')
          .setTooltip('内置模型')
          .setDisabled(true));
    });
    
    // 自定义模型列表
    this.plugin.settings.deepseekCustomModels.forEach((model, index) => {
      const setting = new Setting(containerEl);
      setting.setName(model.name)
        .setDesc(`ID: ${model.id}（自定义）`)
        .addExtraButton(button => button
          .setIcon('trash')
          .setTooltip('删除')
          .onClick(async () => {
            this.plugin.settings.deepseekCustomModels.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    });
    
    // 添加自定义模型按钮
    new Setting(containerEl)
      .setName('添加 DeepSeek 自定义模型')
      .setDesc('添加新的 DeepSeek 模型，API URL 保持不变')
      .addButton(button => button
        .setButtonText('添加')
        .setClass('mod-cta')
        .onClick(() => {
          new AddCustomModelModal(this.plugin.app, this.plugin, 'deepseek', () => {
            this.display();
          }).open();
        }));
  }
  
  // 智谱 AI 模型管理部分
  private addZhipuModelSection(containerEl: any) {
    containerEl.createEl('h3', { text: '智谱 AI 模型' });
    
    // 内置模型列表
    this.plugin.settings.zhipuModels.forEach(model => {
      new Setting(containerEl)
        .setName(model.name)
        .setDesc(`ID: ${model.id}（内置）`)
        .addExtraButton(button => button
          .setIcon('info')
          .setTooltip('内置模型')
          .setDisabled(true));
    });
    
    // 自定义模型列表
    this.plugin.settings.zhipuCustomModels.forEach((model, index) => {
      const setting = new Setting(containerEl);
      setting.setName(model.name)
        .setDesc(`ID: ${model.id}（自定义）`)
        .addExtraButton(button => button
          .setIcon('trash')
          .setTooltip('删除')
          .onClick(async () => {
            this.plugin.settings.zhipuCustomModels.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    });
    
    // 添加自定义模型按钮
    new Setting(containerEl)
      .setName('添加智谱 AI 自定义模型')
      .setDesc('添加新的智谱 AI 模型，API URL 保持不变')
      .addButton(button => button
        .setButtonText('添加')
        .setClass('mod-cta')
        .onClick(() => {
          new AddCustomModelModal(this.plugin.app, this.plugin, 'zhipu', () => {
            this.display();
          }).open();
        }));
  }
}