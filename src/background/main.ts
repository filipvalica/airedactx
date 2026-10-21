// src/background/main.ts
// Event page (Firefox) / service worker (Chrome). Three jobs: seed the default rules on first
// install, own the "Redact this field" context menu, and open the options page from the toolbar.

import browser from 'webextension-polyfill';
import { saveRules, loadMasterRules } from '../storage/storageManager';
import { REDACT_COMMAND } from '../types';

const MENU_ID = 'airedactx-redact-this-field';

browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await saveRules(await loadMasterRules());
  }
  // onInstalled also fires on update and the menu persists, so clear before creating.
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({ id: MENU_ID, title: 'Redact this field', contexts: ['editable'] });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || tab?.id === undefined) return;
  const tabId = tab.id;
  const frameId = info.frameId ?? 0;
  const message = { command: REDACT_COMMAND };

  try {
    await browser.tabs.sendMessage(tabId, message, { frameId });
  } catch {
    // No content script in this frame yet (page was open before install). Inject once, retry.
    try {
      await browser.scripting.executeScript({ target: { tabId, frameIds: [frameId] }, files: ['content.js'] });
      await browser.tabs.sendMessage(tabId, message, { frameId });
    } catch (error) {
      console.error('AIRedactX: could not reach the page to redact', error);
    }
  }
});

browser.action.onClicked.addListener(() => {
  void browser.runtime.openOptionsPage();
});
