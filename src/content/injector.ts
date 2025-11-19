// src/content/injector.ts
import browser from 'webextension-polyfill';
import { getRules, getSettings } from '../storage/storageManager';
import { performRedaction } from '../core/engine';
import { showRedactionUI, hideRedactionUI } from './ui-injector';
import { AppSettings } from '../types';

let currentActiveElement: HTMLElement | null = null;
let hideTimeoutId: number | null = null;

// Helper: Check if current page is allowed based on Whitelist/UseAnywhere
const isPageAllowed = (settings: AppSettings): boolean => {
  if (settings.useAnywhereMode) return true;
  
  const currentHost = window.location.hostname.toLowerCase();
  const whitelist = settings.siteWhitelist || [];
  
  // Check if hostname matches or ends with whitelisted domain
  return whitelist.some((domain: string) => {
      const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      return currentHost === cleanDomain || currentHost.endsWith('.' + cleanDomain);
  });
};

// Helper: Check if element is an editable text field
function isEditable(el: EventTarget | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tagName = el.tagName.toUpperCase();
  const isTextInput = tagName === 'INPUT' && ['text', 'email', 'password', 'search', 'tel', 'url'].includes((el as HTMLInputElement).type.toLowerCase());
  return tagName === 'TEXTAREA' || el.isContentEditable || isTextInput || el.getAttribute('role') === 'textbox';
}

// Helper: Get deep active element (piercing Shadow DOM)
function getActiveElement(root: Document | ShadowRoot = document): Element | null {
    let activeEl = root.activeElement;
    if (!activeEl) return null;
    while (activeEl && activeEl.shadowRoot) {
        const nextEl: Element | null = activeEl.shadowRoot.activeElement;
        if (nextEl) {
            activeEl = nextEl;
        } else {
            break;
        }
    }
    return activeEl;
}

const handleRedaction = async (element: HTMLElement | null) => {
  if (!element) {
    console.error("AIRedactX: Redaction called with no active element.");
    return;
  }

  // Inject styles into Shadow DOM if needed
  const rootNode = element.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    if (!rootNode.querySelector('#airedactx-styles')) {
      const styleLink = document.createElement('link');
      styleLink.id = 'airedactx-styles';
      styleLink.rel = 'stylesheet';
      styleLink.href = browser.runtime.getURL('injected-styles.css');
      rootNode.appendChild(styleLink);
    }
  }

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
  
  // Trigger input events so frameworks (React/Angular) detect the change
  element.classList.add('airedactx-redacted-field');
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
};

// Main Initialization
const init = async () => {
  // 1. Enable Context Menu Redaction Globally
  // This listener is added before checking the whitelist so it works everywhere.
  browser.runtime.onMessage.addListener(async (message: any) => {
    if (message.command === 'redact-from-context-menu') {
      const activeElement = getActiveElement() as HTMLElement;
      if (activeElement && isEditable(activeElement)) {
        handleRedaction(activeElement);
      }
    }
  });

  // 2. Check settings for Automatic UI injection (Hover Button)
  const settings = await getSettings();
  
  // STOP HERE if page is not allowed for the automatic UI
  if (!isPageAllowed(settings)) {
      return; 
  }

  // 3. Only attach Focus/Hover listeners if the site is allowed
  if (!(window as any).hasAIRedactXListeners) {
    (window as any).hasAIRedactXListeners = true;

    document.addEventListener('focusin', async (event) => {
      if (hideTimeoutId) clearTimeout(hideTimeoutId);

      const target = event.composedPath()[0] as HTMLElement;

      if (target.classList.contains('airedactx-redacted-field')) {
          target.classList.remove('airedactx-redacted-field');
      }

      if (isEditable(target)) {
        currentActiveElement = target;
        setTimeout(async () => {
          if (currentActiveElement === target) {
            // Re-fetch settings to ensure we have latest config (e.g. button position)
            const currentSettings = await getSettings(); 
            showRedactionUI(target, currentSettings, () => handleRedaction(currentActiveElement));
          }
        }, 100);
      }
    }, true);

    document.addEventListener('focusout', (event) => {
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      if (!relatedTarget || !relatedTarget.closest('.airedactx-button-panel')) {
        hideTimeoutId = window.setTimeout(() => {
          hideRedactionUI();
          currentActiveElement = null;
        }, 50);
      }
    }, true);
  }
};

init();