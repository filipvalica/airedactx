// src/storage/storageManager.ts

import browser from 'webextension-polyfill';
import { RedactionRule, AppSettings } from '../types';

// --- Default Values ---
// Exported to be available in the background script for installation
export const DEFAULT_RULES: RedactionRule[] = [
  { id: `rule-default-1`, type: 'literal', find: 'John Doe', replace: 'REDACTED_NAME', enabled: true },
  { id: `rule-default-2`, type: 'regex', find: `\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b`, replace: 'Email', enabled: true },
  { id: `rule-default-3`, type: 'regex', find: `\\b\\d{3}-\\d{2}-\\d{4}\\b`, replace: 'SSN', enabled: true },
  { id: `rule-default-4`, type: 'regex', find: `\\b(?:\\d[ -]*?){13,16}\\b`, replace: 'Credit Card', enabled: true },
  { id: `rule-default-5`, type: 'regex', find: `\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b`, replace: 'IPv4', enabled: true },
  { id: `rule-default-6`, type: 'regex', find: `(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}`, replace: 'IPv6', enabled: true },
  { id: `rule-default-7`, type: 'regex', find: `([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})`, replace: 'MAC Address', enabled: true },
  { id: `rule-default-8`, type: 'regex', find: `AKIA[0-9A-Z]{16}`, replace: 'AWS Key', enabled: true },
];

const DEFAULT_SETTINGS: AppSettings = {
  useAnywhereMode: true,
  hoverAreaPosition: 'bottom-right',
  replaceTextUsing: '[[..]]',
};

// --- Storage Keys ---
const RULES_KEY = 'redactionRules';
const SETTINGS_KEY = 'appSettings';

// --- Rules Management ---

export const getRules = async (): Promise<RedactionRule[]> => {
  const result = await browser.storage.local.get(RULES_KEY);
  // If rules exist in storage (even an empty array), return them. Otherwise, return the defaults.
  return result.hasOwnProperty(RULES_KEY) ? (result[RULES_KEY] as RedactionRule[]) : DEFAULT_RULES;
};

export const saveRules = async (rules: RedactionRule[]): Promise<void> => {
  await browser.storage.local.set({ [RULES_KEY]: rules });
};

// --- Settings Management ---

export const getSettings = async (): Promise<AppSettings> => {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as AppSettings) };
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
};