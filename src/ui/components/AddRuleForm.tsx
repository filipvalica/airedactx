// src/ui/components/AddRuleForm.tsx
import React, { useState } from 'react';
import { RedactionRule, RuleType } from '../../types';
import { normalizePattern, patternError } from '../../core/engine';
import { PlusIcon } from './Icons';

/** What the form produces: everything the caller needs to build a rule except id and enabled. */
export type NewRule = Pick<RedactionRule, 'type' | 'find' | 'replace' | 'caseInsensitive'>;

interface AddRuleFormProps {
  /** Returns an error message to show (for example a duplicate pattern), or null on success. */
  onAddRule: (rule: NewRule) => string | null;
}

export const AddRuleForm: React.FC<AddRuleFormProps> = ({ onAddRule }) => {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [type, setType] = useState<RuleType>('literal');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalized = normalizePattern(type, find, ignoreCase);
  const liveError = find.trim() ? patternError(type, normalized.find, normalized.caseInsensitive) : null;
  const isDivider = type === 'divider';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!find.trim() || liveError) return;
    const error = onAddRule({
      type,
      find: normalized.find,
      replace: replace.trim(),
      ...(normalized.caseInsensitive ? { caseInsensitive: true } : {}),
    });
    setSubmitError(error);
    if (error) return;
    setFind('');
    setReplace('');
    setIgnoreCase(false);
  };

  return (
    <form onSubmit={handleSubmit} className="add-rule-form">
      <div className="form-group form-group-type">
        <label htmlFor="rule-type">Type</label>
        <select id="rule-type" value={type} onChange={(e) => setType(e.target.value as RuleType)}>
          <option value="literal">Literal</option>
          <option value="regex">Regex</option>
          <option value="divider">Divider</option>
        </select>
      </div>
      <div className="form-group form-group-wide">
        <label htmlFor="rule-find">{isDivider ? 'Divider Title' : 'Match Pattern'}</label>
        <input
          id="rule-find"
          type="text"
          placeholder={isDivider ? 'e.g. Personal' : type === 'regex' ? '\\b\\d{3}-\\d{4}\\b' : 'John Doe'}
          value={find}
          onChange={(e) => {
            setFind(e.target.value);
            setSubmitError(null);
          }}
          required
          aria-invalid={!!liveError}
          aria-describedby="rule-find-help"
          className={liveError ? 'input-error' : ''}
        />
        {type === 'regex' && (
          <div id="rule-find-help" className="field-help">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={normalized.caseInsensitive}
                onChange={(e) => setIgnoreCase(e.target.checked)}
              />
              Ignore case
            </label>
            <span>
              JavaScript syntax (
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions"
                target="_blank"
                rel="noopener noreferrer"
              >
                reference
              </a>
              ). Test at{' '}
              <a href="https://regex101.com/?flavor=javascript" target="_blank" rel="noopener noreferrer">
                regex101.com
              </a>
              .
            </span>
          </div>
        )}
        {(liveError || submitError) && (
          <p className="field-error" role="alert">
            {liveError ?? submitError}
          </p>
        )}
      </div>
      <div className="form-group form-group-wide">
        <label htmlFor="rule-replace">{isDivider ? 'Replacement' : 'Placeholder Label'}</label>
        <input
          id="rule-replace"
          type="text"
          placeholder={isDivider ? '(not used)' : 'Email'}
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          disabled={isDivider}
        />
      </div>
      <button
        type="submit"
        className="action-btn add-btn"
        disabled={!!liveError || !find.trim()}
        title="Add rule"
        aria-label="Add rule"
      >
        <PlusIcon size={22} />
      </button>
    </form>
  );
};
