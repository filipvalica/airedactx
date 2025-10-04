// src/ui/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab } from './components/Tabs';
import { SettingsPanel } from './components/Settings';
import { RuleList } from './components/RuleList';
import { AddRuleForm } from './components/AddRuleForm';
import { getRules, saveRules } from '../storage/storageManager';
import { RedactionRule } from '../types';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function RulesPanel() {
  const [rules, setRules] = useState<RedactionRule[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{rule: RedactionRule, index: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const undoTimeoutRef = useRef<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const loadRules = async () => setRules(await getRules());
    loadRules();
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((r) => r.id === active.id);
      const newIndex = rules.findIndex((r) => r.id === over.id);
      const updatedRules = arrayMove(rules, oldIndex, newIndex);
      setRules(updatedRules);
      await saveRules(updatedRules);
    }
  };
  
  const handleAddRule = async (newRule: Omit<RedactionRule, 'id' | 'enabled'>) => {
    if (rules.some(rule => rule.find.trim() === newRule.find.trim())) {
      alert(`Error: A rule with the match pattern "${newRule.find}" already exists.`);
      return;
    }
    const ruleToAdd: RedactionRule = { ...newRule, id: `rule-${Date.now()}`, enabled: true };
    const updatedRules = [...rules, ruleToAdd];
    setRules(updatedRules);
    await saveRules(updatedRules);
  };
  
  const handleToggleRule = async (id: string) => {
    const updatedRules = rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
    setRules(updatedRules);
    await saveRules(updatedRules);
  };

  const handleUpdateRule = async (id: string, find: string, replace: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === id ? { ...rule, find, replace } : rule
    );
    setRules(updatedRules);
    await saveRules(updatedRules);
  };
  
  const handleExportRules = () => {
    const header = "type,find,replace\n";
    const csvRows = rules.map(rule => {
      const escape = (field: string) => `"${field.replace(/"/g, '""')}"`;
      return [rule.type, escape(rule.find), escape(rule.replace)].join(',');
    });
    const BOM = '\uFEFF';
    const csvString = BOM + header + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'airedactx_rules.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const importedRules = validateAndParseCSV(text);
        if (window.confirm(`Found ${importedRules.length} rules. Importing will overwrite all existing rules. Continue?`)) {
          setRules(importedRules);
          await saveRules(importedRules);
          alert("Rules imported successfully!");
        }
      } catch (error) {
        alert(`Import failed: ${(error as Error).message}`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };
  
  const validateAndParseCSV = (csvText: string): RedactionRule[] => {
    const lines = csvText.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    const header = lines.shift()?.trim();
    if (header !== 'type,find,replace') {
      throw new Error("Invalid CSV header. Expected 'type,find,replace'.");
    }

    return lines.map((line, index) => {
      if (line.trim() === '') return null;
      const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      if (parts.length !== 3) {
        throw new Error(`Row ${index + 1}: Each row must have exactly 3 columns.`);
      }
      const [type, find, replace] = parts.map(p => p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      if (type !== 'literal' && type !== 'regex') {
        throw new Error(`Row ${index + 1}: Type must be 'literal' or 'regex'.`);
      }
      if (type === 'regex') {
        try { new RegExp(find); } 
        catch (e) { throw new Error(`Row ${index + 1}: Invalid Regex pattern in 'find' column.`); }
      }
      return { id: `imported-rule-${Date.now()}-${index}`, type: type as 'literal' | 'regex', find, replace, enabled: true };
    }).filter((rule): rule is RedactionRule => rule !== null);
  };

  const handleDeleteRule = (id: string) => {
    const ruleIndex = rules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) return;

    const ruleToDelete = rules[ruleIndex];
    setRecentlyDeleted({ rule: ruleToDelete, index: ruleIndex });

    const updatedRules = rules.filter(rule => rule.id !== id);
    setRules(updatedRules);

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    undoTimeoutRef.current = window.setTimeout(async () => {
      await saveRules(updatedRules);
      setRecentlyDeleted(null);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (recentlyDeleted) {
      const newRules = [...rules];
      newRules.splice(recentlyDeleted.index, 0, recentlyDeleted.rule);
      setRules(newRules);
      setRecentlyDeleted(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      
      <section className="panel-container">
        <h4 className="panel-heading">Import / Export Rules</h4>
        <p className="panel-description">
          You can save your current ruleset to a CSV file for backup or editing, and import it back later.
        </p>
        <div className="data-management">
          <button onClick={() => fileInputRef.current?.click()}>Import Rules</button>
          <button onClick={handleExportRules}>Export Rules</button>
        </div>
      </section>

      <section className="panel-container">
        <h4 className="panel-heading">Add Rule</h4>
        <AddRuleForm onAddRule={handleAddRule} />
      </section>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileSelected} />

      {recentlyDeleted && (
        <div className="undo-snackbar" role="alert">
          <span>Rule deleted.</span>
          <button onClick={handleUndoDelete}>Undo</button>
        </div>
      )}
      
      <section className="panel-container">
        <h4 className="panel-heading">All Rules</h4>
        <p className="panel-description">
          Rules are applied in order from top to bottom. The first rule that finds a match will be used.
        </p>
        {rules.length > 0 ? (
          <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <RuleList 
              rules={rules} 
              onDelete={handleDeleteRule} 
              onToggle={handleToggleRule}
              onUpdate={handleUpdateRule}
            />
          </SortableContext>
        ) : <p className="no-rules-message">No rules have been added yet.</p>}
      </section>

    </DndContext>
  );
}

function App() {
  return (
    <div className="app-container">
      <header><h1>AIRedactX</h1></header>
      <main role="main">
        <Tabs>
          <Tab label="Rules"><RulesPanel /></Tab>
          <Tab label="Settings"><SettingsPanel /></Tab>
        </Tabs>
      </main>
    </div>
  );
}

export default App;