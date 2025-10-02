// src/content/injector.ts
import browser from 'webextension-polyfill';
import { getRules, getSettings } from '../storage/storageManager';
import { performRedaction } from '../core/engine';
import { showRedactionUI, hideRedactionUI } from './ui-injector';

// Use a global flag on the window object to ensure this script's main logic
// only runs once per frame, even if it's injected multiple times.
if (!(window as any).hasAIRedactXInitialized) {
  (window as any).hasAIRedactXInitialized = true;

  console.log('AIRedactX content script executing.');

  let currentActiveElement: HTMLElement | null = null;

  const handleRedaction = async (element: HTMLElement) => {
    const rules = await getRules();
    const settings = await getSettings();
    let textToRedact = '';

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      textToRedact = (element as HTMLTextAreaElement | HTMLInputElement).value;
    } else if (element.isContentEditable) {
      textToRedact = element.innerText || element.textContent || '';
    }

    const redactedText = performRedaction(textToRedact, rules, settings);

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      (element as HTMLTextAreaElement | HTMLInputElement).value = redactedText;
    } else if (element.isContentEditable) {
      element.innerText = redactedText;
    }
    // Dispatch an 'input' event so that web apps (especially React apps)
    // recognize the programmatic change to the input field.
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  };

  browser.runtime.onMessage.addListener(async (message: any) => {
    if (message.command === 'redact-from-context-menu') {
      const activeElement = findActiveElement(document) as HTMLElement;
      if (activeElement && isEditable(activeElement)) {
        handleRedaction(activeElement);
      }
    }
  });

  function findActiveElement(root: Document | ShadowRoot): Element | null {
    const activeEl = root.activeElement;
    if (!activeEl) return null;
    if (activeEl.shadowRoot) {
      const shadowActive = findActiveElement(activeEl.shadowRoot);
      if (shadowActive) return shadowActive;
    }
    return activeEl;
  }

  function isEditable(el: Element | null): el is HTMLElement {
    if (!el) return false;
    const tagName = el.tagName.toUpperCase();
    if (tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable) return true;
    if (tagName === 'INPUT') {
      const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url'];
      return inputTypes.includes((el as HTMLInputElement).type.toLowerCase());
    }
    return false;
  }

  // --- Logic for Hover Button ---
  document.addEventListener('focusin', async (event) => {
    const target = event.target as HTMLElement;
    if (isEditable(target)) {
        currentActiveElement = target;
        const settings = await getSettings();
        // The hover button only appears if "Use Anywhere Mode" is on.
        if (settings.useAnywhereMode) {
            showRedactionUI(target, settings, () => handleRedaction(target));
        }
    }
  });

  document.addEventListener('focusout', (event) => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      // Hide the panel if focus moves to an element that isn't part of our UI.
      if (currentActiveElement && (!relatedTarget || !relatedTarget.closest('.airedactx-button-panel'))) {
          hideRedactionUI();
          currentActiveElement = null;
      }
  });

  // Since the script can be injected after the page is loaded and an element
  // is already focused, we run a check immediately to show the UI if needed.
  setTimeout(() => {
      const activeElement = findActiveElement(document) as HTMLElement;
      if(isEditable(activeElement)) {
          // Dispatch a synthetic focusin event to trigger our listener.
          activeElement.dispatchEvent(new CustomEvent('focusin', { bubbles: true }));
      }
  }, 100);
}