/// <reference lib="dom" />

import { AppSettings } from '../types';

let buttonPanel: HTMLDivElement | null = null;

const createButtonPanel = (onRedact: () => void): HTMLDivElement => {
    const panel = document.createElement('div');
    panel.className = 'airedactx-button-panel';
    panel.style.visibility = 'hidden'; 
    panel.style.position = 'absolute'; 
    panel.style.zIndex = '2147483647';

    const redactButton = document.createElement('button');
    redactButton.className = 'airedactx-button';
    redactButton.innerText = 'Redact';
    panel.appendChild(redactButton);

    redactButton.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault(); 
        onRedact();
    });

    return panel;
};

const positionPanel = (target: HTMLElement, position: AppSettings['hoverAreaPosition']) => {
    if (!buttonPanel) return;

    buttonPanel.style.opacity = '0';
    buttonPanel.style.visibility = 'visible';
    buttonPanel.style.top = '-9999px';
    buttonPanel.style.left = '-9999px';

    const targetRect = target.getBoundingClientRect();
    const panelRect = buttonPanel.getBoundingClientRect(); 
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const offset = 8;

    let top = 0;
    let left = 0;

    switch (position) {
        case 'top-left':
            top = targetRect.top + scrollY + offset;
            left = targetRect.left + scrollX + offset;
            break;
        case 'top-right':
            top = targetRect.top + scrollY + offset;
            left = targetRect.right + scrollX - panelRect.width - offset;
            break;
        case 'bottom-left':
            top = targetRect.bottom + scrollY - panelRect.height - offset;
            left = targetRect.left + scrollX + offset;
            break;
        case 'bottom-right':
        default:
            top = targetRect.bottom + scrollY - panelRect.height - offset;
            left = targetRect.right + scrollX - panelRect.width - offset;
            break;
    }

    buttonPanel.style.top = `${top}px`;
    buttonPanel.style.left = `${left}px`;
    
    buttonPanel.style.opacity = '1';
};

export const showRedactionUI = (targetElement: HTMLElement, settings: AppSettings, onRedact: () => void) => {
    if (!buttonPanel) {
        buttonPanel = createButtonPanel(onRedact);
        document.body.appendChild(buttonPanel);
    }
    
    positionPanel(targetElement, settings.hoverAreaPosition);
};

export const hideRedactionUI = () => {
    if (buttonPanel) {
        buttonPanel.style.visibility = 'hidden';
    }
};