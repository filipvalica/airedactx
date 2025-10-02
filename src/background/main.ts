// src/background/main.ts
import browser from 'webextension-polyfill';
import { getRules, saveRules } from '../storage/storageManager';
import { DEFAULT_RULES } from '../storage/storageManager';

// Set default rules on installation
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Check if rules already exist to avoid overwriting user data on update
    const existingRules = await getRules();
    // The default getRules returns a default set if empty, so we check against that
    // A more direct check against storage might be better, but this works
    if (existingRules.length <= 2 && existingRules[0]?.find === 'John Doe') {
        await saveRules(DEFAULT_RULES);
        console.log('AIRedactX: Default rules have been installed.');
    }
  }

  // Create the context menu
  browser.contextMenus.create({
    id: 'redact-this-field',
    title: 'Redact this field',
    contexts: ['editable'],
  });
});

// Listen for clicks on the context menu item
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'redact-this-field' && tab?.id) {
    // The message needs to be sent to the specific frame that was clicked
    browser.tabs.sendMessage(tab.id, {
      command: 'redact-from-context-menu',
    }, { frameId: info.frameId });
  }
});

// Open options page when extension icon is clicked
browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});