import browser from 'webextension-polyfill';

console.log('AIRedactX content script loaded.');

// Listen for messages from other parts of the extension
browser.runtime.onMessage.addListener((message: any) => {
  if (message.command === 'redact-from-context-menu') {
    // The active element is the one that was right-clicked
    const activeElement = document.activeElement;

    if (activeElement && (activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
      console.log('Redaction triggered on:', activeElement);
      // TODO: Implement the redaction logic here
    }
  }
});