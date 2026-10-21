// src/storage/settings.test.ts
import { describe, it, expect, vi } from 'vitest';

// storageManager imports the polyfill, which throws outside an extension. Stub it.
vi.mock('webextension-polyfill', () => ({
  default: { storage: { local: { get: vi.fn(), set: vi.fn() } }, runtime: { getURL: vi.fn() } },
}));

const { normalizeSettings, mergeImportedSettings, DEFAULT_SETTINGS } = await import('./storageManager');
const { isPageAllowed, parseSiteList } = await import('../core/siteAllow');

describe('normalizeSettings', () => {
  it('returns defaults for garbage input', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
  });

  it('drops unknown keys and invalid enum values, keeps valid ones', () => {
    const result = normalizeSettings({
      useAnywhereMode: true,
      delimiterStyle: '**..**',
      buttonPosition: 'top-left',
      highlightStyle: 'neon',
      extra: 1,
      allowedSites: ['a.com', 3, ' b.com '],
    });
    expect(result).toEqual({
      useAnywhereMode: true,
      delimiterStyle: '[[..]]',
      buttonPosition: 'top-left',
      highlightStyle: 'amber',
      allowedSites: ['a.com', 'b.com'],
    });
    expect(normalizeSettings({ highlightStyle: 'none' }).highlightStyle).toBe('none');
  });
});

describe('normalizeSettings legacy keys', () => {
  it('carries pre-1.4.0 names over to the current ones', () => {
    const result = normalizeSettings({
      hoverAreaPosition: 'top-left',
      replaceTextUsing: '{{..}}',
      siteWhitelist: ['old.example'],
    });
    expect(result).toMatchObject({
      buttonPosition: 'top-left',
      delimiterStyle: '{{..}}',
      allowedSites: ['old.example'],
    });
    expect(result).not.toHaveProperty('siteWhitelist');
  });

  it('lets an old exported file overwrite the current value when imported', () => {
    const current = { ...DEFAULT_SETTINGS, allowedSites: ['new.example'] };
    expect(mergeImportedSettings(current, { siteWhitelist: ['old.example'] }).allowedSites).toEqual(['old.example']);
  });

  it('prefers the current key when both are present', () => {
    expect(normalizeSettings({ siteWhitelist: ['old.example'], allowedSites: ['new.example'] }).allowedSites).toEqual([
      'new.example',
    ]);
  });
});

describe('isPageAllowed', () => {
  const settings = { ...DEFAULT_SETTINGS, allowedSites: ['claude.ai', 'https://chatgpt.com/'] };
  it('matches the domain and its subdomains, tolerating a pasted URL', () => {
    expect(isPageAllowed(settings, 'claude.ai')).toBe(true);
    expect(isPageAllowed(settings, 'www.claude.ai')).toBe(true);
    expect(isPageAllowed(settings, 'chatgpt.com')).toBe(true);
    expect(isPageAllowed(settings, 'notclaude.ai')).toBe(false);
    expect(isPageAllowed(settings, 'example.com')).toBe(false);
  });
  it('allows everything in Use Anywhere mode', () => {
    expect(isPageAllowed({ ...settings, useAnywhereMode: true }, 'example.com')).toBe(true);
  });
});

describe('parseSiteList', () => {
  it('keeps one domain per line and drops blanks, so a trailing newline is not an entry', () => {
    expect(parseSiteList('claude.ai\n  chatgpt.com \n\n')).toEqual(['claude.ai', 'chatgpt.com']);
    expect(parseSiteList('')).toEqual([]);
  });
});
