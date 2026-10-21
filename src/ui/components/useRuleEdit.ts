// src/ui/components/useRuleEdit.ts
// Inline editing for one table row. The draft is created when editing starts, from the rule as
// it is at that moment, so no effect is needed to keep it in sync with the rule prop.
import { useState } from 'react';
import { RedactionRule } from '../../types';

/** Fields a user can change on an existing rule. */
export type RuleEdit = Pick<RedactionRule, 'find' | 'replace' | 'caseInsensitive'>;

/** Returns an error message when the edit is rejected, or null when it was saved. */
export type UpdateRule = (id: string, edit: RuleEdit) => string | null;

const snapshot = (rule: RedactionRule): RuleEdit => ({
  find: rule.find,
  replace: rule.replace,
  caseInsensitive: rule.caseInsensitive,
});

export const useRuleEdit = (rule: RedactionRule, onUpdate: UpdateRule) => {
  const [draft, setDraft] = useState<RuleEdit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    setError(null);
    setDraft(snapshot(rule));
  };

  const cancel = () => {
    setDraft(null);
    setError(null);
  };

  const save = () => {
    if (!draft) return;
    const problem = onUpdate(rule.id, draft);
    setError(problem);
    if (!problem) setDraft(null);
  };

  const change = (patch: Partial<RuleEdit>) => setDraft((current) => (current ? { ...current, ...patch } : current));

  /** Enter saves, Escape cancels, from any input in the row. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  return { isEditing: draft !== null, draft, error, start, cancel, save, change, onKeyDown };
};
