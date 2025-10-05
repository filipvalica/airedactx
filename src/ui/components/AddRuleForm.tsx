// src/ui/components/AddRuleForm.tsx
import React, { useState, useEffect } from 'react';
import { RedactionRule } from '../../types';

interface AddRuleFormProps {
  onAddRule: (rule: Omit<RedactionRule, 'id' | 'enabled'>) => void;
}

export const AddRuleForm: React.FC<AddRuleFormProps> = ({ onAddRule }) => {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [type, setType] = useState<'literal' | 'regex' | 'divider'>('literal');
  const [regexError, setRegexError] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'regex' && find.trim() !== '') {
      try {
        new RegExp(find);
        setRegexError(null);
      } catch (e) {
        setRegexError('Invalid Regex pattern');
      }
    } else {
      setRegexError(null);
    }
  }, [find, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (find.trim() && !regexError) {
      onAddRule({ find, replace, type });
      setFind('');
      setReplace('');
    }
  };

  const isDivider = type === 'divider';

  return (
    <form onSubmit={handleSubmit} className="add-rule-form">
      <div className="form-group" style={{ flexBasis: '150px', flexGrow: 0 }}>
        <label htmlFor="rule-type">Type</label>
        <select id="rule-type" value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="literal">Literal</option>
          <option value="regex">Regex</option>
          <option value="divider">Divider</option>
        </select>
      </div>
      <div className="form-group" style={{ flexBasis: '30%' }}>
        <label htmlFor="rule-find">
          {isDivider ? 'Divider Title' : 'Match Pattern'}
        </label>
        <input
          id="rule-find"
          type="text"
          placeholder={isDivider ? "e.g., Personal Info" : "John Doe"}
          value={find}
          onChange={(e) => setFind(e.target.value)}
          required
          className={regexError ? 'input-error' : ''}
        />
      </div>
      <div className="form-group" style={{ flexBasis: '30%' }}>
        <label htmlFor="rule-replace">Replacement Text</label>
        <input
          id="rule-replace"
          type="text"
          placeholder={isDivider ? '(not used)' : 'REDACTED_NAME'}
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          disabled={isDivider}
        />
      </div>
      <button type="submit" className="action-btn add-btn" disabled={!!regexError || !find.trim()} title="Add rule">
      ➕
      </button>
    </form>
  );
};