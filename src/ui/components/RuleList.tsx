// src/ui/components/RuleList.tsx
import React from 'react';
import { RedactionRule } from '../../types';

interface RuleListProps {
  rules: RedactionRule[];
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  // Add a new prop for reordering
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

export const RuleList: React.FC<RuleListProps> = ({ rules, onDelete, onToggle, onReorder }) => {
  if (rules.length === 0) {
    return <p className="no-rules-message">No rules of this type have been added.</p>;
  }

  return (
    <ul className="rule-list">
      {rules.map((rule, index) => (
        <li key={rule.id} className={!rule.enabled ? 'disabled' : ''}>
          <div className="rule-content">
            <span className="find-text">"{rule.find}"</span>
            <span className="arrow">&rarr;</span>
            <span className="replace-text">"{rule.replace}"</span>
          </div>
          <div className="rule-actions">
            {/* Add the reorder buttons */}
            <button
              className="reorder-btn"
              onClick={() => onReorder(rule.id, 'up')}
              disabled={index === 0} // Disable 'up' for the first item
              title="Move up"
            >
              &uarr;
            </button>
            <button
              className="reorder-btn"
              onClick={() => onReorder(rule.id, 'down')}
              disabled={index === rules.length - 1} // Disable 'down' for the last item
              title="Move down"
            >
              &darr;
            </button>
            <button onClick={() => onToggle(rule.id)}>
              {rule.enabled ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => onDelete(rule.id)} className="delete-btn">
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};