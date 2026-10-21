// src/content/ui-injector.ts
// The floating redact button. It lives in its own closed shadow root so page CSS cannot restyle
// it, and uses fixed positioning from the field's viewport rect so it stays put inside scrolling
// composers. One panel per frame, created on first use and reused.

import browser from 'webextension-polyfill';
import { AppSettings, HoverAreaPosition } from '../types';

const EDGE_OFFSET_PX = 8;

const PANEL_CSS = `
  :host { all: initial; position: fixed; z-index: 2147483647; display: none; }
  :host([data-visible]) { display: block; }
  button {
    all: initial;
    box-sizing: border-box;
    width: 40px; height: 40px; padding: 8px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }
  button:hover { background: #ffffff; }
  img { width: 24px; height: 24px; display: block; }
`;

let host: HTMLElement | null = null;
let target: HTMLElement | null = null;
let position: HoverAreaPosition = 'bottom-right';

const createPanel = (onRedact: () => void): HTMLElement => {
  const element = document.createElement('div');
  element.setAttribute('data-airedactx', '');
  const shadow = element.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = PANEL_CSS;

  const button = document.createElement('button');
  button.type = 'button';
  button.title = 'Redact this field (AIRedactX)';
  button.setAttribute('aria-label', 'Redact this field');
  const icon = document.createElement('img');
  icon.src = browser.runtime.getURL('icons/icon-48.svg');
  icon.alt = '';
  button.appendChild(icon);

  // mousedown + preventDefault keeps focus in the field, so focusout never fires.
  button.addEventListener('mousedown', (event) => {
    event.preventDefault();
    onRedact();
  });

  shadow.append(style, button);
  return element;
};

const reposition = () => {
  if (!host || !target) return;
  const rect = target.getBoundingClientRect();
  const panel = host.getBoundingClientRect();
  const top = position.startsWith('top') ? rect.top + EDGE_OFFSET_PX : rect.bottom - panel.height - EDGE_OFFSET_PX;
  const left = position.endsWith('left') ? rect.left + EDGE_OFFSET_PX : rect.right - panel.width - EDGE_OFFSET_PX;
  host.style.top = `${Math.round(top)}px`;
  host.style.left = `${Math.round(left)}px`;
};

export const showRedactionUI = (field: HTMLElement, settings: AppSettings, onRedact: () => void) => {
  if (!host) {
    host = createPanel(onRedact);
    document.documentElement.appendChild(host);
    window.addEventListener('scroll', reposition, { capture: true, passive: true });
    window.addEventListener('resize', reposition, { passive: true });
  }
  target = field;
  position = settings.buttonPosition;
  host.setAttribute('data-visible', '');
  reposition();
};

export const hideRedactionUI = () => {
  host?.removeAttribute('data-visible');
  target = null;
};
