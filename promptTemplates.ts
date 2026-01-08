import { PromptTemplate } from './types';

export const BUILTIN_PROMPTS: PromptTemplate[] = [
  {
    id: 'summary',
    name: '总结',
    content: '请对以下内容进行简洁的总结，提取关键要点：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'bullet-points',
    name: '要点提取',
    content: '请将以下内容整理成清晰的要点列表：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'translate-to-cn',
    name: '翻译为中文',
    content: '请将以下内容翻译为流畅的中文：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'translate-to-en',
    name: '翻译为英文',
    content: 'Please translate the following content to fluent English:\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'rewrite',
    name: '改写/润色',
    content: '请改写和润色以下内容，使其更加清晰、流畅和专业：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'explain-code',
    name: '代码解释',
    content: '请详细解释以下代码的功能和逻辑：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'expand',
    name: '扩展内容',
    content: '请对以下内容进行扩展，增加更多细节和深度：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'simplify',
    name: '简化内容',
    content: '请将以下内容简化，使其更容易理解：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'fix-grammar',
    name: '语法修正',
    content: '请检查并修正以下内容的语法和拼写错误：\n\n{{content}}',
    isBuiltIn: true
  },
  {
    id: 'keywords',
    name: '关键词提取',
    content: '请从以下内容中提取关键词：\n\n{{content}}',
    isBuiltIn: true
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