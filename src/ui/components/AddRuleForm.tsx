// src/ui/components/AddRuleForm.tsx
import React, { useState } from 'react';
import { RedactionRule } from '../../types';

interface AddRuleFormProps {
  onAddRule: (rule: Omit<RedactionRule, 'id' | 'enabled'>) => void;
}

export const AddRuleForm: React.FC<AddRuleFormProps> = ({ onAddRule }) => {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [type, setType] = useState<'literal' | 'regex'>('literal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (find.trim()) {
      onAddRule({ find, replace, type });
      // Reset form for the next entry
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
        <label htmlFor="rule-find">Match Pattern</label>
        <input
          id="rule-find"
          type="text"
          placeholder="John Doe"
          value={find}
          onChange={(e) => setFind(e.target.value)}
          required
        />
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
      <button type="submit" className="add-btn">
      ➕
      </button>
    </form>
  );
};