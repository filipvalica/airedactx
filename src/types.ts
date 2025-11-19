// src/types.ts
export interface RedactionRule {
  id: string;
  type: 'literal' | 'regex' | 'divider';
  find: string;
  replace: string;
  enabled: boolean;
  note?: string;
}

export interface AppSettings {
  useAnywhereMode: boolean;
  hoverAreaPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  replaceTextUsing: '[[..]]' | '{{..}}' | '((..))' | '<<..>>'; 
  siteWhitelist: string[];
}