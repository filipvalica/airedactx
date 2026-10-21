// src/ui/components/RowParts.tsx
// Pieces shared by RuleRow and DividerRow: the drag handle cell, the edit/save/cancel buttons,
// and the sortable row styling. Keeping them here means the two rows differ only in content.
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckIcon, GripIcon, PencilIcon, XIcon } from './Icons';

type Sortable = ReturnType<typeof useSortable>;

/** Inline style that moves the row while it is being dragged. */
export const sortableRowStyle = (
  transform: Sortable['transform'],
  transition: Sortable['transition'],
  isDragging: boolean,
): React.CSSProperties => ({
  transform: CSS.Translate.toString(transform),
  transition,
  zIndex: isDragging ? 100 : 'auto',
});

type DragHandleCellProps = Pick<Sortable, 'attributes' | 'listeners' | 'setActivatorNodeRef'>;

/**
 * Drag attributes and listeners both go on the handle, so the row keeps its table semantics
 * and the handle is what screen readers and the keyboard sensor pick up.
 */
export const DragHandleCell: React.FC<DragHandleCellProps> = ({ attributes, listeners, setActivatorNodeRef }) => (
  <td className="drag-cell">
    <span ref={setActivatorNodeRef} className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
      <GripIcon />
    </span>
  </td>
);

interface EditButtonsProps {
  isEditing: boolean;
  onStart: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditButtons: React.FC<EditButtonsProps> = ({ isEditing, onStart, onSave, onCancel }) =>
  isEditing ? (
    <>
      <button onClick={onSave} className="action-btn" title="Save" aria-label="Save">
        <CheckIcon />
      </button>
      <button onClick={onCancel} className="action-btn" title="Cancel" aria-label="Cancel">
        <XIcon />
      </button>
    </>
  ) : (
    <button onClick={onStart} className="action-btn" title="Edit" aria-label="Edit">
      <PencilIcon />
    </button>
  );
