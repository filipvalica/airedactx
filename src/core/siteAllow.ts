// src/core/siteAllow.ts
import { AppSettings } from '../types';

/** One domain per line, as typed into the Allowed Websites box. Blank lines are dropped. */
export const parseSiteList = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

/** The on-page button is limited to the allowed list unless "Use Anywhere" is on. */
export const isPageAllowed = (settings: AppSettings, hostname: string): boolean => {
  if (settings.useAnywhereMode) return true;
  const host = hostname.toLowerCase();
  return settings.allowedSites.some((entry) => {
    const domain = entry
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    return domain !== '' && (host === domain || host.endsWith('.' + domain));
  });
};
