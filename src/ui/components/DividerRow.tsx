// src/ui/components/DividerRow.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { RedactionRule } from '../../types';
import { useRuleEdit, UpdateRule } from './useRuleEdit';
import { DragHandleCell, EditButtons, sortableRowStyle } from './RowParts';
import { ChevronDownIcon, TrashIcon } from './Icons';

interface DividerRowProps {
  rule: RedactionRule;
  ruleCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDelete: (id: string) => void;
  onUpdate: UpdateRule;
}

export const DividerRow: React.FC<DividerRowProps> = ({
  rule,
  ruleCount,
  isCollapsed,
  onToggleCollapse,
  onDelete,
  onUpdate,
}) => {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: rule.id,
  });
  const edit = useRuleEdit(rule, onUpdate);

  return (
    <tr ref={setNodeRef} style={sortableRowStyle(transform, transition, isDragging)} className="divider-row">
      <DragHandleCell attributes={attributes} listeners={listeners} setActivatorNodeRef={setActivatorNodeRef} />
      <td colSpan={4} className="divider-cell" onClick={edit.isEditing ? undefined : onToggleCollapse}>
        <div className="divider-title">
          <span className={`divider-chevron ${isCollapsed ? 'collapsed' : ''}`}>
            <ChevronDownIcon size={16} />
          </span>
          {edit.draft ? (
            <>
              <input
                type="text"
                value={edit.draft.find}
                onChange={(e) => edit.change({ find: e.target.value })}
                onKeyDown={edit.onKeyDown}
                className="table-input"
                aria-label="Divider title"
                autoFocus
              />
              {edit.error && (
                <span className="field-error" role="alert">
                  {edit.error}
                </span>
              )}
            </>
          ) : (
            <>
              {rule.find}
              <span className="rule-count">({ruleCount} rules)</span>
            </>
          )}
        </div>
      </td>
      <td className="actions-cell">
        <EditButtons isEditing={edit.isEditing} onStart={edit.start} onSave={edit.save} onCancel={edit.cancel} />
        <button
          onClick={() => onDelete(rule.id)}
          className="action-btn delete-btn"
          title="Delete divider"
          aria-label="Delete divider"
          disabled={edit.isEditing}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
};
