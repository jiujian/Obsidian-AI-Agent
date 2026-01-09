// AI 提供商类型
export type AIProviderType = 'deepseek' | 'zhipu' | 'openai' | 'kimi';

// 结果插入位置
export type InsertPosition = 'cursor' | 'below-selection' | 'new-file';

// 结果插入格式
export type InsertFormat = 'plain' | 'markdown' | 'callout';

// 模型信息
export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProviderType;
  enabled: boolean;
}

// AI 请求
export interface AIRequest {
  prompt: string;
  content?: string;
  modelId: string;
  provider: AIProviderType;
  maxTokens?: number;
  temperature?: number;
}

// AI 响应
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// AI Provider 接口
export interface IAIProvider {
  name: string;
  type: AIProviderType;
  call(request: AIRequest): Promise<AIResponse>;
}

// Prompt 模板
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isBuiltIn: boolean;
  enabled: boolean; // 是否启用（仅对内置模板有效）
}

// 插件配置
export interface AIAgentSettings {
  // DeepSeek 配置
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModels: ModelInfo[];
  deepseekCustomModels: ModelInfo[]; // 自定义 DeepSeek 模型
  
  // 智谱 AI 配置
  zhipuApiKey: string;
  zhipuBaseUrl: string; // 智谱 Base URL
  zhipuModels: ModelInfo[];
  zhipuCustomModels: ModelInfo[]; // 自定义智谱 AI 模型
  
  // OpenAI 配置
  openaiApiKey: string;
  openaiBaseUrl: string; // OpenAI Base URL（支持自定义代理）
  openaiModels: ModelInfo[];
  openaiCustomModels: ModelInfo[]; // 自定义 OpenAI 模型
  
  // Kimi 配置
  kimiApiKey: string;
  kimiBaseUrl: string; // Kimi Base URL
  kimiModels: ModelInfo[];
  kimiCustomModels: ModelInfo[]; // 自定义 Kimi 模型
  
  // 默认设置
  defaultProvider: AIProviderType;
  defaultModel: string;
  
  // 调用设置
  timeout: number;
  maxTokens: number;
  temperature: number;
  
  // 输出设置
  insertPosition: InsertPosition;
  insertFormat: InsertFormat;
  
  // Prompt 模板
  promptTemplates: PromptTemplate[];
  showDefaultTemplates: boolean; // 是否显示默认 Prompt 模板
  
  // 日志设置
  enableLogging: boolean;
}

// 调用记录
export interface CallLog {
  timestamp: number;
  provider: AIProviderType;
  model: string;
  prompt: string;
  response: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}