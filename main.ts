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
import { ZhipuProvider, ZhipuMcpConfig } from './providers/zhipuProvider';
import { OpenAIProvider } from './providers/openaiProvider';
import { KimiProvider } from './providers/kimiProvider';
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
  zhipuBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  zhipuModels: [
    { id: 'glm-4', name: 'GLM-4', provider: 'zhipu', enabled: true },
    { id: 'glm-4-plus', name: 'GLM-4 Plus', provider: 'zhipu', enabled: true },
    { id: 'glm-3-turbo', name: 'GLM-3 Turbo', provider: 'zhipu', enabled: true }
  ],
  zhipuCustomModels: [], // 自定义智谱 AI 模型
  
  // 智谱 AI MCP 配置
  zhipuMcpVision: false, // 视觉理解 MCP
  zhipuMcpWebSearch: false, // 联网搜索 MCP
  zhipuMcpWebReader: false, // 网页阅读 MCP
  zhipuMcpZread: false, // 开源仓库 MCP
  
  // OpenAI 配置
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiModels: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', enabled: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', enabled: true }
  ],
  openaiCustomModels: [], // 自定义 OpenAI 模型
  
  // Kimi 配置
  kimiApiKey: '',
  kimiBaseUrl: 'https://api.moonshot.cn/v1',
  kimiModels: [
    { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', provider: 'kimi', enabled: true },
    { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', provider: 'kimi', enabled: true }
  ],
  kimiCustomModels: [], // 自定义 Kimi 模型
  
  // 默认设置
  defaultProvider: 'deepseek',
  defaultModel: 'deepseek-chat',
  
  // 调用设置
  timeout: 30000,
  maxTokens: 1000,
  temperature: 0.7,
  
  // 输出设置
  insertPosition: 'below-selection',
  insertFormat: 'markdown',
  
  // Prompt 模板
  promptTemplates: [...BUILTIN_PROMPTS.map(p => ({...p, enabled: true}))],
  showDefaultTemplates: true, // 已废弃，保留用于兼容
  
  // 日志设置
  enableLogging: true,
  
  // 快捷键设置
  hotkeyProcessSelection: 'mod+shift+a',
  hotkeyProcessFile: 'mod+shift+f',
  hotkeyShowPanel: '',
  hotkeyStopAI: 'escape',
  defaultRoleTemplateId: '',
  autoRewriteTitle: true
};

export default class AIAgentPlugin extends Plugin {
  settings: AIAgentSettings;
  callLogs: CallLog[] = [];
  private statusBarItem: HTMLElement | null = null;
  private currentAbortController: AbortController | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;

  async onload() {
    await this.loadSettings();

    // 添加状态栏项目
    this.statusBarItem = this.addStatusBarItem();
    this.updateStatusBar('就绪');

    // 添加功能区图标
    this.addRibbonIcon('bot', 'AI 助手', () => {
      this.showAIPanel();
    });

    // 注册命令
    this.registerCommands();

    // 添加设置页面
    this.addSettingTab(new AIAgentSettingTab(this.app, this));

    console.log('Obsidian AI Agent 插件已加载');
  }

  // 注册命令（支持动态更新）
  registerCommands() {
    // 重新注册命令
    this.addCommand({
      id: 'ai-process-selection',
      name: '使用 AI 处理选中文本',
      hotkeys: this.parseHotkey(this.settings.hotkeyProcessSelection) as any,
      callback: () => this.processSelection()
    });

    this.addCommand({
      id: 'ai-process-file',
      name: '使用 AI 处理当前文件',
      hotkeys: this.parseHotkey(this.settings.hotkeyProcessFile) as any,
      callback: () => this.processFile()
    });

    this.addCommand({
      id: 'ai-show-panel',
      name: '显示 AI 助手面板',
      hotkeys: this.parseHotkey(this.settings.hotkeyShowPanel) as any,
      callback: () => this.showAIPanel()
    });

    this.addCommand({
      id: 'ai-stop',
      name: '停止 AI 处理',
      hotkeys: this.parseHotkey(this.settings.hotkeyStopAI) as any,
      callback: () => this.stopAI()
    });
  }

  // 停止AI处理
  stopAI() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
      new Notice('已停止');
      
      // 清除计时器
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.updateStatusBar('已停止');
    } else {
      new Notice('没有正在进行的 AI 处理');
    }
  }

  // 开始计时器
  startTimer() {
    this.startTime = Date.now();
    this.updateStatusBar('0秒');
    
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateStatusBar(`${elapsed}秒运行`);
    }, 1000);
  }

  // 停止计时器并显示完成时间
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    return elapsed;
  }

  onunload() {
    console.log('Obsidian AI Agent 插件已卸载');
    if (this.statusBarItem) {
      this.statusBarItem.remove();
    }
  }

  // 更新状态栏
  updateStatusBar(message: string) {
    if (this.statusBarItem) {
      this.statusBarItem.setText(`AI: ${message}`);
    }
  }

  // 解析快捷键字符串
  parseHotkey(hotkeyStr: string): { modifiers: string[]; key: string }[] | undefined {
    if (!hotkeyStr) return undefined;
    
    const parts = hotkeyStr.toLowerCase().split('+').map(p => p.trim());
    if (parts.length === 0) return undefined;
    
    const key = parts.pop() || '';
    const modifiers: string[] = [];
    
    for (const part of parts) {
      if (part === 'mod' || part === 'cmd') {
        modifiers.push('Mod');
      } else if (part === 'ctrl') {
        modifiers.push('Ctrl');
      } else if (part === 'shift') {
        modifiers.push('Shift');
      } else if (part === 'alt') {
        modifiers.push('Alt');
      }
    }
    
    if (!key) return undefined;
    
    return [{ modifiers, key: key.toUpperCase() }];
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // 确保模板的 enabled 字段存在（兼容旧版本）
    this.settings.promptTemplates.forEach(template => {
      if (template.enabled === undefined) {
        template.enabled = true;
      }
    });

    // 确保自动重写标题字段存在（兼容旧版本）
    if (this.settings.autoRewriteTitle === undefined) {
      this.settings.autoRewriteTitle = true;
    }

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

    // 如果有默认角色模板，直接使用；否则显示面板
    if (this.settings.defaultRoleTemplateId) {
      const template = this.settings.promptTemplates.find(t => t.id === this.settings.defaultRoleTemplateId);
      if (template) {
        new Notice(`正在使用角色 "${template.name}" 处理...`);
        await this.executeWithTemplate(template, selection, 'selection');
        return;
      }
    }

    // 如果没有设置默认角色，显示面板
    this.showAIPanel(selection, 'selection');
  }

  // 处理当前文件
  async processFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('请先打开一个文件');
      return;
    }

    const content = await this.app.vault.read(activeFile);

    // 如果有默认角色模板，直接使用；否则显示面板
    if (this.settings.defaultRoleTemplateId) {
      const template = this.settings.promptTemplates.find(t => t.id === this.settings.defaultRoleTemplateId);
      if (template) {
        new Notice(`正在使用角色 "${template.name}" 处理...`);
        await this.executeWithTemplate(template, content, 'file');
        return;
      }
    }

    // 如果没有设置默认角色，显示面板
    this.showAIPanel(content, 'file');
  }

  // 使用指定模板执行处理
  async executeWithTemplate(template: PromptTemplate, content: string, source: 'selection' | 'file') {
    const activeFile = this.app.workspace.getActiveFile();
    
    // 创建 AbortController
    this.currentAbortController = new AbortController();
    
    // 开始计时
    this.startTimer();
    
    // 显示持续连接提示
    const loadingNotice = new Notice('正在连接 AI，请稍候...', 0);

    const expandedPrompt = expandTemplate(
      template.content,
      content,
      activeFile?.basename,
      new Date().toLocaleDateString('zh-CN')
    );

    try {
      const response = await this.callAI(
        expandedPrompt,
        content,
        this.settings.defaultProvider,
        this.settings.defaultModel,
        true // 生成标题
      );

      // 关闭加载提示
      loadingNotice.hide();

      // 停止计时并显示完成时间
      const elapsed = this.stopTimer();
      this.updateStatusBar(`${elapsed}秒完成`);
      
      // 清除 AbortController
      this.currentAbortController = null;

      // 记录日志
      if (this.settings.enableLogging) {
        this.logCall({
          timestamp: Date.now(),
          provider: this.settings.defaultProvider,
          model: this.settings.defaultModel,
          prompt: expandedPrompt,
          response: response.content,
          inputTokens: response.usage?.promptTokens,
          outputTokens: response.usage?.completionTokens,
          totalTokens: response.usage?.totalTokens
        });
      }

      // 插入响应
      await this.insertResponse(response.content, source, content);

      // 自动重写笔记标题（使用 AI 生成的标题）
      if (this.settings.autoRewriteTitle && activeFile && response.suggestedTitle) {
        try {
          // 清理标题中的引号
          const quotesToRemove = ['"', "'", '"', '\'', '`', '\u300C', '\u300D', '\u3010', '\u3011', '\u300E', '\u300F'];
          let cleanTitle = response.suggestedTitle;
          for (const quote of quotesToRemove) {
            cleanTitle = cleanTitle.startsWith(quote) ? cleanTitle.slice(1) : cleanTitle;
            cleanTitle = cleanTitle.endsWith(quote) ? cleanTitle.slice(0, -1) : cleanTitle;
          }
          cleanTitle = cleanTitle.trim();

          // 限制长度
          if (cleanTitle.length > 50) {
            cleanTitle = cleanTitle.substring(0, 50);
          }

          console.log('AI 建议标题:', cleanTitle, '原标题:', activeFile.basename);

          if (cleanTitle && cleanTitle !== activeFile.basename) {
            await this.app.fileManager.renameFile(activeFile, `${cleanTitle}.md`);
            new Notice(`标题已更新为: ${cleanTitle}`);
          }
        } catch (error) {
          console.error('重写标题失败:', error);
          // 标题重写失败不影响主流程，静默处理
        }
      }

      new Notice('AI 处理完成');

      // 成功完成，确保不会有AbortError
      return;
    } catch (error) {
      console.error('AI 调用失败:', error);
      
      // 关闭加载提示
      loadingNotice.hide();
      
      // 停止计时
      this.stopTimer();
      
      // 清除 AbortController
      this.currentAbortController = null;
      
      // 更新状态栏
      this.updateStatusBar('AI 就绪');
      
      // 判断是否是用户主动中断
      if (error.name === 'AbortError') {
        new Notice('已停止');
      } else {
        new Notice(`AI 调用失败: ${error.message}`);
      }
      
      // 对于任何错误（包括中断），都不插入内容
      return;
    }
  }

  // 显示 AI 面板（合并后的统一界面）
  showAIPanel(content?: string, source?: 'selection' | 'file') {
    new AIPanelModal(this.app, this, content, source).open();
  }

  // 调用 AI
  async callAI(prompt: string, content: string, provider: AIProviderType, modelId: string, includeTitle: boolean = false) {
    // 如果需要生成标题，在 prompt 末尾附加标题生成指令
    let finalPrompt = prompt;
    if (includeTitle && this.settings.autoRewriteTitle) {
      finalPrompt = prompt + '\n\n【重要】请先在回复的最开始用"【标题建议】"标签给出一个简洁的笔记标题建议（不超过20个字），然后正常回复内容。标题应该简洁、准确、概括核心内容。格式示例：【标题建议】JavaScript编程技巧\n\n然后是你的正常回复内容。';
    }

    const request: AIRequest = {
      prompt: finalPrompt,
      content,
      modelId,
      provider,
      maxTokens: this.settings.maxTokens,
      temperature: this.settings.temperature,
      abortSignal: this.currentAbortController?.signal
    };

    let providerInstance;
    
    switch (provider) {
      case 'deepseek':
        providerInstance = new DeepSeekProvider(this.settings.deepseekApiKey, this.settings.deepseekBaseUrl);
        break;
      case 'zhipu':
        const mcpConfig: ZhipuMcpConfig = {
          vision: this.settings.zhipuMcpVision,
          webSearch: this.settings.zhipuMcpWebSearch,
          webReader: this.settings.zhipuMcpWebReader,
          zread: this.settings.zhipuMcpZread
        };
        providerInstance = new ZhipuProvider(this.settings.zhipuApiKey, this.settings.zhipuBaseUrl, mcpConfig);
        break;
      case 'openai':
        providerInstance = new OpenAIProvider(this.settings.openaiApiKey, this.settings.openaiBaseUrl);
        break;
      case 'kimi':
        providerInstance = new KimiProvider(this.settings.kimiApiKey, this.settings.kimiBaseUrl);
        break;
      default:
        throw new Error(`不支持的提供商: ${provider}`);
    }

    const response = await providerInstance.call(request);

    // 如果需要标题，尝试从响应中提取
    if (includeTitle && response.content) {
      const titleMatch = response.content.match(/【标题建议】([^\n]+)/);
      if (titleMatch && titleMatch[1]) {
        response.suggestedTitle = titleMatch[1].trim();
        // 从响应内容中移除标题建议部分
        response.content = response.content.replace(/【标题建议】[^\n]+\n*/g, '').trim();
      }
    }

    return response;
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
  async testConnection(provider: AIProviderType): Promise<{success: boolean, error?: string}> {
    try {
      let modelId = 'deepseek-chat';
      
      switch (provider) {
        case 'deepseek':
          modelId = 'deepseek-chat';
          break;
        case 'zhipu':
          modelId = 'glm-4';
          break;
        case 'openai':
          modelId = 'gpt-4o-mini';
          break;
        case 'kimi':
          modelId = 'moonshot-v1-8k';
          break;
      }

      const request: AIRequest = {
        prompt: '你好',
        modelId: modelId,
        provider,
        maxTokens: 10
      };

      await this.callAI(request.prompt, '', provider, request.modelId);
      return {success: true};
    } catch (error) {
      console.error('连接测试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return {success: false, error: errorMessage};
    }
  }
}

// 编辑角色模板 Modal
class EditRoleTemplateModal extends Modal {
  constructor(
    app: any,
    private plugin: AIAgentPlugin,
    private templateIndex: number,
    private template: PromptTemplate,
    private onCloseCallback: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '编辑角色模板' });

    // 角色名称输入
    const nameContainer = contentEl.createDiv();
    nameContainer.style.marginTop = '20px';
    nameContainer.createEl('label', { text: '角色名称', cls: 'setting-item' });
    
    const nameInput = nameContainer.createEl('input', { 
      type: 'text',
      value: this.template.name
    }) as HTMLInputElement;
    nameInput.style.width = '100%';
    nameInput.style.marginTop = '5px';
    nameInput.style.padding = '5px';

    // 角色设定输入
    const contentContainer = contentEl.createDiv();
    contentContainer.style.marginTop = '15px';
    contentContainer.createEl('label', { text: '角色设定', cls: 'setting-item' });
    
    const contentDesc = contentContainer.createEl('p', {
      text: '使用 {{content}} 作为要处理的内容占位符',
      cls: 'setting-item-description'
    });
    contentDesc.style.fontSize = '0.85em';
    contentDesc.style.color = 'var(--text-muted)';
    contentDesc.style.marginTop = '5px';

    const contentInput = contentContainer.createEl('textarea') as HTMLTextAreaElement;
    contentInput.value = this.template.content;
    contentInput.style.width = '100%';
    contentInput.style.height = '150px';
    contentInput.style.marginTop = '5px';
    contentInput.style.padding = '5px';

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
      const name = nameInput.value.trim();
      const content = contentInput.value.trim();

      if (!name) {
        new Notice('请输入角色名称');
        return;
      }

      if (!content) {
        new Notice('请输入角色设定');
        return;
      }

      if (!content.includes('{{content}}')) {
        new Notice('角色设定必须包含 {{content}} 占位符');
        return;
      }

      this.plugin.settings.promptTemplates[this.templateIndex].name = name;
      this.plugin.settings.promptTemplates[this.templateIndex].content = content;
      this.plugin.saveSettings();
      new Notice('角色模板修改成功！');
      this.close();
      this.onCloseCallback();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// 添加角色模板 Modal
class AddRoleTemplateModal extends Modal {
  constructor(
    app: any,
    private plugin: AIAgentPlugin,
    private onCloseCallback: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '添加角色模板' });

    // 角色名称输入
    const nameContainer = contentEl.createDiv();
    nameContainer.style.marginTop = '20px';
    nameContainer.createEl('label', { text: '角色名称', cls: 'setting-item' });
    
    const nameInput = nameContainer.createEl('input', { 
      type: 'text',
      placeholder: '例如：写作专家'
    }) as HTMLInputElement;
    nameInput.style.width = '100%';
    nameInput.style.marginTop = '5px';
    nameInput.style.padding = '5px';

    // 角色设定输入
    const contentContainer = contentEl.createDiv();
    contentContainer.style.marginTop = '15px';
    contentContainer.createEl('label', { text: '角色设定', cls: 'setting-item' });
    
    const contentDesc = contentContainer.createEl('p', {
      text: '使用 {{content}} 作为要处理的内容占位符',
      cls: 'setting-item-description'
    });
    contentDesc.style.fontSize = '0.85em';
    contentDesc.style.color = 'var(--text-muted)';
    contentDesc.style.marginTop = '5px';

    const contentInput = contentContainer.createEl('textarea', {
      placeholder: '例如：你是一位专业的写作专家。请帮助用户改进以下内容的表达和结构：\n\n{{content}}'
    }) as HTMLTextAreaElement;
    contentInput.style.width = '100%';
    contentInput.style.height = '150px';
    contentInput.style.marginTop = '5px';
    contentInput.style.padding = '5px';

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
      const name = nameInput.value.trim();
      const content = contentInput.value.trim();

      if (!name) {
        new Notice('请输入角色名称');
        return;
      }

      if (!content) {
        new Notice('请输入角色设定');
        return;
      }

      if (!content.includes('{{content}}')) {
        new Notice('角色设定必须包含 {{content}} 占位符');
        return;
      }

      this.plugin.settings.promptTemplates.push({
        id: 'custom-' + Date.now(),
        name: name,
        content: content,
        isBuiltIn: false,
        enabled: true
      });

      this.plugin.saveSettings();
      new Notice('角色模板添加成功！');
      this.close();
      this.onCloseCallback();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
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
    const providerNames: Record<AIProviderType, string> = {
      'deepseek': 'DeepSeek',
      'zhipu': '智谱 AI',
      'openai': 'OpenAI',
      'kimi': 'Kimi'
    };
    const providerName = providerNames[this.providerType];
    
    contentEl.createEl('h2', { text: `添加 ${providerName} 自定义模型` });

    // 模型 ID 输入
    const modelIdContainer = contentEl.createDiv();
    modelIdContainer.style.marginTop = '20px';
    modelIdContainer.createEl('label', { text: '模型 ID', cls: 'setting-item' });
    
    const modelIdInput = modelIdContainer.createEl('input', { 
      type: 'text',
      placeholder: '例如: deepseek-v3 或 glm-4-plus'
    }) as HTMLInputElement;
    modelIdInput.name = 'model-id';
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
    }) as HTMLInputElement;
    nameInput.name = 'model-name';
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

      switch (this.providerType) {
        case 'deepseek':
          this.plugin.settings.deepseekCustomModels.push(newModel);
          break;
        case 'zhipu':
          this.plugin.settings.zhipuCustomModels.push(newModel);
          break;
        case 'openai':
          this.plugin.settings.openaiCustomModels.push(newModel);
          break;
        case 'kimi':
          this.plugin.settings.kimiCustomModels.push(newModel);
          break;
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

// AI 面板模态框（合并后的统一界面）
class AIPanelModal extends Modal {
  private content: string;
  private source: 'selection' | 'file' | undefined;
  private selectedMode: 'selection' | 'file' = 'selection';
  private loadingNotice: Notice | null = null;

  constructor(
    app: any,
    private plugin: AIAgentPlugin,
    content?: string,
    source?: 'selection' | 'file'
  ) {
    super(app);
    this.content = content || '';
    this.source = source;
    this.selectedMode = source || 'selection';
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'AI 助手' });

    // 模式选择 - Radio Button
    const modeContainer = contentEl.createDiv({ cls: 'ai-mode-container' });
    modeContainer.style.marginTop = '20px';
    modeContainer.style.padding = '10px';
    modeContainer.style.border = '1px solid var(--background-modifier-border)';
    modeContainer.style.borderRadius = '4px';

    const modeLabel = modeContainer.createEl('label', { text: '选择处理模式', cls: 'setting-item-name' });
    modeLabel.style.fontWeight = 'bold';
    modeLabel.style.display = 'block';
    modeLabel.style.marginBottom = '10px';

    const radioContainer = modeContainer.createDiv();
    radioContainer.style.display = 'flex';
    radioContainer.style.gap = '20px';

    // 选中文本单选框
    const selectionLabel = radioContainer.createEl('label', { cls: 'ai-radio-label' });
    selectionLabel.style.display = 'flex';
    selectionLabel.style.alignItems = 'center';
    selectionLabel.style.cursor = 'pointer';

    const selectionRadio = selectionLabel.createEl('input', { type: 'radio' }) as HTMLInputElement;
    selectionRadio.name = 'ai-mode';
    selectionRadio.checked = this.selectedMode === 'selection';
    selectionRadio.style.marginRight = '8px';
    selectionRadio.onclick = () => {
      this.selectedMode = 'selection';
    };

    selectionLabel.appendText('处理选中文本');

    // 处理当前文件单选框
    const fileLabel = radioContainer.createEl('label', { cls: 'ai-radio-label' });
    fileLabel.style.display = 'flex';
    fileLabel.style.alignItems = 'center';
    fileLabel.style.cursor = 'pointer';

    const fileRadio = fileLabel.createEl('input', { type: 'radio' }) as HTMLInputElement;
    fileRadio.name = 'ai-mode';
    fileRadio.checked = this.selectedMode === 'file';
    fileRadio.style.marginRight = '8px';
    fileRadio.onclick = () => {
      this.selectedMode = 'file';
    };

    fileLabel.appendText('处理当前文件');

    // Prompt 模板部分
    const promptSection = contentEl.createDiv({ cls: 'ai-prompt-section' });
    promptSection.style.marginTop = '20px';

    const promptLabel = promptSection.createEl('label', { text: '选择 AI 功能', cls: 'setting-item-name' });
    promptLabel.style.fontWeight = 'bold';
    promptLabel.style.display = 'block';
    promptLabel.style.marginBottom = '10px';

    // 创建按钮容器
    const buttonContainer = promptSection.createDiv({ cls: 'ai-button-container' });
    buttonContainer.style.display = 'grid';
    buttonContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    buttonContainer.style.gap = '10px';

    // 添加 Prompt 按钮 - 只显示启用的模板
    const visibleTemplates = this.plugin.settings.promptTemplates.filter(t => t.enabled);

    visibleTemplates.forEach(template => {
      const btn = buttonContainer.createEl('button', { text: template.name });
      btn.style.padding = '10px';
      btn.style.cursor = 'pointer';
      btn.onclick = async () => {
        await this.processWithPrompt(template);
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

    // 提交按钮容器
    const submitContainer = contentEl.createDiv();
    submitContainer.style.display = 'flex';
    submitContainer.style.alignItems = 'center';
    submitContainer.style.gap = '10px';
    submitContainer.style.marginTop = '10px';

    const submitBtn = submitContainer.createEl('button', { 
      text: '提交',
      cls: 'mod-cta'
    });
    submitBtn.style.padding = '10px 20px';
    submitBtn.onclick = async () => {
      const customPrompt = customInput.value.trim();
      if (customPrompt) {
        await this.processWithCustomPrompt(customPrompt);
      }
    };

    // 添加快捷键提示
    const shortcutHint = submitContainer.createEl('span', { 
      text: 'Ctrl+Enter 提交',
      cls: 'ai-shortcut-hint'
    });
    shortcutHint.style.fontSize = '0.85em';
    shortcutHint.style.color = 'var(--text-muted)';

    // 绑定 Ctrl+Enter 快捷键
    customInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const customPrompt = (e.target as HTMLTextAreaElement).value.trim();
        if (customPrompt) {
          this.processWithCustomPrompt(customPrompt);
        }
      }
    });

    // 统计信息和设置
    const bottomSection = contentEl.createDiv({ cls: 'ai-bottom-section' });
    bottomSection.style.marginTop = '20px';

    // 统计信息
    if (this.plugin.settings.enableLogging) {
      const stats = bottomSection.createDiv({ cls: 'ai-stats' });
      stats.style.padding = '10px';
      stats.style.border = '1px solid var(--background-modifier-border)';
      stats.style.borderRadius = '4px';

      const totalTokens = this.plugin.callLogs.reduce((sum: number, log: CallLog) => sum + (log.totalTokens || 0), 0);
      stats.createEl('p', {
        text: `调用次数: ${this.plugin.callLogs.length}   |   总 Token: ${totalTokens}`
      });
      // stats.createEl('p', { text: `总 Token: ${totalTokens}` });
    }

    // 设置链接
    const settingsLink = bottomSection.createEl('a', { text: '打开设置' });
    settingsLink.href = '#';
    settingsLink.style.display = 'block';
    settingsLink.style.marginTop = '10px';
    settingsLink.onclick = () => {
      // 打开 Obsidian 设置
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById('obsidian-ai-agent');
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
    const { plugin } = this;
    
    // 获取内容
    let content = this.content;
    let source = this.source;

    // 如果没有传入内容，根据选择的模式获取
    if (!content) {
      if (this.selectedMode === 'selection') {
        const editor = plugin.getActiveEditor();
        if (!editor) {
          new Notice('请先打开一个 Markdown 文件');
          return;
        }

        const selection = editor.getSelection();
        if (!selection) {
          new Notice('请先选择要处理的文本');
          return;
        }
        content = selection;
        source = 'selection';
      } else {
        const activeFile = plugin.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice('请先打开一个文件');
          return;
        }
        content = await plugin.app.vault.read(activeFile);
        source = 'file';
      }
    }

    const activeFile = plugin.app.workspace.getActiveFile();

    try {
      // 创建 AbortController
      plugin['currentAbortController'] = new AbortController();
      
      // 开始计时
      plugin['startTimer']();

      // 显示持续连接提示
      this.loadingNotice = new Notice('正在连接 AI，请稍候...', 0);

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
        plugin.settings.defaultModel,
        true // 生成标题
      );

      // 关闭加载提示
      if (this.loadingNotice) {
        this.loadingNotice.hide();
        this.loadingNotice = null;
      }

      // 停止计时并显示完成时间
      const elapsed = plugin['stopTimer']();
      plugin.updateStatusBar(`${elapsed}秒完成`);
      
      // 清除 AbortController
      plugin['currentAbortController'] = null;

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
      await plugin.insertResponse(response.content, source || 'selection', content);

      // 自动重写笔记标题（使用 AI 生成的标题）
      if (plugin.settings.autoRewriteTitle && activeFile && response.suggestedTitle) {
        try {
          // 清理标题中的引号
          const quotesToRemove = ['"', "'", '"', '\'', '`', '\u300C', '\u300D', '\u3010', '\u3011', '\u300E', '\u300F'];
          let cleanTitle = response.suggestedTitle;
          for (const quote of quotesToRemove) {
            cleanTitle = cleanTitle.startsWith(quote) ? cleanTitle.slice(1) : cleanTitle;
            cleanTitle = cleanTitle.endsWith(quote) ? cleanTitle.slice(0, -1) : cleanTitle;
          }
          cleanTitle = cleanTitle.trim();

          // 限制长度
          if (cleanTitle.length > 50) {
            cleanTitle = cleanTitle.substring(0, 50);
          }

          console.log('AI 建议标题:', cleanTitle, '原标题:', activeFile.basename);

          if (cleanTitle && cleanTitle !== activeFile.basename) {
            await plugin.app.fileManager.renameFile(activeFile, `${cleanTitle}.md`);
            new Notice(`标题已更新为: ${cleanTitle}`);
          }
        } catch (error) {
          console.error('重写标题失败:', error);
          // 标题重写失败不影响主流程，静默处理
        }
      }

      new Notice('AI 处理完成');

      // 成功完成，确保不会有AbortError
      return;
    } catch (error) {
      console.error('AI 调用失败:', error);
      
      // 停止计时
      plugin['stopTimer']();
      
      // 清除 AbortController
      plugin['currentAbortController'] = null;
      
      // 关闭加载提示
      if (this.loadingNotice) {
        this.loadingNotice.hide();
        this.loadingNotice = null;
      }
      
      // 更新状态栏
      plugin.updateStatusBar('AI 就绪');
      
      // 判断是否是用户主动中断
      if (error.name === 'AbortError') {
        new Notice('已停止');
      } else {
        new Notice(`AI 调用失败: ${error.message}`);
      }
      
      // 对于任何错误（包括中断），都不插入内容
      return;
    }
  }

  onClose() {
    // 关闭加载提示
    if (this.loadingNotice) {
      this.loadingNotice.hide();
      this.loadingNotice = null;
    }
    
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
          const result = await this.plugin.testConnection('deepseek');
          if (result.success) {
            new Notice('DeepSeek 连接成功！');
          } else {
            new Notice(`DeepSeek 连接失败: ${result.error}`);
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
      .setName('Base URL')
      .setDesc('智谱 AI 基础 URL。两个端点均可使用：通用端点（默认）或 Coding 端点')
      .addText(text => text
        .setPlaceholder('https://open.bigmodel.cn/api/paas/v4')
        .setValue(this.plugin.settings.zhipuBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.zhipuBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('测试连接')
      .addButton(button => button
        .setButtonText('测试')
        .setClass('mod-cta')
        .onClick(async () => {
          button.setButtonText('测试中...');
          const result = await this.plugin.testConnection('zhipu');
          if (result.success) {
            new Notice('智谱 AI 连接成功！');
          } else {
            new Notice(`智谱 AI 连接失败: ${result.error}`);
          }
          button.setButtonText('测试');
        }));

    // 智谱 AI 模型管理
    this.addZhipuModelSection(containerEl);

    // 智谱 AI MCP 配置
    containerEl.createEl('h3', { text: '智谱 AI MCP 配置' });
    
    new Setting(containerEl)
      .setName('视觉理解 MCP')
      .setDesc('启用视觉理解功能，AI可根据需要自动判断是否使用')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.zhipuMcpVision)
        .onChange(async (value) => {
          this.plugin.settings.zhipuMcpVision = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('联网搜索 MCP')
      .setDesc('启用联网搜索功能，AI可根据需要自动判断是否使用，或在用户明确要求时使用')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.zhipuMcpWebSearch)
        .onChange(async (value) => {
          this.plugin.settings.zhipuMcpWebSearch = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('网页阅读 MCP')
      .setDesc('启用网页阅读功能，AI可根据需要自动判断是否使用')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.zhipuMcpWebReader)
        .onChange(async (value) => {
          this.plugin.settings.zhipuMcpWebReader = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('开源仓库 MCP')
      .setDesc('启用开源仓库读取功能，AI可根据需要自动判断是否使用')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.zhipuMcpZread)
        .onChange(async (value) => {
          this.plugin.settings.zhipuMcpZread = value;
          await this.plugin.saveSettings();
        }));

    // OpenAI 配置
    containerEl.createEl('h2', { text: 'OpenAI 配置' });
    
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('OpenAI API Key')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.openaiApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openaiApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Base URL')
      .setDesc('OpenAI API 基础 URL（支持自定义代理）')
      .addText(text => text
        .setPlaceholder('https://api.openai.com/v1')
        .setValue(this.plugin.settings.openaiBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.openaiBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('测试连接')
      .addButton(button => button
        .setButtonText('测试')
        .setClass('mod-cta')
        .onClick(async () => {
          button.setButtonText('测试中...');
          const result = await this.plugin.testConnection('openai');
          if (result.success) {
            new Notice('OpenAI 连接成功！');
          } else {
            new Notice(`OpenAI 连接失败: ${result.error}`);
          }
          button.setButtonText('测试');
        }));

    // OpenAI 模型管理
    this.addOpenAIModelSection(containerEl);

    // Kimi 配置
    containerEl.createEl('h2', { text: 'Kimi 配置' });
    
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Kimi API Key')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.kimiApiKey)
        .onChange(async (value) => {
          this.plugin.settings.kimiApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Base URL')
      .setDesc('Kimi API 基础 URL（支持私有代理）')
      .addText(text => text
        .setPlaceholder('https://api.moonshot.cn/v1')
        .setValue(this.plugin.settings.kimiBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.kimiBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('测试连接')
      .addButton(button => button
        .setButtonText('测试')
        .setClass('mod-cta')
        .onClick(async () => {
          button.setButtonText('测试中...');
          const result = await this.plugin.testConnection('kimi');
          if (result.success) {
            new Notice('Kimi 连接成功！');
          } else {
            new Notice(`Kimi 连接失败: ${result.error}`);
          }
          button.setButtonText('测试');
        }));

    // Kimi 模型管理
    this.addKimiModelSection(containerEl);

    // 默认设置
    containerEl.createEl('h2', { text: '默认设置' });

    new Setting(containerEl)
      .setName('默认提供商')
      .setDesc('选择默认使用的 AI 提供商')
      .addDropdown(dropdown => dropdown
        .addOption('deepseek', 'DeepSeek')
        .addOption('zhipu', '智谱 AI')
        .addOption('openai', 'OpenAI')
        .addOption('kimi', 'Kimi')
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
          ...this.plugin.settings.zhipuCustomModels,
          ...this.plugin.settings.openaiModels,
          ...this.plugin.settings.openaiCustomModels,
          ...this.plugin.settings.kimiModels,
          ...this.plugin.settings.kimiCustomModels
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

    // Prompt 角色模板管理
    containerEl.createEl('h2', { text: 'Prompt 角色模板' });

    // 显示提示信息
    const descDiv = containerEl.createDiv();
    descDiv.createEl('p', { 
      text: '在这里创建 AI 角色设定，例如"写作专家"、"代码审查员"等。在笔记中选定内容后，使用快捷键即可让 AI 按照设定的角色身份处理内容。' 
    });
    descDiv.style.marginBottom = '20px';

    // 默认角色选择（单选）
    const customTemplates = this.plugin.settings.promptTemplates.filter(t => !t.isBuiltIn);
    if (customTemplates.length > 0) {
      new Setting(containerEl)
        .setName('默认角色模板')
        .setDesc('设置快捷键使用的默认 AI 角色。选择一个角色后，按下快捷键将直接使用该角色处理内容，不弹出面板。留空则每次使用快捷键时弹出选择面板。')
        .addDropdown(dropdown => {
          dropdown.addOption('', '不设置（弹出选择面板）');
          customTemplates.forEach(template => {
            dropdown.addOption(template.id, template.name);
          });
          dropdown.setValue(this.plugin.settings.defaultRoleTemplateId);
          dropdown.onChange(async (value) => {
            this.plugin.settings.defaultRoleTemplateId = value;
            await this.plugin.saveSettings();
          });
        });
    }

    // 自定义模板列表
    this.plugin.settings.promptTemplates.forEach((template, index) => {
      const setting = new Setting(containerEl);
      setting.setName(template.name)
        .setDesc(template.content.substring(0, 80) + (template.content.length > 80 ? '...' : ''))
        .addExtraButton(button => button
          .setIcon('edit')
          .setTooltip('编辑')
          .onClick(() => {
            new EditRoleTemplateModal(this.plugin.app, this.plugin, index, template, () => {
              this.display();
            }).open();
          }))
        .addExtraButton(button => button
          .setIcon('trash')
          .setTooltip('删除')
          .onClick(async () => {
            this.plugin.settings.promptTemplates.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    });

    new Setting(containerEl)
      .setName('添加角色模板')
      .setDesc('创建新的 AI 角色设定')
      .addButton(button => button
        .setButtonText('添加')
        .setClass('mod-cta')
        .onClick(() => {
          new AddRoleTemplateModal(this.plugin.app, this.plugin, () => {
            this.display();
          }).open();
        }));

    // 快捷键设置
    containerEl.createEl('h2', { text: '快捷键设置' });

    new Setting(containerEl)
      .setName('处理选中文本快捷键')
      .setDesc('使用 AI 处理选中文本的快捷键（格式：mod+shift+a，其中 mod=Cmd/Ctrl，支持：mod, ctrl, shift, alt）。修改后需要重新加载插件。')
      .addText(text => text
        .setPlaceholder('mod+shift+a')
        .setValue(this.plugin.settings.hotkeyProcessSelection)
        .onChange(async (value) => {
          this.plugin.settings.hotkeyProcessSelection = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('处理当前文件快捷键')
      .setDesc('使用 AI 处理当前文件的快捷键（格式：mod+shift+f）。修改后需要重新加载插件。')
      .addText(text => text
        .setPlaceholder('mod+shift+f')
        .setValue(this.plugin.settings.hotkeyProcessFile)
        .onChange(async (value) => {
          this.plugin.settings.hotkeyProcessFile = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('显示面板快捷键')
      .setDesc('打开 AI 助手面板的快捷键（留空表示不设置快捷键）。修改后需要重新加载插件。')
      .addText(text => text
        .setPlaceholder('留空不设置')
        .setValue(this.plugin.settings.hotkeyShowPanel)
        .onChange(async (value) => {
          this.plugin.settings.hotkeyShowPanel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('停止 AI 快捷键')
      .setDesc('停止正在进行的 AI 处理的快捷键（默认为 Escape 键）')
      .addText(text => text
        .setPlaceholder('escape')
        .setValue(this.plugin.settings.hotkeyStopAI)
        .onChange(async (value) => {
          this.plugin.settings.hotkeyStopAI = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('快捷键说明')
      .setDesc('快捷键格式说明：使用 + 号连接，支持的关键字：mod（Mac上是Cmd，Windows上是Ctrl）、ctrl、shift、alt。例如：mod+shift+a 表示 Cmd+Shift+A (Mac) 或 Ctrl+Shift+A (Windows)');

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

    new Setting(containerEl)
      .setName('自动重写笔记标题')
      .setDesc('AI 回写完成后，根据笔记内容自动修改笔记标题。如果中途中断则不修改标题。')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoRewriteTitle)
        .onChange(async (value) => {
          this.plugin.settings.autoRewriteTitle = value;
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

  // OpenAI 模型管理部分
  private addOpenAIModelSection(containerEl: any) {
    containerEl.createEl('h3', { text: 'OpenAI 模型' });
    
    // 内置模型列表
    this.plugin.settings.openaiModels.forEach(model => {
      new Setting(containerEl)
        .setName(model.name)
        .setDesc(`ID: ${model.id}（内置）`)
        .addExtraButton(button => button
          .setIcon('info')
          .setTooltip('内置模型')
          .setDisabled(true));
    });
    
    // 自定义模型列表
    this.plugin.settings.openaiCustomModels.forEach((model, index) => {
      const setting = new Setting(containerEl);
      setting.setName(model.name)
        .setDesc(`ID: ${model.id}（自定义）`)
        .addExtraButton(button => button
          .setIcon('trash')
          .setTooltip('删除')
          .onClick(async () => {
            this.plugin.settings.openaiCustomModels.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    });
    
    // 添加自定义模型按钮
    new Setting(containerEl)
      .setName('添加 OpenAI 自定义模型')
      .setDesc('添加新的 OpenAI 模型，API URL 保持不变')
      .addButton(button => button
        .setButtonText('添加')
        .setClass('mod-cta')
        .onClick(() => {
          new AddCustomModelModal(this.plugin.app, this.plugin, 'openai', () => {
            this.display();
          }).open();
        }));
  }

  // Kimi 模型管理部分
  private addKimiModelSection(containerEl: any) {
    containerEl.createEl('h3', { text: 'Kimi 模型' });
    
    // 内置模型列表
    this.plugin.settings.kimiModels.forEach(model => {
      new Setting(containerEl)
        .setName(model.name)
        .setDesc(`ID: ${model.id}（内置）`)
        .addExtraButton(button => button
          .setIcon('info')
          .setTooltip('内置模型')
          .setDisabled(true));
    });
    
    // 自定义模型列表
    this.plugin.settings.kimiCustomModels.forEach((model, index) => {
      const setting = new Setting(containerEl);
      setting.setName(model.name)
        .setDesc(`ID: ${model.id}（自定义）`)
        .addExtraButton(button => button
          .setIcon('trash')
          .setTooltip('删除')
          .onClick(async () => {
            this.plugin.settings.kimiCustomModels.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    });
    
    // 添加自定义模型按钮
    new Setting(containerEl)
      .setName('添加 Kimi 自定义模型')
      .setDesc('添加新的 Kimi 模型，API URL 保持不变')
      .addButton(button => button
        .setButtonText('添加')
        .setClass('mod-cta')
        .onClick(() => {
          new AddCustomModelModal(this.plugin.app, this.plugin, 'kimi', () => {
            this.display();
          }).open();
        }));
  }
}