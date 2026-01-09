import { PromptTemplate } from './types';

export const BUILTIN_PROMPTS: PromptTemplate[] = [
  {
    id: 'summarize',
    name: '总结内容',
    content: '请总结以下内容：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'expand',
    name: '扩展内容',
    content: '请扩展以下内容，添加更多细节：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'rewrite',
    name: '重写内容',
    content: '请重写以下内容，使其更清晰易读：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'translate',
    name: '翻译内容',
    content: '请将以下内容翻译成英文：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'analyze',
    name: '分析内容',
    content: '请分析以下内容，提取关键点和结论：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'qa',
    name: '问答',
    content: '请根据以下内容回答问题：\n\n{{content}}\n\n问题：',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'code-review',
    name: '代码审查',
    content: '请审查以下代码，提出改进建议：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'simplify',
    name: '简化内容',
    content: '请将以下内容简化，使其更容易理解：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'fix-grammar',
    name: '语法修正',
    content: '请检查并修正以下内容的语法和拼写错误：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'format',
    name: '格式化',
    content: '请格式化以下内容：\n\n{{content}}',
    isBuiltIn: true,
    enabled: true
  }
];

export function expandTemplate(template: string, content: string, title?: string, date?: string): string {
  let result = template;
  result = result.replace(/\{\{content\}\}/g, content);
  
  if (title) {
    result = result.replace(/\{\{title\}\}/g, title);
  }
  
  if (date) {
    result = result.replace(/\{\{date\}\}/g, date);
  }
  
  return result;
}