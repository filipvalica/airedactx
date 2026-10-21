// src/core/engine.ts
// Pure text transform: no DOM, no storage, no network. Easy to unit test.
//
// Order of operations:
//   1. Enabled literal rules, top to bottom. Every occurrence becomes "[[Label]]".
//   2. Enabled regex rules, top to bottom, on the text that step 1 produced.
//      Each distinct matched string gets a numbered placeholder, "[[Label-1]]", and the same
//      string maps to the same number wherever it recurs in the text.
// Replacement is sequential: a later rule sees the output of earlier rules. Placeholders use
// delimiters and a hyphen, which the bundled rules avoid matching, but a user regex could.

import { RedactionRule, AppSettings, RuleType, RuleValidator } from '../types';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** JavaScript has no inline flag syntax, so this prefix is lifted onto the rule instead. */
export const CASE_INSENSITIVE_PREFIX = '(?i)';

/**
 * Normalize a pattern typed or imported by the user: trims it and, for regex rules, splits a
 * leading "(?i)" off onto the caseInsensitive flag. Every path that creates or edits a rule
 * (TSV import, Add Rule, inline edit) goes through here so they agree.
 */
export const normalizePattern = (
  type: RuleType,
  rawFind: string,
  caseInsensitive = false,
): { find: string; caseInsensitive: boolean } => {
  const find = rawFind.trim();
  if (type === 'regex' && find.startsWith(CASE_INSENSITIVE_PREFIX)) {
    return { find: find.slice(CASE_INSENSITIVE_PREFIX.length), caseInsensitive: true };
  }
  return { find, caseInsensitive: type === 'regex' && caseInsensitive };
};

/** Why a pattern cannot be used as a rule, or null when it is fine. */
export const patternError = (type: RuleType, find: string, caseInsensitive = false): string | null => {
  if (!find) return type === 'divider' ? 'The divider needs a title.' : 'The match pattern is empty.';
  if (type !== 'regex') return null;
  try {
    new RegExp(find, caseInsensitive ? 'gi' : 'g');
    return null;
  } catch (error) {
    return `Invalid regex: ${(error as Error).message}`;
  }
};

/**
 * Luhn checksum, as used by payment card numbers. Separators are ignored, so the card rule's
 * "4111 1111 1111 1111" and "4111-1111-1111-1111" both pass.
 */
export const isLuhnValid = (text: string): boolean => {
  const digits = text.replace(/\D/g, '');
  if (digits.length < 2) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    sum += digit;
  }
  return sum % 10 === 0;
};

/** Each validator takes the matched text and says whether it is a real instance worth redacting. */
export const VALIDATORS: Record<RuleValidator, (match: string) => boolean> = {
  luhn: isLuhnValid,
};

/** Build the RegExp for a rule, or null if the pattern does not compile. */
export const compileRule = (rule: RedactionRule): RegExp | null => {
  try {
    if (rule.type === 'literal') return new RegExp(escapeRegExp(rule.find), 'g');
    if (rule.type === 'regex') return new RegExp(rule.find, rule.caseInsensitive ? 'gi' : 'g');
    return null;
  } catch {
    return null;
  }
};

export const performRedaction = (text: string, rules: RedactionRule[], settings: AppSettings): string => {
  const open = settings.delimiterStyle.slice(0, 2);
  const close = settings.delimiterStyle.slice(-2);
  const enabled = rules.filter((rule) => rule.enabled);

  let result = text;

  for (const rule of enabled.filter((rule) => rule.type === 'literal')) {
    const pattern = compileRule(rule);
    if (!pattern) continue;
    const placeholder = `${open}${rule.replace}${close}`;
    // Function replacer so "$" in the label is never read as a substitution pattern.
    result = result.replace(pattern, () => placeholder);
  }

  const placeholderByMatch = new Map<string, string>();
  const nextNumberByLabel = new Map<string, number>();

  for (const rule of enabled.filter((rule) => rule.type === 'regex')) {
    const pattern = compileRule(rule);
    if (!pattern) {
      console.warn(`AIRedactX: skipping rule with invalid regex "${rule.find}"`);
      continue;
    }
    const isValid = rule.validate ? VALIDATORS[rule.validate] : undefined;
    result = result.replace(pattern, (match) => {
      if (isValid && !isValid(match)) return match;
      const known = placeholderByMatch.get(match);
      if (known) return known;
      const number = (nextNumberByLabel.get(rule.replace) ?? 0) + 1;
      nextNumberByLabel.set(rule.replace, number);
      const placeholder = `${open}${rule.replace}-${number}${close}`;
      placeholderByMatch.set(match, placeholder);
      return placeholder;
    });
  }

  return result;
};
