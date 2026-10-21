// src/core/tsv.ts
// The one parser and serializer for the rules TSV format. Used by the bundled default
// ruleset, the options page import, and the options page export, so all three agree.
//
// Format: UTF-8 (BOM optional), tab separated, header "type find replace Active Note Validate".
// The Validate column is optional (older five-column files still import). Lines that are blank
// or start with "#" are skipped. A leading "(?i)" on a regex pattern means case-insensitive;
// JavaScript has no inline flag syntax so it is lifted onto the rule.

import { RedactionRule, RuleType, RuleValidator, RULE_TYPES, RULE_VALIDATORS } from '../types';
import { CASE_INSENSITIVE_PREFIX, normalizePattern, patternError } from './engine';
import { newRuleId } from './ruleset';

export const TSV_HEADER = ['type', 'find', 'replace', 'Active', 'Note', 'Validate'];
const MAX_NOTE_LENGTH = 255;

/** Strip one pair of surrounding double quotes, as spreadsheet exports add them. */
const unquote = (field = ''): string => field.trim().replace(/^"(.*)"$/s, '$1');

const isRuleType = (value: string): value is RuleType => (RULE_TYPES as readonly string[]).includes(value);
const isValidator = (value: string): value is RuleValidator => (RULE_VALIDATORS as readonly string[]).includes(value);

/** The Validate column: empty means none, anything else must name a known validator. */
const parseValidator = (raw: string | undefined, rowNumber: number): RuleValidator | undefined => {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return undefined;
  if (isValidator(value)) return value;
  throw new Error(`Row ${rowNumber}: Validate must be empty or one of ${RULE_VALIDATORS.join(', ')} (got "${raw}").`);
};

/**
 * Parse TSV text into rules. Throws an Error with a row number on the first invalid row,
 * so the caller can show it and abort the import (nothing is partially applied).
 */
export function parseRulesTsv(tsvText: string): RedactionRule[] {
  const lines = tsvText.replace(/^\uFEFF/, '').split(/\r?\n/);
  const first = lines[0]?.split('\t').map((h) => h.trim().toLowerCase()) ?? [];
  const expected = TSV_HEADER.map((h) => h.toLowerCase());
  const hasHeader =
    first.length >= 3 && first[0] === expected[0] && first[1] === expected[1] && first[2] === expected[2];
  if (!hasHeader) {
    throw new Error(`Missing header row. Expected: ${TSV_HEADER.join(' <tab> ')}`);
  }

  const rules: RedactionRule[] = [];

  lines.slice(1).forEach((line, offset) => {
    const rowNumber = offset + 2; // 1-based, header is row 1
    if (!line.trim() || line.startsWith('#')) return;

    const [rawType, rawFind, rawReplace, rawActive, rawNote, rawValidate] = line.split('\t');
    const type = (rawType ?? '').trim().toLowerCase();
    if (!isRuleType(type)) {
      throw new Error(`Row ${rowNumber}: type must be one of ${RULE_TYPES.join(', ')} (got "${rawType ?? ''}").`);
    }

    const note = rawNote?.trim().slice(0, MAX_NOTE_LENGTH) || undefined;
    const enabled = rawActive ? rawActive.trim().toUpperCase() !== 'N' : true;

    if (type === 'divider') {
      // A divider's title lives in the Note column so the find/replace columns stay empty.
      rules.push({
        id: newRuleId(),
        type,
        find: note || unquote(rawFind) || `Section ${rowNumber}`,
        replace: '',
        enabled: true,
      });
      return;
    }

    const { find, caseInsensitive } = normalizePattern(type, unquote(rawFind));
    const problem = patternError(type, find, caseInsensitive);
    if (problem) throw new Error(`Row ${rowNumber}: ${problem}`);

    const validate = parseValidator(rawValidate, rowNumber);

    rules.push({
      id: newRuleId(),
      type,
      find,
      replace: unquote(rawReplace),
      enabled,
      ...(caseInsensitive ? { caseInsensitive } : {}),
      ...(validate ? { validate } : {}),
      ...(note ? { note } : {}),
    });
  });

  return rules;
}

/** Serialize rules to TSV text (with BOM so Excel opens it as UTF-8). Round-trips parseRulesTsv. */
export function serializeRulesTsv(rules: RedactionRule[]): string {
  const clean = (field = '') => field.replace(/[\t\r\n]/g, ' ');
  const rows = rules.map((rule) => {
    if (rule.type === 'divider') {
      return ['divider', '', '', 'Y', clean(rule.find), ''].join('\t');
    }
    const find = rule.type === 'regex' && rule.caseInsensitive ? CASE_INSENSITIVE_PREFIX + rule.find : rule.find;
    return [
      rule.type,
      clean(find),
      clean(rule.replace),
      rule.enabled ? 'Y' : 'N',
      clean(rule.note),
      rule.validate ?? '',
    ].join('\t');
  });
  return '\uFEFF' + [TSV_HEADER.join('\t'), ...rows].join('\n') + '\n';
}
