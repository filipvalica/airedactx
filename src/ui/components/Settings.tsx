// src/ui/components/Settings.tsx
import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, resetSettings, loadMasterRules, saveRules } from '../../storage/storageManager';
import { AppSettings } from '../../types';

export const SettingsPanel = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [status, setStatus] = useState('');

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
            <p className="setting-description">Show the redaction button on all websites, even those not officially supported.</p>
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