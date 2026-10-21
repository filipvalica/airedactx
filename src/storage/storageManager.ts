// src/storage/storageManager.ts
// All persistence goes through browser.storage.local. Nothing here touches the network:
// the only fetch is the extension's own bundled airedactx_rules.tsv.

import browser from 'webextension-polyfill';
import { AppSettings, RedactionRule, DELIMITER_STYLES, HOVER_POSITIONS, HIGHLIGHT_STYLES } from '../types';
import { parseRulesTsv } from '../core/tsv';

const RULES_KEY = 'redactionRules';
const SETTINGS_KEY = 'appSettings';

export const DEFAULT_WHITELIST = [
  'chatgpt.com',
  'openai.com',
  'claude.ai',
  'gemini.google.com',
  'aistudio.google.com',
  'copilot.microsoft.com',
  'bing.com',
  'perplexity.ai',
  'x.com',
  'grok.com',
  'deepseek.com',
];

export const DEFAULT_SETTINGS: AppSettings = {
  useAnywhereMode: false,
  buttonPosition: 'bottom-right',
  delimiterStyle: '[[..]]',
  highlightStyle: 'amber',
  allowedSites: DEFAULT_WHITELIST,
};

const includes = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

/**
 * Names that settings were stored under before 1.4.0, mapped to the current key. Applied on
 * every read, so an existing install and an old exported settings file both carry over.
 * Never remove an entry: there is no way to know which installs still hold the old name.
 */
export const LEGACY_SETTING_KEYS: Record<string, keyof AppSettings> = {
  hoverAreaPosition: 'buttonPosition',
  replaceTextUsing: 'delimiterStyle',
  siteWhitelist: 'allowedSites',
};

/** Rename legacy keys; a current key, when present, wins over its legacy twin. */
export const migrateLegacyKeys = (raw: Record<string, unknown>): Record<string, unknown> => {
  const migrated: Record<string, unknown> = { ...raw };
  for (const [oldKey, newKey] of Object.entries(LEGACY_SETTING_KEYS)) {
    if (oldKey in migrated) {
      if (!(newKey in migrated)) migrated[newKey] = migrated[oldKey];
      delete migrated[oldKey];
    }
  }
  return migrated;
};

/**
 * Coerce anything (stored object, imported file) into a valid AppSettings.
 * Unknown keys are dropped and invalid values fall back to the default.
 */
export const normalizeSettings = (input: unknown): AppSettings => {
  const raw = migrateLegacyKeys((input && typeof input === 'object' ? input : {}) as Record<string, unknown>);
  const whitelist = Array.isArray(raw.allowedSites)
    ? raw.allowedSites
        .filter((d): d is string => typeof d === 'string')
        .map((d) => d.trim())
        .filter(Boolean)
    : DEFAULT_SETTINGS.allowedSites;
  return {
    useAnywhereMode: typeof raw.useAnywhereMode === 'boolean' ? raw.useAnywhereMode : DEFAULT_SETTINGS.useAnywhereMode,
    buttonPosition: includes(HOVER_POSITIONS, raw.buttonPosition)
      ? raw.buttonPosition
      : DEFAULT_SETTINGS.buttonPosition,
    delimiterStyle: includes(DELIMITER_STYLES, raw.delimiterStyle)
      ? raw.delimiterStyle
      : DEFAULT_SETTINGS.delimiterStyle,
    highlightStyle: includes(HIGHLIGHT_STYLES, raw.highlightStyle)
      ? raw.highlightStyle
      : DEFAULT_SETTINGS.highlightStyle,
    allowedSites: whitelist,
  };
};

/**
 * Overlay an imported settings file on the current settings. The file is migrated before the
 * overlay, otherwise an old export's siteWhitelist would lose to the current allowedSites.
 */
export const mergeImportedSettings = (current: AppSettings, imported: Record<string, unknown>): AppSettings =>
  normalizeSettings({ ...current, ...migrateLegacyKeys(imported) });

export const getRules = async (): Promise<RedactionRule[]> => {
  const result = await browser.storage.local.get(RULES_KEY);
  const stored = result[RULES_KEY];
  return Array.isArray(stored) ? (stored as RedactionRule[]) : [];
};

export const saveRules = async (rules: RedactionRule[]): Promise<void> => {
  await browser.storage.local.set({ [RULES_KEY]: rules });
};

/** Read the ruleset bundled with the extension. Returns [] (and logs) if it cannot be read. */
export const loadMasterRules = async (): Promise<RedactionRule[]> => {
  try {
    const response = await fetch(browser.runtime.getURL('airedactx_rules.tsv'));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseRulesTsv(await response.text());
  } catch (error) {
    console.error('AIRedactX: could not load bundled rules', error);
    return [];
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(result[SETTINGS_KEY]);
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await browser.storage.local.set({ [SETTINGS_KEY]: normalizeSettings(settings) });
};

export const resetSettings = async (): Promise<AppSettings> => {
  await browser.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  return DEFAULT_SETTINGS;
};
