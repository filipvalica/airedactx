// src/storage/storageManager.ts
import browser from 'webextension-polyfill';
import { RedactionRule, AppSettings } from '../types';

export const DEFAULT_RULES: RedactionRule[] = [];

const DEFAULT_WHITELIST = [
    "chatgpt.com",
    "openai.com",
    "claude.ai",
    "gemini.google.com",
    "aistudio.google.com",
    "copilot.microsoft.com",
    "bing.com",
    "perplexity.ai",
    "x.com",
    "grok.com",
    "deepseek.com"
];

const DEFAULT_SETTINGS: AppSettings = {
  useAnywhereMode: false,
  hoverAreaPosition: 'bottom-right',
  replaceTextUsing: '[[..]]',
  siteWhitelist: DEFAULT_WHITELIST, // Fixed: Added default value
};

const RULES_KEY = 'redactionRules';
const SETTINGS_KEY = 'appSettings';

export const getRules = async (): Promise<RedactionRule[]> => {
  const result = await browser.storage.local.get(RULES_KEY);
  return result.hasOwnProperty(RULES_KEY) ? (result[RULES_KEY] as RedactionRule[]) : DEFAULT_RULES;
};

export const saveRules = async (rules: RedactionRule[]): Promise<void> => {
  await browser.storage.local.set({ [RULES_KEY]: rules });
};

export const loadMasterRules = async (): Promise<RedactionRule[]> => {
  try {
    const tsvUrl = browser.runtime.getURL('airedactx_rules.tsv');
    const response = await fetch(tsvUrl);
    if (!response.ok) throw new Error(`Failed to fetch master rules: ${response.statusText}`);
    
    const tsvText = await response.text();
    const lines = tsvText.trim().split(/\r?\n/);
    lines.shift(); // Remove header

    const trimQuotes = (str: string = '') => str.trim().replace(/^"|"$/g, '');

    return lines.map((line, index): RedactionRule | null => {
      if (!line.trim() || line.startsWith('#')) return null;

      const parts = line.split('\t');
      const [type, find, replace, active, note] = parts;

      if (!type) return null;

      const rule: RedactionRule = {
        id: `master-rule-${Date.now()}-${index}`,
        type: type.trim() as 'literal' | 'regex' | 'divider',
        find: trimQuotes(find),
        replace: trimQuotes(replace),
        enabled: active ? active.trim().toUpperCase() === 'Y' : true,
        note: note ? note.trim().substring(0, 255) : undefined,
      };
      
      if (rule.type === 'divider') {
          rule.find = note || '';
          rule.replace = '';
      }
      return rule;
    }).filter((rule): rule is RedactionRule => rule !== null);
  } catch (error) {
    console.error("Could not load or parse master rules file:", error);
    return [];
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as AppSettings) };
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
};

export const resetSettings = async (): Promise<AppSettings> => {
  await browser.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  return DEFAULT_SETTINGS;
};