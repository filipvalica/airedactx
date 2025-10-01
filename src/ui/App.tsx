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
    URL.revokeObjectURL(url);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          resolve(text);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error occurred'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  };

  const validateAndParseCSV = (csvText: string): RedactionRule[] => {
    console.log("Starting CSV validation...");
    const lines = csvText.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    
    if (lines.length === 0) {
      throw new Error("CSV file is empty.");
    }
    
    const header = lines.shift()?.trim().toLowerCase();
    console.log("Header:", header);
    
    if (header !== 'type,find,replace') {
      throw new Error(`Invalid CSV header. Expected 'type,find,replace' but got '${header}'.`);
    }

    const rules: RedactionRule[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;

      console.log(`Processing line ${i + 2}:`, line);

      // Improved CSV parsing that handles quoted fields with commas
      const parts: string[] = [];
      let current = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          if (insideQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);

      console.log(`Parsed parts:`, parts);

      if (parts.length !== 3) {
        throw new Error(`Row ${i + 2}: Expected 3 columns but found ${parts.length}.`);
      }

      const [type, find, replace] = parts.map(p => p.trim());

      if (!type || !find || !replace) {
        throw new Error(`Row ${i + 2}: All columns must have values.`);
      }

      if (type !== 'literal' && type !== 'regex') {
        throw new Error(`Row ${i + 2}: Type must be 'literal' or 'regex', got '${type}'.`);
      }

      if (type === 'regex') {
        try {
          new RegExp(find);
        } catch (e) {
          throw new Error(`Row ${i + 2}: Invalid regex pattern '${find}'.`);
        }
      }

      rules.push({
        id: `imported-rule-${Date.now()}-${i}`,
        type: type as 'literal' | 'regex',
        find,
        replace,
        enabled: true
      });
    }

    if (rules.length === 0) {
      throw new Error("No valid rules found in CSV file.");
    }

    console.log("Validation complete, rules:", rules);
    return rules;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed - event fired!");
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("File selected:", file.name, file.size, "bytes");
    
    try {
      const text = await readFileAsText(file);
      console.log("File read successfully, length:", text.length);
      console.log("First 200 chars:", text.substring(0, 200));
      
      const importedRules = validateAndParseCSV(text);
      console.log("Parsed rules:", importedRules.length);
      
      const confirmed = window.confirm(
        `Found ${importedRules.length} valid rule${importedRules.length !== 1 ? 's' : ''}.\n\n` +
        `Importing will REPLACE all ${rules.length} existing rule${rules.length !== 1 ? 's' : ''}.\n\n` +
        `Continue?`
      );
      
      console.log("User confirmed:", confirmed);
      
      if (confirmed) {
        console.log("Saving rules...");
        setRules(importedRules);
        await saveRules(importedRules);
        console.log("Save complete");
        alert(`Successfully imported ${importedRules.length} rule${importedRules.length !== 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert(`Import failed:\n\n${(error as Error).message}`);
    } finally {
      // Reset the file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    console.log("Import button clicked");
    console.log("File input ref exists:", !!fileInputRef.current);
    if (fileInputRef.current) {
      console.log("Triggering file picker...");
      fileInputRef.current.click();
    } else {
      console.error("File input ref is null!");
    }
  };

  const literalRules = rules.filter((r) => r.type === 'literal');
  const regexRules = rules.filter((r) => r.type === 'regex');

  return (
    <div>
      <AddRuleForm onAddRule={handleAddRule} />
      <div className="data-management">
        <button onClick={handleExportRules}>Export Rules</button>
        <button onClick={handleImportClick}>Import Rules</button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".csv" 
          onChange={handleFileChange}
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