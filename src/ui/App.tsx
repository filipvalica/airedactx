// src/ui/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab } from './components/Tabs';
import { SettingsPanel } from './components/Settings';
import { RuleList } from './components/RuleList';
import { AddRuleForm } from './components/AddRuleForm';
import { getRules, saveRules } from '../storage/storageManager';
import { RedactionRule } from '../types';

function RulesPanel() {
  const [rules, setRules] = useState<RedactionRule[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadRules = async () => {
      setRules(await getRules());
    };
    loadRules();
  }, []);

  const handleAddRule = async (newRule: Omit<RedactionRule, 'id' | 'enabled'>) => {
    const ruleToAdd: RedactionRule = { ...newRule, id: `rule-${Date.now()}`, enabled: true };
    const updatedRules = [...rules, ruleToAdd];
    setRules(updatedRules);
    await saveRules(updatedRules);
  };

  const handleDeleteRule = async (id: string) => {
    const updatedRules = rules.filter((rule) => rule.id !== id);
    setRules(updatedRules);
    await saveRules(updatedRules);
  };

  const handleToggleRule = async (id: string) => {
    const updatedRules = rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
    setRules(updatedRules);
    await saveRules(updatedRules);
  };

  const handleReorderRule = async (id: string, direction: 'up' | 'down') => {
    const index = rules.findIndex((rule) => rule.id === id);
    if (index === -1) return;

    const newRules = [...rules];
    const item = newRules.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex <= rules.length) {
      newRules.splice(newIndex, 0, item);
      setRules(newRules);
      await saveRules(newRules);
    }
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
    if (!file) {
      return;
    }

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
      // Reset the file input so the user can select the same file again
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
        try {
          new RegExp(find);
        } catch (e) {
          throw new Error(`Row ${index + 1}: Invalid Regex pattern in 'find' column.`);
        }
      }
      return { id: `imported-rule-${Date.now()}-${index}`, type: type as 'literal' | 'regex', find, replace, enabled: true };
    }).filter(Boolean) as RedactionRule[];
  };

  const literalRules = rules.filter((r) => r.type === 'literal');
  const regexRules = rules.filter((r) => r.type === 'regex');

  return (
    <div>
      <AddRuleForm onAddRule={handleAddRule} />
      <div className="data-management">
        <button onClick={handleExportRules}>Export Rules</button>
        <button onClick={() => fileInputRef.current?.click()}>Import Rules</button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".csv" 
          onChange={handleFileSelected} 
        />
      </div>
      <h4>Literal Rules</h4>
      <RuleList rules={literalRules} onDelete={handleDeleteRule} onToggle={handleToggleRule} onReorder={handleReorderRule} />
      <h4>Regex Rules</h4>
      <RuleList rules={regexRules} onDelete={handleDeleteRule} onToggle={handleToggleRule} onReorder={handleReorderRule} />
    </div>
  );
}

function App() {
  return (
    <div className="app-container">
      <header><h1>AIRedactX</h1></header>
      <main>
        <Tabs>
          <Tab label="Rules"><RulesPanel /></Tab>
          <Tab label="Settings"><SettingsPanel /></Tab>
        </Tabs>
      </main>
    </div>
  );
}

export default App;