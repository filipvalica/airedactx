// src/storage/storageManager.ts

import browser from 'webextension-polyfill';
import { RedactionRule, AppSettings } from '../types';

// --- Default Values ---
const DEFAULT_RULES: RedactionRule[] = [
  // Add some sensible defaults for the user to start with
  {
    id: `rule-${Date.now()}-1`,
    type: 'literal',
    find: 'John Doe',
    replace: 'REDACTED_NAME',
    enabled: true,
  },
  {
    id: `rule-${Date.now()}-2`,
    type: 'regex',
    find: '\\b\\d{3}-\\d{2}-\\d{4}\\b', // Matches SSN format
    replace: 'REDACTED_SSN',
    enabled: true,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  useAnywhereMode: true,
  hoverAreaPosition: 'bottom-right',
  conflictResolution: 'first',
};

// --- Storage Keys ---
const RULES_KEY = 'redactionRules';
const SETTINGS_KEY = 'appSettings';

// --- Rules Management ---

export const getRules = async (): Promise<RedactionRule[]> => {
  const result = await browser.storage.local.get(RULES_KEY);
  // If no rules are found, initialize with defaults
  return result[RULES_KEY] ? (result[RULES_KEY] as RedactionRule[]) : DEFAULT_RULES;
};

export const saveRules = async (rules: RedactionRule[]): Promise<void> => {
  await browser.storage.local.set({ [RULES_KEY]: rules });
};

// --- Settings Management ---

export const getSettings = async (): Promise<AppSettings> => {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  // Merge stored settings with defaults to handle new settings in the future
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as AppSettings) };
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
};