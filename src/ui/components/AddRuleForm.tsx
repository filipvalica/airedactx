// src/ui/components/AddRuleForm.tsx
import React, { useState, useEffect } from 'react';
import { RedactionRule } from '../../types';

interface AddRuleFormProps {
  onAddRule: (rule: Omit<RedactionRule, 'id' | 'enabled'>) => void;
}

export const AddRuleForm: React.FC<AddRuleFormProps> = ({ onAddRule }) => {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [type, setType] = useState<'literal' | 'regex'>('literal');
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

  return (
    <form onSubmit={handleSubmit} className="add-rule-form">
      <div className="form-group" style={{ flexBasis: '120px', flexGrow: 0 }}>
        <label htmlFor="rule-type">Type</label>
        <select id="rule-type" value={type} onChange={(e) => setType(e.target.value as 'literal' | 'regex')}>
          <option value="literal">Literal</option>
          <option value="regex">Regex</option>
        </select>
      </div>
      <div className="form-group" style={{ flexBasis: '30%' }}>
        <label htmlFor="rule-find" className="find-label">
          Match Pattern
          {type === 'regex' && (
            <span 
              className="help-tooltip" 
              title="Use standard JavaScript regular expression syntax. For example, to match a US phone number, you could use: \b\d{3}-\d{3}-\d{4}\b"
            >?</span>
          )}
        </label>
        <input
          id="rule-find"
          type="text"
          placeholder={type === 'literal' ? "John Doe" : "\\b\\d{3}-\\d{2}-\\d{4}\\b"}
          value={find}
          onChange={(e) => setFind(e.target.value)}
          required
          className={regexError ? 'input-error' : ''}
        />
        {regexError && <p className="error-message">{regexError}</p>}
      </div>
      <div className="form-group" style={{ flexBasis: '30%' }}>
        <label htmlFor="rule-replace">Replacement Text</label>
        <input
          id="rule-replace"
          type="text"
          placeholder="REDACTED_NAME"
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
        />
      </div>
      <button type="submit" className="action-btn add-btn" disabled={!!regexError} aria-disabled={!!regexError} title="Add rule">
      ➕
      </button>
    </form>
  );
};