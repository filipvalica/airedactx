// src/ui/components/RuleList.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RedactionRule } from '../../types';

interface DraggableTableRowProps {
  rule: RedactionRule;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const DraggableTableRow: React.FC<DraggableTableRowProps> = ({ rule, onDelete, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} className={!rule.enabled ? 'disabled' : ''}>
      <td>
        <span className="drag-handle" {...listeners} title={`Reorder rule: ${rule.find}`} aria-label={`Reorder rule: ${rule.find}`}>::</span>
      </td>
      <td>
        <label className="toggle-switch" title={rule.enabled ? 'Disable rule' : 'Enable rule'}>
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={() => onToggle(rule.id)}
            role="switch"
            aria-checked={rule.enabled}
            aria-label={`Rule for '${rule.find}'`}
          />
          <span className="slider"></span>
        </label>
      </td>
      <td className="type-cell">{rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}</td>
      <td className="find-text">"{rule.find}"</td>
      <td className="replace-text">"{rule.replace}"</td>
      <td>
        <button onClick={() => onDelete(rule.id)} className="delete-btn" title="Delete" aria-label={`Delete rule: ${rule.find}`}>
        ❌
        </button>
      </td>
    </tr>
  );
};

interface RuleListProps {
  rules: RedactionRule[];
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export const RuleList: React.FC<RuleListProps> = ({ rules, onDelete, onToggle }) => {
  if (rules.length === 0) {
    return null; // The parent component will handle the "no rules" message
  }

  return (
    <table className="rule-table">
      <thead>
        <tr>
          <th className="col-drag" aria-label="Reorder"></th>
          <th className="col-status">Status</th>
          <th className="col-type">Type</th>
          <th className="col-find">Match Pattern</th>
          <th className="col-replace">Replacement Text</th>
          <th className="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => (
          <DraggableTableRow key={rule.id} rule={rule} onDelete={onDelete} onToggle={onToggle} />
        ))}
      </tbody>
    </table>
  );
};