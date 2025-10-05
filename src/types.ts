// src/types.ts

export interface RedactionRule {
  id: string; // A unique identifier for each rule
  type: 'literal' | 'regex' | 'divider';
  find: string;
  replace: string;
  enabled: boolean;
  note?: string; // Optional field for user notes
}

export interface AppSettings {
  useAnywhereMode: boolean;
  hoverAreaPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  replaceTextUsing: '[[..]]' | '{{..}}' | '((..))' | '<<..>>';
}