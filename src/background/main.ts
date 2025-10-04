// src/background/main.ts
import browser from 'webextension-polyfill';
import { saveRules, DEFAULT_RULES } from '../storage/storageManager';

browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await saveRules(DEFAULT_RULES);
  }
  browser.contextMenus.create({
    id: 'redact-this-field',
    title: 'Redact this field',
    contexts: ['editable'],
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'redact-this-field' && tab?.id) {
    const tabId = tab.id;
    const frameId = info.frameId || 0;

    browser.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frameId] },
      files: ['content.js'],
    })
    .then(() => {
      browser.tabs.sendMessage(tabId, {
        command: 'redact-from-context-menu',
      }, { frameId });
    })
    .catch((error) => {
      console.error('AIRedactX: Injection or messaging failed.', error);
    });
  }
});

browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});