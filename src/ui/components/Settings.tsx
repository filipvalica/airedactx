// src/ui/components/Settings.tsx
import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../../storage/storageManager';
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
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleSave = async () => {
    if (settings) {
      await saveSettings(settings);
      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 2000); // Clear message after 2s
    }
  };

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="form-container">
      <div className="form-group">
        <label htmlFor="useAnywhereMode">Use Anywhere Mode</label>
        <input
          type="checkbox"
          id="useAnywhereMode"
          checked={settings.useAnywhereMode}
          onChange={(e) => handleSettingChange('useAnywhereMode', e.target.checked)}
        />
        <p className="description">Enable functionality on unsupported websites. [cite: 36]</p>
      </div>

      <div className="form-group">
        <label htmlFor="hoverAreaPosition">Button Hover Area</label>
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
        <p className="description">The corner where the button group will appear. [cite: 34]</p>
      </div>
      
      <button onClick={handleSave} className="save-button">Save Settings</button>
      {status && <p className="status-message">{status}</p>}
    </div>
  );
};