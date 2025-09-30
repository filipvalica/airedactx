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
    if (find.trim() && replace.trim()) {
      onAddRule({ find, replace, type });
      // Reset form
      setFind('');
      setReplace('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-rule-form">
      <h3>Add New Rule</h3>
      <div className="form-row">
        <select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="literal">Literal</option>
          <option value="regex">Regex</option>
        </select>
        <input
          type="text"
          placeholder="Find..."
          value={find}
          onChange={(e) => setFind(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Replace with..."
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          required
        />
        <button type="submit">Add</button>
      </div>
    </form>
  );
};