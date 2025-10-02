// src/content/injector.ts
import browser from 'webextension-polyfill';
import { getRules, getSettings } from '../storage/storageManager';
import { performRedaction } from '../core/engine';
import { showRedactionUI, hideRedactionUI } from './ui-injector';

console.log('AIRedactX content script loaded.');

let currentActiveElement: HTMLElement | null = null;

const handleRedaction = async (element: HTMLElement) => {
    const rules = await getRules();
    const settings = await getSettings();
    let textToRedact = '';

    if (element.tagName === 'TEXTAREA') {
        textToRedact = (element as HTMLTextAreaElement).value;
    } else {
        textToRedact = element.innerText;
    }

    const redactedText = performRedaction(textToRedact, rules, settings);

    if (element.tagName === 'TEXTAREA') {
        (element as HTMLTextAreaElement).value = redactedText;
    } else {
        element.innerText = redactedText;
    }
};

browser.runtime.onMessage.addListener(async (message: any) => {
  if (message.command === 'redact-from-context-menu') {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && isEditable(activeElement)) {
        handleRedaction(activeElement);
    }
  }
});

/**
 * Recursively finds the currently focused element, traversing through shadow DOMs.
 * @param root The starting node (usually document or a shadowRoot).
 * @returns The deeply active element, or null if none is found.
 */
function findActiveElement(root: Document | ShadowRoot): Element | null {
    const activeEl = root.activeElement;
    if (!activeEl) {
        return null;
    }
    if (activeEl.shadowRoot) {
        return findActiveElement(activeEl.shadowRoot) || activeEl;
    }
    return activeEl;
}

/**
 * Checks if a given element is an editable field we can interact with.
 * @param el The element to check.
 * @returns True if the element is a textarea or contenteditable.
 */
function isEditable(el: Element | null): el is HTMLElement {
    if (!el) return false;
    const tagName = el.tagName.toUpperCase();
    if (tagName === 'TEXTAREA') return true;
    if ((el as HTMLElement).isContentEditable) return true;
    return false;
}

document.addEventListener('focusin', () => {
    // A short delay is needed to ensure the DOM is settled and the activeElement is correctly reported.
    setTimeout(async () => {
        const activeElement = findActiveElement(document) as HTMLElement | null;

        if (isEditable(activeElement)) {
            if (activeElement === currentActiveElement) return; // Already handled.

            currentActiveElement = activeElement;
            const settings = await getSettings();
            if (settings.useAnywhereMode) {
                showRedactionUI(activeElement, settings, () => handleRedaction(activeElement!));
            }
        }
    }, 100); // 100ms delay to handle complex UI updates.
});

document.addEventListener('focusout', (event) => {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (currentActiveElement && (!relatedTarget || !relatedTarget.closest('.airedactx-button-panel'))) {
        hideRedactionUI();
        currentActiveElement = null;
    }
});