import { IAIProvider, AIRequest, AIResponse } from '../types';

// MCP 配置接口
export interface ZhipuMcpConfig {
  vision: boolean;      // 视觉理解 MCP
  webSearch: boolean;   // 联网搜索 MCP
  webReader: boolean;   // 网页阅读 MCP
  zread: boolean;       // 开源仓库 MCP
}

export class ZhipuProvider implements IAIProvider {
  name = '智谱 AI';
  type = 'zhipu' as const;
  
  constructor(
    private apiKey: string,
    private baseUrl: string = 'https://open.bigmodel.cn/api/paas/v4',
    private mcpConfig?: ZhipuMcpConfig
  ) {}
  
  // 判断是否需要使用联网搜索
  private shouldUseWebSearch(text: string): boolean {
    if (!this.mcpConfig?.webSearch) return false;
    
    // 关键词检测：用户明确要求联网搜索
    const explicitKeywords = [
      '搜索', '查找', '上网', '联网', '查询', '最新', '实时', '当前',
      '百度', '谷歌', 'google', '新闻', '资讯'
    ];
    
    // 问题检测：可能需要联网的问题
    const questionPatterns = [
      /什么[是]/, /什么是/, /怎么样/, /如何/, /怎么/, /为什么/,
      /什么时候/, /哪里/, /谁/, /哪个/, /多少/, /多久/
    ];
    
    const lowerText = text.toLowerCase();
    
    // 检测明确要求
    for (const keyword of explicitKeywords) {
      if (text.includes(keyword)) {
        return true;
      }
    }
    
    // 检测需要联网的问题（当包含疑问词且不是纯文本分析任务时）
    for (const pattern of questionPatterns) {
      if (pattern.test(text)) {
        // 如果是要求分析已知内容，不使用搜索
        if (!text.includes('分析') && !text.includes('总结') && !text.includes('改写')) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // 判断是否需要使用网页阅读
  private shouldUseWebReader(text: string): boolean {
    if (!this.mcpConfig?.webReader) return false;
    
    // 检测 URL 或网站相关关键词
    const urlPatterns = [
      /https?:\/\/[^\s]+/,
      /www\.[^\s]+/,
      /\.com/, /\.cn/, /\.org/, /\.net/, /\.gov/
    ];
    
    const keywords = [
      '访问', '打开', '读取', '抓取', '网页', '网站', '链接', 'url', 'http'
    ];
    
    for (const pattern of urlPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 判断是否需要使用开源仓库
  private shouldUseZread(text: string): boolean {
    if (!this.mcpConfig?.zread) return false;
    
    // 检测 GitHub 或代码仓库相关关键词
    const patterns = [
      /github\.com/, /gitlab\.com/,
      /仓库/, /项目/, /代码/, /repo/, /repository/,
      /pull\s*request/, /pr/, /issue/, /commit/
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(text.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }
  
  // 构建工具配置
  private buildTools(userText: string): any[] {
    const tools: any[] = [];
    
    if (!this.mcpConfig) return tools;
    
    // 联网搜索 MCP
    if (this.shouldUseWebSearch(userText)) {
      tools.push({
        type: 'web_search',
        web_search: {
          search_result: true
        }
      });
    }
    
    // 网页阅读 MCP
    if (this.shouldUseWebReader(userText)) {
      tools.push({
        type: 'web_reader'
      });
    }
    
    // 开源仓库 MCP
    if (this.shouldUseZread(userText)) {
      tools.push({
        type: 'retrieval'
      });
    }
    
    return tools;
  }
  
  async call(request: AIRequest): Promise<AIResponse> {
    // 兼容用户输入完整 URL 或基础 URL 的情况
    let url = this.baseUrl;
    
    // 如果 URL 不以 /chat/completions 结尾，则拼接
    if (!url.endsWith('/chat/completions')) {
      url = `${url}/chat/completions`;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
    
    const messages: Array<{ role: string; content: string }> = [];
    
    // 构建用户消息内容，用于判断是否需要使用 MCP
    let userText = request.prompt;
    if (request.content) {
      userText = `${request.prompt}\n\n${request.content}`;
    }
    
    if (request.content) {
      messages.push({
        role: 'user',
        content: userText
      });
    } else {
      messages.push({
        role: 'user',
        content: request.prompt
      });
    }
    
    // 构建请求体 - 注意：智谱AI可能不支持某些参数
    const body: any = {
      model: request.modelId,
      messages: messages
    };
    
    // 只在明确指定时才添加这些参数
    if (request.maxTokens) {
      body.max_tokens = request.maxTokens;
    }
    if (request.temperature) {
      body.temperature = request.temperature;
    }
    
    // Coding 端点不支持 MCP 工具，只在通用端点添加工具配置
    const isCodingEndpoint = url.includes('/coding/');
    const tools = isCodingEndpoint ? [] : this.buildTools(userText);
    let mcpTools: string[] = [];
    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
      tools.forEach(tool => {
        if (tool.type === 'web_search') mcpTools.push('联网搜索');
        if (tool.type === 'web_reader') mcpTools.push('网页阅读');
        if (tool.type === 'retrieval') mcpTools.push('开源仓库');
      });
    }
    
    try {
      console.log('智谱 API 请求详情:', {
        url,
        model: body.model,
        messagesCount: messages.length,
        hasTools: !!body.tools,
        requestBody: body
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: request.abortSignal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('智谱 API 响应错误:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          requestBody: body
        });
        throw new Error(`智谱 AI API 错误: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      let content = data.choices[0].message.content;
      
      // 添加MCP使用提示
      if (mcpTools.length > 0) {
        const mcpNotice = `\n\n> [!info] AI已使用以下MCP工具: ${mcpTools.join('、')}\n`;
        content = content + mcpNotice;
      }
      
      return {
        content: content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      // 如果是AbortError，直接重新抛出，不要包装
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new Error(`智谱 AI API 调用失败: ${error.message}`);
      }
      throw new Error('智谱 AI API 调用失败: 未知错误');
    }
  }
}