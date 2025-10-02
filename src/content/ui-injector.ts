// src/content/ui-injector.ts
import { AppSettings } from '../types';

let buttonPanel: HTMLDivElement | null = null;

const createButtonPanel = (targetElement: HTMLElement, onRedact: () => void): HTMLDivElement => {
    const panel = document.createElement('div');
    panel.className = 'airedactx-button-panel';

    const redactButton = document.createElement('button');
    redactButton.innerText = 'Redact';
    redactButton.className = 'airedactx-button';
    redactButton.onclick = (e) => {
        e.stopPropagation();
        onRedact();
    };

    panel.appendChild(redactButton);
    return panel;
};

export const showRedactionUI = (targetElement: HTMLElement, settings: AppSettings, onRedact: () => void) => {
    if (buttonPanel) {
        buttonPanel.remove();
    }

    buttonPanel = createButtonPanel(targetElement, onRedact);
    document.body.appendChild(buttonPanel);
    positionPanel(targetElement, settings.hoverAreaPosition);
};

export const hideRedactionUI = () => {
    if (buttonPanel) {
        buttonPanel.remove();
        buttonPanel = null;
    }
};

const positionPanel = (target: HTMLElement, position: AppSettings['hoverAreaPosition']) => {
    if (!buttonPanel) return;
    const rect = target.getBoundingClientRect();
    const panelRect = buttonPanel.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    switch (position) {
        case 'top-left':
            top = rect.top + scrollY + 5;
            left = rect.left + scrollX + 5;
            break;
        case 'top-right':
            top = rect.top + scrollY + 5;
            left = rect.right + scrollX - panelRect.width - 5;
            break;
        case 'bottom-left':
            top = rect.bottom + scrollY - panelRect.height - 5;
            left = rect.left + scrollX + 5;
            break;
        case 'bottom-right':
            top = rect.bottom + scrollY - panelRect.height - 5;
            left = rect.right + scrollX - panelRect.width - 5;
            break;
    }

    buttonPanel.style.top = `${top}px`;
    buttonPanel.style.left = `${left}px`;
};