// src/types.ts
// Shared data shapes. Everything persisted to browser.storage.local is one of these.

export const RULE_TYPES = ['literal', 'regex', 'divider'] as const;
export type RuleType = (typeof RULE_TYPES)[number];

/** Extra checks a regex match must pass before it is redacted (see VALIDATORS in engine.ts). */
export const RULE_VALIDATORS = ['luhn'] as const;
export type RuleValidator = (typeof RULE_VALIDATORS)[number];

export interface RedactionRule {
  id: string;
  type: RuleType;
  /** Literal text or regex source. For a divider this is the section title. */
  find: string;
  /** Placeholder label, e.g. "Email". Empty for dividers. */
  replace: string;
  enabled: boolean;
  /** Regex rules only: match without regard to case (written as a leading "(?i)" in TSV). */
  caseInsensitive?: boolean;
  /** Regex rules only: a match that fails this check is left as it was. */
  validate?: RuleValidator;
  note?: string;
}

export const HOVER_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
export type HoverAreaPosition = (typeof HOVER_POSITIONS)[number];

export const DELIMITER_STYLES = ['[[..]]', '{{..}}', '((..))', '<<..>>'] as const;
export type DelimiterStyle = (typeof DELIMITER_STYLES)[number];

/** How a field looks after redaction, until it is focused again. Styles live in injected-styles.css. */
export const HIGHLIGHT_STYLES = ['none', 'amber', 'outline'] as const;
export type HighlightStyle = (typeof HIGHLIGHT_STYLES)[number];

/**
 * Keys match the labels in the Settings tab. Older installs stored some of these under other
 * names; LEGACY_SETTING_KEYS in storageManager.ts maps them across on read.
 */
export interface AppSettings {
  /** "Use Anywhere" mode: show the on-page button on every site instead of only the allowed list. */
  useAnywhereMode: boolean;
  /** "Button Position": which corner of the field the button sits in. */
  buttonPosition: HoverAreaPosition;
  /** "Delimiter Style": the characters around a placeholder. */
  delimiterStyle: DelimiterStyle;
  /** "Highlight After Redaction". */
  highlightStyle: HighlightStyle;
  /** "Allowed Websites": hostnames (or parent domains) where the button appears when useAnywhereMode is off. */
  allowedSites: string[];
}

/** Message the background script sends to a content script after a context-menu click. */
export const REDACT_COMMAND = 'redact-from-context-menu';
