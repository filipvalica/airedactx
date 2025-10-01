// src/background/main.ts
import browser from 'webextension-polyfill';

// Listen for the extension's installation event to create the context menu
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'redact-this-field',
    title: 'Redact this field',
    contexts: ['editable'],
  });
});

// Listen for clicks on the context menu item
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'redact-this-field' && tab?.id) {
    browser.tabs.sendMessage(tab.id, {
      command: 'redact-from-context-menu',
    });
  }
});

// Open options page when extension icon is clicked
browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});