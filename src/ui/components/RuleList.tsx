// src/ui/components/RuleList.tsx
import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RedactionRule } from '../../types';

interface DraggableTableRowProps {
  rule: RedactionRule;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, find: string, replace: string) => void;
}

const DraggableTableRow: React.FC<DraggableTableRowProps> = ({ rule, onDelete, onToggle, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editedFind, setEditedFind] = useState(rule.find);
  const [editedReplace, setEditedReplace] = useState(rule.replace);

  // Reset local state if the parent rule changes
  useEffect(() => {
    setEditedFind(rule.find);
    setEditedReplace(rule.replace);
  }, [rule]);

  const handleSave = () => {
    onUpdate(rule.id, editedFind, editedReplace);
    setIsEditing(false);
  };

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
      
      {/* Editable Find Cell */}
      <td className="find-text">
        {isEditing ? (
          <input 
            type="text" 
            value={editedFind}
            onChange={(e) => setEditedFind(e.target.value)}
            className="table-input"
          />
        ) : (
          `"${rule.find}"`
        )}
      </td>

      {/* Editable Replace Cell */}
      <td className="replace-text">
        {isEditing ? (
          <input 
            type="text" 
            value={editedReplace}
            onChange={(e) => setEditedReplace(e.target.value)}
            className="table-input"
          />
        ) : (
          `"${rule.replace}"`
        )}
      </td>
      
      <td className="actions-cell">
        {isEditing ? (
          <button onClick={handleSave} className="action-btn" title="Save" aria-label={`Save rule: ${rule.find}`}>
            💾
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="action-btn" title="Edit" aria-label={`Edit rule: ${rule.find}`}>
            ✏️
          </button>
        )}
        <button onClick={() => onDelete(rule.id)} className="action-btn delete-btn" title="Delete" aria-label={`Delete rule: ${rule.find}`} disabled={isEditing}>
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
  onUpdate: (id: string, find: string, replace: string) => void;
}

export const RuleList: React.FC<RuleListProps> = ({ rules, onDelete, onToggle, onUpdate }) => {
  if (rules.length === 0) {
    return null;
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
          <DraggableTableRow key={rule.id} rule={rule} onDelete={onDelete} onToggle={onToggle} onUpdate={onUpdate} />
        ))}
      </tbody>
    </table>
  );
};