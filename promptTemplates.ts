import { PromptTemplate } from './types';

export const BUILTIN_PROMPTS: PromptTemplate[] = [];

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