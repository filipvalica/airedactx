// src/content/injector.ts
// Content script, injected on every page. It stays passive until the user acts: it never reads
// a field until a redact button or the context menu is used, and it never sends anything anywhere.

import browser from 'webextension-polyfill';
import { getRules, getSettings } from '../storage/storageManager';
import { performRedaction } from '../core/engine';
import { showRedactionUI, hideRedactionUI } from './ui-injector';
import { REDACT_COMMAND } from '../types';
import { isPageAllowed } from '../core/siteAllow';

const REDACTED_CLASS = 'airedactx-redacted-field';
const HIGHLIGHT_ATTR = 'data-airedactx-highlight';
const TEXT_INPUT_TYPES = ['text', 'email', 'search', 'tel', 'url'];
const SHOW_DELAY_MS = 100;
const HIDE_DELAY_MS = 50;

declare global {
  interface Window {
    __airedactxLoaded?: boolean;
  }
}

const isTextField = (el: Element): el is HTMLInputElement | HTMLTextAreaElement =>
  el instanceof HTMLTextAreaElement ||
  (el instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(el.type.toLowerCase()));

const isEditable = (el: EventTarget | null): el is HTMLElement =>
  el instanceof HTMLElement && (isTextField(el) || el.isContentEditable || el.getAttribute('role') === 'textbox');

/** document.activeElement, following open shadow roots down to the real focused element. */
const getDeepActiveElement = (): Element | null => {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
};

/**
 * Write a value the way a user typing would, so page frameworks notice it.
 * React overrides the value setter on inputs, so a plain `el.value = x` is invisible to it;
 * going through the prototype setter and firing an InputEvent is the documented workaround.
 */
const setFieldValue = (el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};

/**
 * Rich editors (ProseMirror, Lexical, Quill: ChatGPT, Claude, Gemini) keep their own model and
 * ignore direct DOM writes. Replacing the selection with execCommand goes through their input
 * handling. Fall back to a direct write for plain contenteditable elements.
 */
const setEditableText = (el: HTMLElement, value: string) => {
  el.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection?.removeAllRanges();
  selection?.addRange(range);

  const inserted = document.execCommand('insertText', false, value);
  // Editors render inserted newlines as blocks or <br>, so innerText can differ from the value
  // in whitespace only. Compare with whitespace collapsed; a false mismatch here would run the
  // direct write that desyncs rich editors.
  const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();
  if (!inserted || collapse(el.innerText ?? el.textContent ?? '') !== collapse(value)) {
    el.innerText = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }
};

/** The highlight class is page CSS; a field inside a shadow root needs the stylesheet there too. */
const ensureHighlightStyles = (el: HTMLElement) => {
  const root = el.getRootNode();
  if (!(root instanceof ShadowRoot) || root.querySelector('#airedactx-styles')) return;
  const link = document.createElement('link');
  link.id = 'airedactx-styles';
  link.rel = 'stylesheet';
  link.href = browser.runtime.getURL('injected-styles.css');
  root.appendChild(link);
};

const redactElement = async (el: HTMLElement | null) => {
  if (!el) return;
  const [rules, settings] = await Promise.all([getRules(), getSettings()]);

  if (isTextField(el)) {
    setFieldValue(el, performRedaction(el.value, rules, settings));
  } else if (el.isContentEditable) {
    setEditableText(el, performRedaction(el.innerText ?? el.textContent ?? '', rules, settings));
  } else {
    return;
  }

  if (settings.highlightStyle === 'none') return;
  ensureHighlightStyles(el);
  el.setAttribute(HIGHLIGHT_ATTR, settings.highlightStyle);
  el.classList.add(REDACTED_CLASS);
};

const init = () => {
  // Guard against double injection (manifest plus the background's executeScript fallback).
  if (window.__airedactxLoaded) return;
  window.__airedactxLoaded = true;

  browser.runtime.onMessage.addListener((message: unknown) => {
    if ((message as { command?: string })?.command !== REDACT_COMMAND) return;
    const active = getDeepActiveElement();
    if (isEditable(active)) void redactElement(active);
  });

  let focused: HTMLElement | null = null;
  let hideTimer: number | undefined;

  document.addEventListener(
    'focusin',
    (event) => {
      window.clearTimeout(hideTimer);
      const target = event.composedPath()[0];
      if (!isEditable(target)) return;
      target.classList.remove(REDACTED_CLASS);
      target.removeAttribute(HIGHLIGHT_ATTR);
      focused = target;

      // Settings are read on every focus so the allowed list and button position apply
      // without a page reload.
      window.setTimeout(async () => {
        if (focused !== target) return;
        const settings = await getSettings();
        if (!isPageAllowed(settings, window.location.hostname)) return;
        showRedactionUI(target, settings, () => void redactElement(focused));
      }, SHOW_DELAY_MS);
    },
    true,
  );

  document.addEventListener(
    'focusout',
    () => {
      hideTimer = window.setTimeout(() => {
        hideRedactionUI();
        focused = null;
      }, HIDE_DELAY_MS);
    },
    true,
  );
};

init();
