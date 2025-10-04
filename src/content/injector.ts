// src/content/injector.ts
import browser from 'webextension-polyfill';
import { getRules, getSettings } from '../storage/storageManager';
import { performRedaction } from '../core/engine';
import { showRedactionUI, hideRedactionUI } from './ui-injector';

let currentActiveElement: HTMLElement | null = null;

// --- Core Functions ---

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
  
  element.classList.add('airedactx-redacted-field');
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
};

function isEditable(el: Element | null): el is HTMLElement {
  if (!el) return false;
  const element = el as HTMLElement;
  const tagName = element.tagName.toUpperCase();
  if (tagName === 'TEXTAREA' || element.isContentEditable) return true;
  if (tagName === 'INPUT') {
      const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url'];
      return inputTypes.includes((element as HTMLInputElement).type.toLowerCase());
  }
  if (element.getAttribute('role') === 'textbox') return true;
  return false;
}

function getActiveElement(root: Document | ShadowRoot = document): Element | null {
    const activeEl = root.activeElement;
    if (!activeEl) return null;
    if (activeEl.shadowRoot) {
        return getActiveElement(activeEl.shadowRoot) || activeEl;
    }
    return activeEl;
}

// --- Event Listener Setup ---

if (!(window as any).hasAIRedactXListeners) {
  (window as any).hasAIRedactXListeners = true;

  document.addEventListener('focusin', async (event) => {
      const target = event.composedPath()[0] as HTMLElement;
      if (isEditable(target)) {
          currentActiveElement = target;
          const settings = await getSettings();
          if (settings.useAnywhereMode) {
              showRedactionUI(target, settings, () => handleRedaction(target));
          }
      }
  });

  document.addEventListener('focusout', (event) => {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (currentActiveElement && (!relatedTarget || !relatedTarget.closest('.airedactx-button-panel'))) {
        hideRedactionUI();
        currentActiveElement = null;
    }
  });
}

// CORRECTED LINE: Added the type for the 'sender' parameter.
browser.runtime.onMessage.addListener(async (message: any, sender: browser.Runtime.MessageSender) => {
  if (message.processed) return;

  if (message.command === 'redact-from-context-menu') {
    message.processed = true; 
    
    const activeElement = getActiveElement() as HTMLElement;
    if (activeElement && isEditable(activeElement)) {
      handleRedaction(activeElement);
    }
  }
  return true; 
});