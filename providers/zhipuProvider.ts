import { IAIProvider, AIRequest, AIResponse } from '../types';

export class ZhipuProvider implements IAIProvider {
  name = '智谱 AI';
  type = 'zhipu' as const;
  
  constructor(private apiKey: string) {}
  
  async call(request: AIRequest): Promise<AIResponse> {
    const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
    
    const messages: Array<{ role: string; content: string }> = [];
    
    if (request.content) {
      messages.push({
        role: 'user',
        content: `${request.prompt}\n\n${request.content}`
      });
    } else {
      messages.push({
        role: 'user',
        content: request.prompt
      });
    }
    
    const body = {
      model: request.modelId,
      messages: messages,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`智谱 AI API 错误: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`智谱 AI API 调用失败: ${error.message}`);
      }
      throw new Error('智谱 AI API 调用失败: 未知错误');
    }
  }
}