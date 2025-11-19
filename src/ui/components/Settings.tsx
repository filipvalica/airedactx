// src/ui/components/Settings.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getSettings, saveSettings, resetSettings, loadMasterRules, saveRules } from '../../storage/storageManager';
import { AppSettings } from '../../types';

export const SettingsPanel = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = await getSettings();
      setSettings(storedSettings);
    };
    loadSettings();
  }, []);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    if (settings) {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      saveSettings(newSettings); 
      setStatus('Settings saved!');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const handleExportSettings = () => {
    if (!settings) return;

    // Create TSV content: Key <tab> Value (JSON stringified)
    const rows = [
        ['Key', 'Value'],
        ['useAnywhereMode', JSON.stringify(settings.useAnywhereMode)],
        ['hoverAreaPosition', JSON.stringify(settings.hoverAreaPosition)],
        ['replaceTextUsing', JSON.stringify(settings.replaceTextUsing)],
        ['siteWhitelist', JSON.stringify(settings.siteWhitelist)]
    ];

    const tsvContent = rows.map(row => row.join('\t')).join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'airedactx_settings.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.trim().split(/\r?\n/);
        // Skip header if present
        if (lines[0].startsWith('Key')) lines.shift();

        const newSettings: Partial<AppSettings> = {};

        lines.forEach(line => {
            const [key, value] = line.split('\t');
            if (key && value) {
                try {
                    // Parse JSON value to get boolean/array/string types correctly
                    newSettings[key as keyof AppSettings] = JSON.parse(value);
                } catch (err) {
                    console.warn(`Failed to parse value for ${key}`, err);
                }
            }
        });

        // Merge with existing defaults to ensure safety
        if (settings) {
            const mergedSettings = { ...settings, ...newSettings };
            setSettings(mergedSettings);
            await saveSettings(mergedSettings);
            setStatus('Settings imported successfully!');
            setTimeout(() => setStatus(''), 3000);
        }
      } catch (err) {
        alert('Failed to import settings. Invalid file format.');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleResetSettings = async () => {
    if (window.confirm("Are you sure you want to reset all settings to their default values? This cannot be undone.")) {
      const newSettings = await resetSettings();
      setSettings(newSettings);
      setStatus('Settings have been reset to default.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleResetRules = async () => {
    if (window.confirm("Are you sure you want to replace all your current rules with the application defaults? This cannot be undone.")) {
        const masterRules = await loadMasterRules();
        await saveRules(masterRules);
        setStatus('Rules have been reset to default. Refresh the Rules tab to see the changes.');
        setTimeout(() => setStatus(''), 4000);
    }
  };

  const handleWhitelistChange = (text: string) => {
    const domains = text.split('\n').map(d => d.trim()).filter(d => d.length > 0);
    handleSettingChange('siteWhitelist', domains);
  };

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <>
      <div className="panel-container">
        <h4 className="panel-heading">General Settings</h4>
        
        <div className="setting-row">
          <div className="setting-label">
            <label htmlFor="useAnywhereMode">"Use Anywhere" Mode</label>
            <p className="setting-description">Show the redaction hover button on text fields on all websites.</p>
            <br/>
             Note: Right-click "Redact this field" works on all sites regardless of this setting.
          </div>
          <div className="setting-control">
              <label className="toggle-switch">
                  <input
                      type="checkbox"
                      id="useAnywhereMode"
                      checked={settings.useAnywhereMode}
                      onChange={(e) => handleSettingChange('useAnywhereMode', e.target.checked)}
                  />
                  <span className="slider"></span>
              </label>
          </div>
        </div>

        {!settings.useAnywhereMode && (
            <div className="setting-row" style={{alignItems: 'flex-start'}}>
                <div className="setting-label">
                    <label>Allowed Websites</label>
                    <p className="setting-description">
                        The extension will only appear on these domains. <br/>
                        Enter one domain per line.
                    </p>
                </div>
                <div className="setting-control" style={{flexGrow: 1, maxWidth: '300px'}}>
                    <textarea 
                        rows={8}
                        style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'monospace'}}
                        value={settings.siteWhitelist?.join('\n') || ''}
                        onChange={(e) => handleWhitelistChange(e.target.value)}
                        placeholder="example.com"
                    />
                </div>
            </div>
        )}

        <div className="setting-row">
          <div className="setting-label">
              <label htmlFor="hoverAreaPosition">Button Position</label>
              <p className="setting-description">Choose which corner of the text field the hover button appears in.</p>
          </div>
          <div className="setting-control">
              <select
                  id="hoverAreaPosition"
                  value={settings.hoverAreaPosition}
                  onChange={(e) => handleSettingChange('hoverAreaPosition', e.target.value)}
              >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
              </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label">
              <label htmlFor="replaceTextUsing">Delimiter Style</label>
              <p className="setting-description">Select the character style used for redaction placeholders.</p>
          </div>
          <div className="setting-control">
              <select
                  id="replaceTextUsing"
                  value={settings.replaceTextUsing}
                  onChange={(e) => handleSettingChange('replaceTextUsing', e.target.value)}
              >
                  <option value="[[..]]">[[..]]</option>
                  <option value="{{..}}">{`{{..}}`}</option>
                  <option value="((..))">((..))</option>
                  <option value="<<..>>">{`<<..>>`}</option>
              </select>
          </div>
        </div>
        
        {status && <p className="status-message">{status}</p>}
      </div>

      <div className="panel-container">
          <h4 className="panel-heading">Import / Export Settings</h4>
          <div className="setting-row">
              <div className="setting-label">
                  <label>Data Management</label>
                  <p className="setting-description">Save your configuration or load a previous setup.</p>
              </div>
              <div className="data-management">
                  <button onClick={() => fileInputRef.current?.click()}>Import Settings</button>
                  <button onClick={handleExportSettings}>Export Settings</button>
              </div>
          </div>
      </div>
      {/* Hidden file input for settings import */}
      <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".tsv,text/tab-separated-values" 
          onChange={handleImportSettings} 
      />

      <div className="panel-container">
        <h4 className="panel-heading">Danger Zone</h4>
        <div className="setting-row">
            <div className="setting-label">
                <label>Reset Rules</label>
                <p className="setting-description">Erase all current rules and restore the official defaults.</p>
            </div>
            <div className="setting-control">
                <button onClick={handleResetRules} className="action-btn-danger">Reset Rules to Default</button>
            </div>
        </div>
        <div className="setting-row">
            <div className="setting-label">
                <label>Reset Settings</label>
                <p className="setting-description">Revert all settings in this panel to their original values.</p>
            </div>
            <div className="setting-control">
                <button onClick={handleResetSettings} className="action-btn-danger">Reset Settings to Default</button>
            </div>
        </div>
      </div>
    </>
  );
};