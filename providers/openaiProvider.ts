import { IAIProvider, AIRequest, AIResponse } from '../types';

export class OpenAIProvider implements IAIProvider {
  name = 'OpenAI';
  type = 'openai' as const;
  
  constructor(
    private apiKey: string,
    private baseUrl: string = 'https://api.openai.com/v1'
  ) {}
  
  async call(request: AIRequest): Promise<AIResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    
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
        body: JSON.stringify(body),
        signal: request.abortSignal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API 错误: ${response.status} - ${errorText}`);
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
      // 如果是AbortError，直接重新抛出，不要包装
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new Error(`OpenAI API 调用失败: ${error.message}`);
      }
      throw new Error('OpenAI API 调用失败: 未知错误');
    }
  }
}