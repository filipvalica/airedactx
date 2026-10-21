// src/core/engine.test.ts
// Pins the engine's behaviour and keeps the bundled ruleset honest: every default rule must
// compile, and the overmatches found on 2025-10-15 (SWIFT eating uppercase words, Phone
// splitting a GitHub token, four rules dead because of "(?i)") must not come back.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { performRedaction, compileRule, normalizePattern, patternError } from './engine';
import { parseRulesTsv, serializeRulesTsv } from './tsv';
import { AppSettings, RedactionRule } from '../types';

const settings: AppSettings = {
  useAnywhereMode: false,
  buttonPosition: 'bottom-right',
  delimiterStyle: '[[..]]',
  highlightStyle: 'amber',
  allowedSites: [],
};
const defaults = parseRulesTsv(readFileSync(resolve(__dirname, '../../airedactx_rules.tsv'), 'utf8'));
const rule = (partial: Partial<RedactionRule> & Pick<RedactionRule, 'type' | 'find' | 'replace'>): RedactionRule => ({
  id: partial.find,
  enabled: true,
  ...partial,
});

describe('bundled ruleset', () => {
  it('every rule compiles', () => {
    const broken = defaults.filter((r) => r.type !== 'divider' && compileRule(r) === null).map((r) => r.replace);
    expect(broken).toEqual([]);
  });

  it('lifts (?i) onto the rule instead of leaving it in the pattern', () => {
    const sshRule = defaults.find((r) => r.replace === 'SSH Public Key')!;
    expect(sshRule.caseInsensitive).toBe(true);
    expect(sshRule.find.startsWith('(?i)')).toBe(false);
  });

  it('redacts the common identifiers', () => {
    const input =
      'Mail nemo@nautilus.example, call (713) 555-0142, SSN 123-45-6789, card 4111 1111 1111 1111, host 192.168.1.10';
    expect(performRedaction(input, defaults, settings)).toBe(
      'Mail [[Email-1]], call [[Phone-1]], SSN [[SSN-1]], card [[Credit Card-1]], host [[IPv4-1]]',
    );
  });

  it('leaves ordinary uppercase prose alone', () => {
    const input = 'IMPORTANT: PLEASE REVIEW THE ATTACHED DOCUMENT CAREFULLY.';
    expect(performRedaction(input, defaults, settings)).toBe(input);
  });

  it('redacts a whole token rather than the digits inside it', () => {
    const input = 'token ghp_abcdefghijklmnopqrstuvwxyz0123456789 and key AKIAIOSFODNN7EXAMPLE';
    expect(performRedaction(input, defaults, settings)).toBe('token [[GitHub Token-1]] and key [[AWS Access Key-1]]');
  });

  it('leaves a 16 digit number that fails the Luhn check alone', () => {
    expect(performRedaction('order 1234 5678 9012 3456, card 4111-1111-1111-1111', defaults, settings)).toBe(
      'order 1234 5678 9012 3456, card [[Credit Card-1]]',
    );
  });

  it('produces exactly what TESTING_GUIDE.md step 2 says it does', () => {
    // Keep this in step with the guide: the tester compares the field against the Pass block.
    const input = [
      "Hi, I'm Captain Nemo from Nautilus. Email nemo@nautilus.example or call (713) 555-0142.",
      'SSN 123-45-6789, card 4111 1111 1111 1111, order 1234 5678 9012 3456, token ghp_abcdefghijklmnopqrstuvwxyz0123456789.',
      'IMPORTANT: PLEASE REVIEW THE ATTACHED DOCUMENT.',
    ].join('\n');
    expect(performRedaction(input, defaults, settings)).toBe(
      [
        "Hi, I'm [[Name]] from [[Company]]. Email [[Email-1]] or call [[Phone-1]].",
        'SSN [[SSN-1]], card [[Credit Card-1]], order 1234 5678 9012 3456, token [[GitHub Token-1]].',
        'IMPORTANT: PLEASE REVIEW THE ATTACHED DOCUMENT.',
      ].join('\n'),
    );
  });

  it('redacts the sample every field on airedactx_test.html holds', () => {
    const input =
      'Captain Nemo has SSN 123-45-6789 and can be reached at nemo@nautilus.example or call 555-867-5309. His credit card is 4532-0151-1283-0366 and IP address is 192.168.1.100. AWS key: AKIAIOSFODNN7EXAMPLE';
    expect(performRedaction(input, defaults, settings)).toBe(
      '[[Name]] has SSN [[SSN-1]] and can be reached at [[Email-1]] or call [[Phone-1]]. His credit card is [[Credit Card-1]] and IP address is [[IPv4-1]]. AWS key: [[AWS Access Key-1]]',
    );
  });

  it('matches secret assignments regardless of case', () => {
    expect(performRedaction('API_KEY=abcdefghijklmnop1234', defaults, settings)).toBe('[[API Key-1]]');
  });
});

describe('performRedaction', () => {
  it('runs literal rules before regex rules and numbers repeated regex matches consistently', () => {
    const rules = [
      rule({ type: 'regex', find: '\\d{3}-\\d{4}', replace: 'Phone' }),
      rule({ type: 'literal', find: 'Nemo', replace: 'Name' }),
    ];
    expect(performRedaction('Nemo: 555-0142, again 555-0142, then 555-9999. Nemo.', rules, settings)).toBe(
      '[[Name]]: [[Phone-1]], again [[Phone-1]], then [[Phone-2]]. [[Name]].',
    );
  });

  it('uses the chosen delimiter style', () => {
    const rules = [rule({ type: 'literal', find: 'Nemo', replace: 'Name' })];
    expect(performRedaction('Nemo', rules, { ...settings, delimiterStyle: '<<..>>' })).toBe('<<Name>>');
  });

  it('treats "$" in a replacement label literally', () => {
    const rules = [rule({ type: 'literal', find: 'cost', replace: '$&$1' })];
    expect(performRedaction('the cost', rules, settings)).toBe('the [[$&$1]]');
  });

  it('skips disabled rules and rules whose regex does not compile', () => {
    const rules = [
      rule({ type: 'regex', find: '(unclosed', replace: 'Bad' }),
      rule({ type: 'literal', find: 'Nemo', replace: 'Name', enabled: false }),
    ];
    expect(performRedaction('Nemo (unclosed', rules, settings)).toBe('Nemo (unclosed');
  });
});

describe('TSV round trip', () => {
  it('serializes and parses back to the same rules (ids aside)', () => {
    const strip = (rules: RedactionRule[]) => rules.map(({ id: _id, ...rest }) => rest);
    expect(strip(parseRulesTsv(serializeRulesTsv(defaults)))).toEqual(strip(defaults));
  });

  it('rejects a file without the header', () => {
    expect(() => parseRulesTsv('literal\tNemo\tName\tY\t')).toThrow(/header/i);
  });

  it('rejects an unknown type and an invalid regex with the row number', () => {
    expect(() => parseRulesTsv('type\tfind\treplace\tActive\tNote\nmagic\tx\ty\tY\t')).toThrow(/Row 2/);
    expect(() => parseRulesTsv('type\tfind\treplace\tActive\tNote\nregex\t(oops\ty\tY\t')).toThrow(
      /Row 2.*invalid regex/i,
    );
  });

  it('reads the optional Validate column and rejects an unknown validator', () => {
    const [withLuhn] = parseRulesTsv('type\tfind\treplace\tActive\tNote\tValidate\nregex\t\\d+\tCard\tY\t\tLuhn');
    expect(withLuhn.validate).toBe('luhn');
    expect(parseRulesTsv('type\tfind\treplace\tActive\tNote\nregex\t\\d+\tCard\tY\t')[0].validate).toBeUndefined();
    expect(() => parseRulesTsv('type\tfind\treplace\tActive\tNote\tValidate\nregex\t\\d+\tCard\tY\t\tmod97')).toThrow(
      /Row 2.*Validate/,
    );
  });

  it('strips spreadsheet quoting and reads dividers from the Note column', () => {
    const rules = parseRulesTsv(
      'type\tfind\treplace\tActive\tNote\ndivider\t\t\tY\tPersonal\nliteral\t"20,000 Leagues"\tAddress\tN\t',
    );
    expect(rules[0]).toMatchObject({ type: 'divider', find: 'Personal', enabled: true });
    expect(rules[1]).toMatchObject({ type: 'literal', find: '20,000 Leagues', replace: 'Address', enabled: false });
  });
});

describe('pattern helpers shared by import, Add Rule and edit', () => {
  it('lifts a typed "(?i)" onto the flag and leaves literals alone', () => {
    expect(normalizePattern('regex', ' (?i)api[_-]?key ')).toEqual({ find: 'api[_-]?key', caseInsensitive: true });
    expect(normalizePattern('regex', 'x', true)).toEqual({ find: 'x', caseInsensitive: true });
    expect(normalizePattern('literal', '(?i)Nemo', true)).toEqual({ find: '(?i)Nemo', caseInsensitive: false });
  });

  it('reports why a pattern is unusable, and null when it is fine', () => {
    expect(patternError('regex', '(unclosed')).toMatch(/invalid regex/i);
    expect(patternError('regex', '')).toMatch(/empty/i);
    expect(patternError('divider', '')).toMatch(/title/i);
    expect(patternError('regex', '\\d+', true)).toBeNull();
    expect(patternError('literal', '(unclosed')).toBeNull();
  });
});
