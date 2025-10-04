// src/background/main.ts
import browser from 'webextension-polyfill';
import { saveRules, DEFAULT_RULES } from '../storage/storageManager';

browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await saveRules(DEFAULT_RULES);
  }
  // This creates the right-click menu item
  browser.contextMenus.create({
    id: 'redact-this-field',
    title: 'Redact this field',
    contexts: ['editable'],
  });
});

// This listener handles the click on the menu item
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'redact-this-field' && tab?.id) {
    const tabId = tab.id;
    const frameId = info.frameId || 0;

    // *** THE FINAL FIX: ROBUST INJECTION AND MESSAGING ***
    // This logic ensures the content script is present before sending the message.
    // It acts as a failsafe if the automatic injection from the manifest fails.
    browser.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frameId] },
      files: ['content.js'],
    })
    .then(() => {
      // After ensuring the script is injected, send the command.
      browser.tabs.sendMessage(tabId, {
        command: 'redact-from-context-menu',
      }, { frameId });
    })
    .catch((error) => {
      console.error('AIRedactX: Injection or messaging failed.', error);
    });
  }
});

// This listener handles clicks on the extension's toolbar icon
browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});