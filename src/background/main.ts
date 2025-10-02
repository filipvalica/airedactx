// src/background/main.ts
import browser from 'webextension-polyfill';
import { saveRules, DEFAULT_RULES } from '../storage/storageManager';

browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await saveRules(DEFAULT_RULES);
    console.log('AIRedactX: Default rules installed.');
  }
  browser.contextMenus.create({
    id: 'redact-this-field',
    title: 'Redact this field',
    contexts: ['editable'],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'redact-this-field' && tab?.id) {
    try {
      // Step 1: Programmatically inject the content script into the correct frame.
      // This guarantees the script is running before we send a message.
      await browser.scripting.executeScript({
        target: { tabId: tab.id, frameIds: info.frameId ? [info.frameId] : [0] },
        files: ['content.js'],
      });

      // Step 2: Send the message to the now-active content script.
      await browser.tabs.sendMessage(tab.id, {
        command: 'redact-from-context-menu',
      }, { frameId: info.frameId });

    } catch (error) {
      console.error('AIRedactX: Injection or messaging failed:', error);
    }
  }
});

browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});