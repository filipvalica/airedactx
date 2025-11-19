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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  ruleCount: number;
}

const DraggableTableRow: React.FC<DraggableTableRowProps> = ({ rule, onDelete, onToggle, onUpdate, isCollapsed, onToggleCollapse, ruleCount }) => {
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

  useEffect(() => {
    setEditedFind(rule.find);
    setEditedReplace(rule.replace);
  }, [rule]);

  const handleSave = () => {
    onUpdate(rule.id, editedFind, editedReplace);
    setIsEditing(false);
  };

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };
  
  // Common style for the Braille grip handle
  const gripStyle: React.CSSProperties = {
      fontSize: '20px',
      lineHeight: '1',
      cursor: 'grab'
  };

  if (rule.type === 'divider') {
    return (
      <tr ref={setNodeRef} style={style} {...attributes} className="divider-row">
        <td className="drag-cell">
          <span className="drag-handle" {...listeners} title="Drag to reorder" style={gripStyle}>
            ⠿
          </span>
        </td>
        <td colSpan={4} className="divider-cell" onClick={onToggleCollapse}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span className={`divider-chevron ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editedFind}
                onChange={(e) => setEditedFind(e.target.value)}
                className="table-input"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {/* REVERTED: Removed <strong> tags here */}
                {rule.find}
                <span className="rule-count">({ruleCount} rules)</span>
              </>
            )}
          </div>
        </td>
        <td className="actions-cell">
            {isEditing ? (
              <button onClick={handleSave} className="action-btn" title="Save">💾</button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="action-btn" title="Edit">✏️</button>
            )}
           <button onClick={() => onDelete(rule.id)} className="action-btn delete-btn" title="Delete Divider" disabled={isEditing}>
             ❌
           </button>
        </td>
      </tr>
    );
  }

  return (
    <tr ref={setNodeRef} style={style} {...attributes} className={!rule.enabled ? 'disabled' : ''}>
      <td className="drag-cell">
        <span className="drag-handle" {...listeners} title="Drag to reorder" style={gripStyle}>
          ⠿
        </span>
      </td>
      <td>
        <label className="toggle-switch">
          <input type="checkbox" checked={rule.enabled} onChange={() => onToggle(rule.id)} />
          <span className="slider"></span>
        </label>
      </td>
      <td className="type-cell">
        <span className={`rule-type-tag tag-${rule.type}`}>{rule.type}</span>
      </td>
      <td className="find-text">
        {isEditing ? (
          <input type="text" value={editedFind} onChange={(e) => setEditedFind(e.target.value)} className="table-input" />
        ) : (
          `"${rule.find}"`
        )}
      </td>
      <td className="replace-text">
        {isEditing ? (
          <input type="text" value={editedReplace} onChange={(e) => setEditedReplace(e.target.value)} className="table-input" />
        ) : (
          `"${rule.replace}"`
        )}
      </td>
      <td className="actions-cell">
        {rule.note && (
            <button className="action-btn" title={rule.note} style={{ cursor: 'help' }}>
                ℹ️
            </button>
        )}
        {isEditing ? (
          <button onClick={handleSave} className="action-btn" title="Save">💾</button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="action-btn" title="Edit">✏️</button>
        )}
        <button onClick={() => onDelete(rule.id)} className="action-btn delete-btn" title="Delete" disabled={isEditing}>
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
  collapsedDividers: Set<string>;
  toggleDivider: (id: string) => void;
}

export const RuleList: React.FC<RuleListProps> = ({ rules, onDelete, onToggle, onUpdate, collapsedDividers, toggleDivider }) => {
  if (rules.length === 0) return null;

  const ruleGroups = new Map<string, RedactionRule[]>();
  let activeDividerId: string | null = null;
  rules.forEach(rule => {
      if (rule.type === 'divider') {
          activeDividerId = rule.id;
          ruleGroups.set(activeDividerId, []);
      } else if (activeDividerId) {
          ruleGroups.get(activeDividerId)?.push(rule);
      }
  });

  let currentDividerId: string | null = null;

  return (
    <table className="rule-table">
      <thead>
        <tr>
          <th className="col-drag" aria-label="Reorder"></th>
          <th className="col-status">Status</th>
          <th className="col-type">Type</th>
          <th className="col-find">Match Pattern / Title</th>
          <th className="col-replace">Replacement Text</th>
          <th className="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => {
           if (rule.type !== 'divider' && currentDividerId && collapsedDividers.has(currentDividerId)) {
               return null;
           }
           if (rule.type === 'divider') {
               currentDividerId = rule.id;
           }
           
           return (
             <DraggableTableRow 
                key={rule.id} 
                rule={rule} 
                onDelete={onDelete} 
                onToggle={onToggle} 
                onUpdate={onUpdate}
                isCollapsed={collapsedDividers.has(rule.id)}
                onToggleCollapse={() => toggleDivider(rule.id)}
                ruleCount={ruleGroups.get(rule.id)?.length || 0}
            />
           )
        })}
      </tbody>
    </table>
  );
};