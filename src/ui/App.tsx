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
  const [collapsedDividers, setCollapsedDividers] = useState<Set<string>>(new Set());
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
  
  const handleAddRule = async (newRule: Omit<RedactionRule, 'id' | 'enabled' | 'note'>) => {
    if (newRule.type !== 'divider' && rules.some(rule => rule.find.trim() === newRule.find.trim())) {
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
    const header = "type\tfind\treplace\tActive\tNote\n";
    const tsvRows = rules.map(rule => {
      const escape = (field: string = '') => field.replace(/\t/g, ' ').replace(/\n/g, ' ');
      const active = rule.enabled ? 'Y' : 'N';
      let note = rule.note || '';
      if (rule.type === 'divider') {
          note = rule.find;
      }
      return [escape(rule.type), escape(rule.find), escape(rule.replace), active, escape(note)].join('\t');
    });
    const BOM = '\uFEFF';
    const tsvString = BOM + header + tsvRows.join('\n');
    const blob = new Blob([tsvString], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'airedactx_rules.tsv');
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
        const importedRules = validateAndParseTSV(text);
        handleImportedRules(importedRules);
      } catch (e) {
        // FIX: Cast 'e' to 'Error' to safely access the message property
        alert(`Import failed: ${(e as Error).message}`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleImportedRules = (importedRules: RedactionRule[]) => {
    const importMode = window.prompt(`Found ${importedRules.length} rules. How would you like to import them?\n\nType 'REPLACE' to overwrite all existing rules.\nType 'MERGE' to add new rules and update existing ones.`, "MERGE");

    if (importMode === null) return;

    if (importMode.toUpperCase() === 'REPLACE') {
        setRules(importedRules);
        saveRules(importedRules);
        alert("Rules replaced successfully!");
    } else if (importMode.toUpperCase() === 'MERGE') {
        const existingRulesByFind = new Map(rules.map(r => [r.find, r]));
        let newRulesCount = 0;
        let updatedRulesCount = 0;

        importedRules.forEach(importedRule => {
            if (importedRule.type !== 'divider' && existingRulesByFind.has(importedRule.find)) {
                const existingRule = existingRulesByFind.get(importedRule.find)!;
                Object.assign(existingRule, importedRule, { id: existingRule.id });
                updatedRulesCount++;
            } else {
                const newId = `imported-${Date.now()}-${Math.random()}`;
                existingRulesByFind.set(importedRule.find || newId, { ...importedRule, id: importedRule.id || newId });
                newRulesCount++;
            }
        });
        
        const mergedRules = Array.from(existingRulesByFind.values());
        setRules(mergedRules);
        saveRules(mergedRules);
        alert(`Merge complete: ${newRulesCount} new rules added, ${updatedRulesCount} existing rules updated.`);
    } else {
        alert("Invalid import option. Please type 'REPLACE' or 'MERGE'.");
    }
  };
  
  const validateAndParseTSV = (tsvText: string): RedactionRule[] => {
    const allLines = tsvText.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    if (allLines[0].startsWith('type\tfind')) allLines.shift();

    const trimQuotes = (str: string = '') => str.trim().replace(/^"|"$/g, '');

    return allLines.map((line, index): RedactionRule | null => {
      if (!line.trim() || line.startsWith('#')) return null;

      const parts = line.split('\t');
      const [type, find, replace, active, note] = parts;

      if (!type) return null;
      
      const ruleType = type.trim() as 'literal' | 'regex' | 'divider';
      if (!['literal', 'regex', 'divider'].includes(ruleType)) {
        throw new Error(`Row ${index + 1}: Type must be 'literal', 'regex', or 'divider'.`);
      }
      
      const findValue = trimQuotes(find);
      if (ruleType === 'regex' && findValue) {
        try { new RegExp(findValue); } 
        catch (e) { throw new Error(`Row ${index + 1}: Invalid Regex pattern in '${findValue}': ${(e as Error).message}`); }
      }

      const newRule: RedactionRule = { 
        id: `imported-rule-${Date.now()}-${index}`, 
        type: ruleType, 
        find: findValue, 
        replace: trimQuotes(replace), 
        enabled: active ? active.trim().toUpperCase() === 'Y' : true,
        note: note ? note.trim().substring(0, 255) : undefined
      };

      if (newRule.type === 'divider') {
        newRule.find = note || `Divider ${index + 1}`;
        newRule.replace = '';
      }
      return newRule;
    }).filter((rule): rule is RedactionRule => rule !== null);
  };

  const handleDeleteRule = (id: string) => {
    const ruleIndex = rules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) return;
    const ruleToDelete = rules[ruleIndex];
    setRecentlyDeleted({ rule: ruleToDelete, index: ruleIndex });
    const updatedRules = rules.filter(rule => rule.id !== id);
    setRules(updatedRules);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
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
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };
  
  const handleToggleDivider = (dividerId: string) => {
      setCollapsedDividers(prev => {
          const newSet = new Set(prev);
          if (newSet.has(dividerId)) {
              newSet.delete(dividerId);
          } else {
              newSet.add(dividerId);
          }
          return newSet;
      });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <section className="panel-container">
        <h4 className="panel-heading">Import / Export Rules</h4>
        <p className="panel-description">
          Save or load your ruleset using a TSV file.
        </p>
        <div className="data-management">
          <button onClick={() => fileInputRef.current?.click()}>Import from TSV</button>
          <button onClick={handleExportRules}>Export to TSV</button>
        </div>
      </section>
      <section className="panel-container">
        <h4 className="panel-heading">Add Rule</h4>
        <AddRuleForm onAddRule={handleAddRule} />
      </section>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".tsv,text/tab-separated-values" onChange={handleFileSelected} />
      {recentlyDeleted && (
        <div className="undo-snackbar" role="alert">
          <span>Rule deleted.</span>
          <button onClick={handleUndoDelete}>Undo</button>
        </div>
      )}
      <section className="panel-container">
        <h4 className="panel-heading">All Rules</h4>
        <p className="panel-description">
          Rules are applied top-to-bottom. Drag to reorder priority.
        </p>
        {rules.length > 0 ? (
          <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <RuleList 
              rules={rules} 
              onDelete={handleDeleteRule} 
              onToggle={handleToggleRule}
              onUpdate={handleUpdateRule}
              collapsedDividers={collapsedDividers}
              toggleDivider={handleToggleDivider}
            />
          </SortableContext>
        ) : <p className="no-rules-message">No rules defined.</p>}
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