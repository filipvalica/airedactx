// src/core/ruleset.ts
// Pure operations on a list of rules: ids, merging an imported set, applying an import.
// No React and no storage here, so the options page logic can be unit tested on its own.

import { RedactionRule } from '../types';

/** A fresh id for a new rule. UUIDs cannot collide the way a millisecond timestamp can. */
export const newRuleId = (): string => crypto.randomUUID();

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  rules: RedactionRule[];
  /** Rules that were appended. */
  added: number;
  /** Existing rules whose find pattern matched an imported rule and were updated in place. */
  updated: number;
}

/**
 * Merge imported rules into the current list. A non-divider rule with the same find pattern
 * updates the existing rule in place (keeping its id and position); everything else appends,
 * in file order. Dividers are never merged, they are always appended.
 */
export const mergeRules = (current: RedactionRule[], imported: RedactionRule[]): ImportResult => {
  const idByFind = new Map(current.filter((r) => r.type !== 'divider').map((r) => [r.find, r.id]));
  const updates = new Map<string, RedactionRule>();
  const additions: RedactionRule[] = [];

  for (const rule of imported) {
    const existingId = rule.type !== 'divider' ? idByFind.get(rule.find) : undefined;
    if (existingId) updates.set(existingId, { ...rule, id: existingId });
    else additions.push(rule);
  }

  const rules = [...current.map((rule) => updates.get(rule.id) ?? rule), ...additions];
  return { rules, added: additions.length, updated: updates.size };
};

/** The two things an import can do: merge into the current list, or replace it outright. */
export const applyImport = (current: RedactionRule[], imported: RedactionRule[], mode: ImportMode): ImportResult =>
  mode === 'replace' ? { rules: imported, added: imported.length, updated: 0 } : mergeRules(current, imported);
