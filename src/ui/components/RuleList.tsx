// src/ui/components/RuleList.tsx
// The rules table. Rows are grouped under dividers; a collapsed divider hides its rules.
import React from 'react';
import { RedactionRule } from '../../types';
import { UpdateRule } from './useRuleEdit';
import { RuleRow } from './RuleRow';
import { DividerRow } from './DividerRow';

export type { RuleEdit, UpdateRule } from './useRuleEdit';

interface RuleListProps {
  rules: RedactionRule[];
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onUpdate: UpdateRule;
  collapsedDividers: Set<string>;
  toggleDivider: (id: string) => void;
}

/** A row to render: a rule, and the number of rules under it if it is a divider. */
interface VisibleRow {
  rule: RedactionRule;
  ruleCount: number;
}

/** Walk the list once: count each divider's rules and drop rules under collapsed dividers. */
export const visibleRows = (rules: RedactionRule[], collapsed: Set<string>): VisibleRow[] => {
  const counts = new Map<string, number>();
  let dividerId: string | null = null;
  for (const rule of rules) {
    if (rule.type === 'divider') dividerId = rule.id;
    else if (dividerId) counts.set(dividerId, (counts.get(dividerId) ?? 0) + 1);
  }

  const rows: VisibleRow[] = [];
  dividerId = null;
  for (const rule of rules) {
    if (rule.type === 'divider') dividerId = rule.id;
    else if (dividerId && collapsed.has(dividerId)) continue;
    rows.push({ rule, ruleCount: counts.get(rule.id) ?? 0 });
  }
  return rows;
};

export const RuleList: React.FC<RuleListProps> = ({
  rules,
  onDelete,
  onToggle,
  onUpdate,
  collapsedDividers,
  toggleDivider,
}) => {
  if (rules.length === 0) return null;

  return (
    <table className="rule-table">
      <thead>
        <tr>
          <th className="col-drag">
            <span className="visually-hidden">Reorder</span>
          </th>
          <th className="col-status">Status</th>
          <th className="col-type">Type</th>
          <th className="col-find">Match Pattern / Title</th>
          <th className="col-replace">Placeholder Label</th>
          <th className="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {visibleRows(rules, collapsedDividers).map(({ rule, ruleCount }) =>
          rule.type === 'divider' ? (
            <DividerRow
              key={rule.id}
              rule={rule}
              ruleCount={ruleCount}
              isCollapsed={collapsedDividers.has(rule.id)}
              onToggleCollapse={() => toggleDivider(rule.id)}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ) : (
            <RuleRow key={rule.id} rule={rule} onDelete={onDelete} onToggle={onToggle} onUpdate={onUpdate} />
          ),
        )}
      </tbody>
    </table>
  );
};
