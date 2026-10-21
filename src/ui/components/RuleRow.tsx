// src/ui/components/RuleRow.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { RedactionRule } from '../../types';
import { useRuleEdit, UpdateRule } from './useRuleEdit';
import { DragHandleCell, EditButtons, sortableRowStyle } from './RowParts';
import { InfoIcon, TrashIcon } from './Icons';

interface RuleRowProps {
  rule: RedactionRule;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onUpdate: UpdateRule;
}

export const RuleRow: React.FC<RuleRowProps> = ({ rule, onDelete, onToggle, onUpdate }) => {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: rule.id,
  });
  const edit = useRuleEdit(rule, onUpdate);

  return (
    <tr
      ref={setNodeRef}
      style={sortableRowStyle(transform, transition, isDragging)}
      className={rule.enabled ? '' : 'disabled'}
    >
      <DragHandleCell attributes={attributes} listeners={listeners} setActivatorNodeRef={setActivatorNodeRef} />
      <td>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={() => onToggle(rule.id)}
            aria-label={`Enable rule ${rule.replace || rule.find}`}
          />
          <span className="slider"></span>
        </label>
      </td>
      <td className="type-cell">
        <span className={`rule-type-tag tag-${rule.type}`}>{rule.type}</span>
        {!edit.isEditing && rule.type === 'regex' && rule.caseInsensitive && (
          <span className="rule-type-tag tag-flag" title="Ignores case">
            i
          </span>
        )}
        {!edit.isEditing && rule.validate && (
          <span className="rule-type-tag tag-flag" title={`Matches must pass the ${rule.validate} check`}>
            {rule.validate}
          </span>
        )}
      </td>
      <td className="find-text">
        {edit.draft ? (
          <>
            <input
              type="text"
              value={edit.draft.find}
              onChange={(e) => edit.change({ find: e.target.value })}
              onKeyDown={edit.onKeyDown}
              className="table-input"
              aria-label="Match pattern"
              aria-invalid={!!edit.error}
              autoFocus
            />
            {rule.type === 'regex' && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!edit.draft.caseInsensitive}
                  onChange={(e) => edit.change({ caseInsensitive: e.target.checked })}
                />
                Ignore case
              </label>
            )}
            {edit.error && (
              <p className="field-error" role="alert">
                {edit.error}
              </p>
            )}
          </>
        ) : (
          `"${rule.find}"`
        )}
      </td>
      <td className="replace-text">
        {edit.draft ? (
          <input
            type="text"
            value={edit.draft.replace}
            onChange={(e) => edit.change({ replace: e.target.value })}
            onKeyDown={edit.onKeyDown}
            className="table-input"
            aria-label="Placeholder label"
          />
        ) : (
          `"${rule.replace}"`
        )}
      </td>
      <td className="actions-cell">
        {rule.note && (
          <span
            className="action-btn note-icon"
            title={rule.note}
            role="img"
            aria-label={`Note: ${rule.note}`}
            tabIndex={0}
          >
            <InfoIcon />
          </span>
        )}
        <EditButtons isEditing={edit.isEditing} onStart={edit.start} onSave={edit.save} onCancel={edit.cancel} />
        <button
          onClick={() => onDelete(rule.id)}
          className="action-btn delete-btn"
          title="Delete rule"
          aria-label="Delete rule"
          disabled={edit.isEditing}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
};
