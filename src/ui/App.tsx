// src/ui/App.tsx
// The options page shell: tabs, the rules state and every handler that changes it. Pure rule
// logic lives in src/core; this file wires it to storage, the table and the dialogs.
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab } from './components/Tabs';
import { SettingsPanel } from './components/Settings';
import { RuleList, RuleEdit } from './components/RuleList';
import { AddRuleForm, NewRule } from './components/AddRuleForm';
import { Dialog, useDialog } from './components/Dialog';
import { getRules, saveRules } from '../storage/storageManager';
import { parseRulesTsv, serializeRulesTsv } from '../core/tsv';
import { normalizePattern, patternError } from '../core/engine';
import { applyImport, ImportMode, newRuleId } from '../core/ruleset';
import { RedactionRule } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const UNDO_WINDOW_MS = 5000;

/** Trigger a browser download of text content. */
const downloadText = (filename: string, text: string, mimeType: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function RulesPanel() {
  const [rules, setRules] = useState<RedactionRule[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ rule: RedactionRule; index: number } | null>(null);
  const [collapsedDividers, setCollapsedDividers] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const undoTimeoutRef = useRef<number | undefined>(undefined);
  const dialog = useDialog();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    void getRules().then(setRules);
    return () => window.clearTimeout(undoTimeoutRef.current);
  }, []);

  /** Every change is persisted immediately; state and storage never drift apart. */
  const commitRules = async (updated: RedactionRule[]) => {
    setRules(updated);
    await saveRules(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = rules.findIndex((r) => r.id === active.id);
    const to = rules.findIndex((r) => r.id === over.id);
    void commitRules(arrayMove(rules, from, to));
  };

  /** Shared by Add and Edit: the pattern must compile and no other non-divider rule may use it. */
  const duplicateError = (find: string, type: RedactionRule['type'], exceptId?: string): string | null => {
    if (type === 'divider') return null;
    const clash = rules.some((rule) => rule.id !== exceptId && rule.type !== 'divider' && rule.find === find);
    return clash ? `A rule with the match pattern "${find}" already exists.` : null;
  };

  const handleAddRule = (newRule: NewRule): string | null => {
    const error = duplicateError(newRule.find, newRule.type);
    if (error) return error;
    void commitRules([...rules, { ...newRule, id: newRuleId(), enabled: true }]);
    return null;
  };

  const handleToggleRule = (id: string) =>
    void commitRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)));

  const handleUpdateRule = (id: string, edit: RuleEdit): string | null => {
    const existing = rules.find((rule) => rule.id === id);
    if (!existing) return 'That rule no longer exists.';
    const { find, caseInsensitive } = normalizePattern(existing.type, edit.find, edit.caseInsensitive);
    const error = patternError(existing.type, find, caseInsensitive) ?? duplicateError(find, existing.type, id);
    if (error) return error;
    const updated: RedactionRule = { ...existing, find, replace: edit.replace.trim() };
    if (caseInsensitive) updated.caseInsensitive = true;
    else delete updated.caseInsensitive;
    void commitRules(rules.map((rule) => (rule.id === id ? updated : rule)));
    return null;
  };

  const handleDeleteRule = (id: string) => {
    const index = rules.findIndex((rule) => rule.id === id);
    if (index === -1) return;
    setRecentlyDeleted({ rule: rules[index], index });
    void commitRules(rules.filter((rule) => rule.id !== id));
    window.clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = window.setTimeout(() => setRecentlyDeleted(null), UNDO_WINDOW_MS);
  };

  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    const restored = [...rules];
    restored.splice(Math.min(recentlyDeleted.index, restored.length), 0, recentlyDeleted.rule);
    void commitRules(restored);
    setRecentlyDeleted(null);
    window.clearTimeout(undoTimeoutRef.current);
  };

  const handleExportRules = () => {
    downloadText('airedactx_rules.tsv', serializeRulesTsv(rules), 'text/tab-separated-values;charset=utf-8');
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseRulesTsv(await file.text());
      dialog.show({
        title: 'Import rules',
        message:
          `Found ${imported.length} rules in ${file.name}.\n\n` +
          'Merge adds the new rules and updates existing ones that have the same match pattern. ' +
          'Replace discards every current rule first.',
        buttons: [
          { label: 'Cancel' },
          { label: 'Replace', kind: 'danger', onClick: () => finishImport(imported, 'replace') },
          { label: 'Merge', kind: 'primary', onClick: () => finishImport(imported, 'merge') },
        ],
      });
    } catch (error) {
      dialog.notify('Import failed', (error as Error).message);
    }
  };

  const finishImport = (imported: RedactionRule[], mode: ImportMode) => {
    const { rules: next, added, updated } = applyImport(rules, imported, mode);
    void commitRules(next);
    dialog.notify(
      'Import complete',
      mode === 'replace' ? `Replaced with ${added} rules.` : `${added} added, ${updated} updated.`,
    );
  };

  const handleToggleDivider = (dividerId: string) => {
    setCollapsedDividers((prev) => {
      const next = new Set(prev);
      if (next.has(dividerId)) next.delete(dividerId);
      else next.add(dividerId);
      return next;
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <section className="panel-container">
        <h4 className="panel-heading">Import / Export Rules</h4>
        <p className="panel-description">Save or load your ruleset as a TSV file (opens in Excel or Google Sheets).</p>
        <div className="data-management">
          <button onClick={() => fileInputRef.current?.click()}>Import from TSV</button>
          <button onClick={handleExportRules}>Export to TSV</button>
        </div>
      </section>
      <section className="panel-container">
        <h4 className="panel-heading">Add Rule</h4>
        <AddRuleForm onAddRule={handleAddRule} />
      </section>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".tsv,text/tab-separated-values"
        onChange={handleFileSelected}
      />
      <Dialog state={dialog.state} onClose={dialog.close} />
      {recentlyDeleted && (
        <div className="undo-snackbar" role="alert">
          <span>Rule deleted.</span>
          <button onClick={handleUndoDelete}>Undo</button>
        </div>
      )}
      <section className="panel-container">
        <h4 className="panel-heading">All Rules</h4>
        <p className="panel-description">
          Literal rules run first, then regex rules, each top to bottom. Drag to reorder.
        </p>
        {rules.length > 0 ? (
          <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <RuleList
              rules={rules}
              onDelete={handleDeleteRule}
              onToggle={handleToggleRule}
              onUpdate={handleUpdateRule}
              collapsedDividers={collapsedDividers}
              toggleDivider={handleToggleDivider}
            />
          </SortableContext>
        ) : (
          <p className="no-rules-message">No rules defined. Import a TSV or use Settings to restore the defaults.</p>
        )}
      </section>
    </DndContext>
  );
}

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>AIRedactX</h1>
      </header>
      <main role="main">
        <Tabs>
          <Tab label="Rules">
            <RulesPanel />
          </Tab>
          <Tab label="Settings">
            <SettingsPanel />
          </Tab>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
