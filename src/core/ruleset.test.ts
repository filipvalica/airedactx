import { describe, it, expect } from 'vitest';
import { applyImport, mergeRules, newRuleId } from './ruleset';
import { RedactionRule } from '../types';

const rule = (id: string, partial: Partial<RedactionRule> = {}): RedactionRule => ({
  id,
  type: 'literal',
  find: id,
  replace: id.toUpperCase(),
  enabled: true,
  ...partial,
});

const current = [
  rule('div-a', { type: 'divider', find: 'Personal' }),
  rule('nemo'),
  rule('nautilus', { enabled: false }),
];

describe('mergeRules', () => {
  it('updates a rule with the same find pattern in place, keeping its id and position', () => {
    const { rules, added, updated } = mergeRules(current, [
      rule('x', { find: 'nemo', replace: 'Captain', enabled: false }),
    ]);
    expect(rules.map((r) => r.id)).toEqual(['div-a', 'nemo', 'nautilus']);
    expect(rules[1]).toMatchObject({ id: 'nemo', replace: 'Captain', enabled: false });
    expect({ added, updated }).toEqual({ added: 0, updated: 1 });
  });

  it('appends new rules in file order and never merges dividers', () => {
    const { rules, added, updated } = mergeRules(current, [
      rule('div-b', { type: 'divider', find: 'Personal' }),
      rule('ned'),
      rule('aronnax'),
    ]);
    expect(rules.map((r) => r.id)).toEqual(['div-a', 'nemo', 'nautilus', 'div-b', 'ned', 'aronnax']);
    expect({ added, updated }).toEqual({ added: 3, updated: 0 });
  });

  it('does not mutate its inputs', () => {
    const before = JSON.stringify(current);
    mergeRules(current, [rule('nemo', { replace: 'changed' })]);
    expect(JSON.stringify(current)).toBe(before);
  });
});

describe('applyImport', () => {
  it('replace discards everything that was there', () => {
    const imported = [rule('fresh')];
    expect(applyImport(current, imported, 'replace')).toEqual({ rules: imported, added: 1, updated: 0 });
  });

  it('merge delegates to mergeRules', () => {
    expect(applyImport(current, [rule('fresh')], 'merge').rules.map((r) => r.id)).toEqual([
      'div-a',
      'nemo',
      'nautilus',
      'fresh',
    ]);
  });
});

describe('newRuleId', () => {
  it('returns distinct ids on every call', () => {
    const ids = new Set(Array.from({ length: 50 }, newRuleId));
    expect(ids.size).toBe(50);
  });
});
