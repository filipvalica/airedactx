// src/ui/components/Settings.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  getSettings,
  saveSettings,
  resetSettings,
  loadMasterRules,
  saveRules,
  mergeImportedSettings,
  DEFAULT_SETTINGS,
} from '../../storage/storageManager';
import { parseSiteList } from '../../core/siteAllow';
import { AppSettings } from '../../types';
import { Dialog, useDialog } from './Dialog';

const STATUS_MS = 3000;

export const SettingsPanel = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [status, setStatus] = useState('');
  // The allowed-sites box keeps its own text while you type. Normalizing on every keystroke
  // would strip the newline you just pressed and save on every character; it commits on blur.
  const [siteListDraft, setSiteListDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();
  const statusTimerRef = useRef<number | undefined>(undefined);

  const adopt = (next: AppSettings) => {
    setSettings(next);
    setSiteListDraft(next.allowedSites.join('\n'));
  };

  useEffect(() => {
    void getSettings().then(adopt);
    return () => window.clearTimeout(statusTimerRef.current);
  }, []);

  const flash = (message: string) => {
    setStatus(message);
    window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setStatus(''), STATUS_MS);
  };

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    void saveSettings(updated);
    flash('Settings saved.');
  };

  const handleExportSettings = () => {
    if (!settings) return;

    // One row per setting: Key <tab> JSON value. Driven by DEFAULT_SETTINGS so a new setting
    // cannot be left out of the export by mistake.
    const keys = Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[];
    const rows = [['Key', 'Value'], ...keys.map((key) => [key, JSON.stringify(settings[key])])];

    const tsvContent = rows.map((row) => row.join('\t')).join('\n');
    const url = URL.createObjectURL(new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'airedactx_settings.tsv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !settings) return;
    try {
      const lines = (await file.text()).trim().split(/\r?\n/);
      if (lines[0]?.startsWith('Key')) lines.shift();
      const imported: Record<string, unknown> = {};
      for (const line of lines) {
        const [key, value] = line.split('\t');
        if (key && value) imported[key.trim()] = JSON.parse(value);
      }
      const merged = mergeImportedSettings(settings, imported);
      adopt(merged);
      await saveSettings(merged);
      flash('Settings imported.');
    } catch {
      dialog.notify('Import failed', 'The file is not a settings TSV exported by AIRedactX.');
    }
  };

  const handleResetSettings = () =>
    dialog.confirm(
      'Reset settings',
      'Every setting in this panel goes back to its original value. Rules are not affected.',
      'Reset settings',
      () => {
        void resetSettings().then((next) => {
          adopt(next);
          flash('Settings reset to defaults.');
        });
      },
    );

  const handleResetRules = () =>
    dialog.confirm(
      'Reset rules',
      'All current rules are replaced with the bundled defaults. Export first if you want to keep them.',
      'Replace my rules',
      () => {
        void loadMasterRules()
          .then(saveRules)
          .then(() => flash('Default rules restored. Open the Rules tab to see them.'));
      },
    );

  const commitSiteList = () => {
    if (!settings) return;
    const domains = parseSiteList(siteListDraft);
    setSiteListDraft(domains.join('\n'));
    if (domains.join('\n') !== settings.allowedSites.join('\n')) handleSettingChange('allowedSites', domains);
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
            <p className="setting-description">
              Show the redact button on text fields on every website, not only the allowed list below.
            </p>
            <p className="setting-description">
              The right-click "Redact this field" menu works on every site regardless of this setting.
            </p>
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
          <div className="setting-row setting-row-top">
            <div className="setting-label">
              <label htmlFor="allowedSites">Allowed Websites</label>
              <p className="setting-description">
                The redact button only appears on these domains and their subdomains. One per line. Saved when you click
                away.
              </p>
            </div>
            <div className="setting-control setting-control-wide">
              <textarea
                id="allowedSites"
                rows={8}
                className="site-list"
                value={siteListDraft}
                onChange={(e) => setSiteListDraft(e.target.value)}
                onBlur={commitSiteList}
                placeholder="example.com"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        <div className="setting-row">
          <div className="setting-label">
            <label htmlFor="buttonPosition">Button Position</label>
            <p className="setting-description">Choose which corner of the text field the hover button appears in.</p>
          </div>
          <div className="setting-control">
            <select
              id="buttonPosition"
              value={settings.buttonPosition}
              onChange={(e) => handleSettingChange('buttonPosition', e.target.value as AppSettings['buttonPosition'])}
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
            <label htmlFor="delimiterStyle">Delimiter Style</label>
            <p className="setting-description">Select the character style used for redaction placeholders.</p>
          </div>
          <div className="setting-control">
            <select
              id="delimiterStyle"
              value={settings.delimiterStyle}
              onChange={(e) => handleSettingChange('delimiterStyle', e.target.value as AppSettings['delimiterStyle'])}
            >
              <option value="[[..]]">[[..]]</option>
              <option value="{{..}}">{`{{..}}`}</option>
              <option value="((..))">((..))</option>
              <option value="<<..>>">{`<<..>>`}</option>
            </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <label htmlFor="highlightStyle">Highlight After Redaction</label>
            <p className="setting-description">How a field is marked once redacted, until you click into it again.</p>
          </div>
          <div className="setting-control">
            <select
              id="highlightStyle"
              value={settings.highlightStyle}
              onChange={(e) => handleSettingChange('highlightStyle', e.target.value as AppSettings['highlightStyle'])}
            >
              <option value="amber">Amber background</option>
              <option value="outline">Orange outline</option>
              <option value="none">No highlight</option>
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
      <Dialog state={dialog.state} onClose={dialog.close} />
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
            <button onClick={handleResetRules} className="action-btn-danger">
              Reset Rules to Default
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <label>Reset Settings</label>
            <p className="setting-description">Revert all settings in this panel to their original values.</p>
          </div>
          <div className="setting-control">
            <button onClick={handleResetSettings} className="action-btn-danger">
              Reset Settings to Default
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
