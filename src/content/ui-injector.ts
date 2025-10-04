// src/content/ui-injector.ts
import { AppSettings } from '../types';

let buttonPanel: HTMLDivElement | null = null;

// ... (createButtonPanel function remains the same)
const createButtonPanel = (onRedact: () => void): HTMLDivElement => {
    const panel = document.createElement('div');
    panel.className = 'airedactx-button-panel';
    const redactButton = document.createElement('button');
    redactButton.className = 'airedactx-button';
    redactButton.innerText = 'Redact';
    panel.appendChild(redactButton);
    redactButton.onclick = (e) => {
        e.stopPropagation();
        onRedact();
    };
    return panel;
};


const positionPanel = (target: HTMLElement, position: AppSettings['hoverAreaPosition']) => {
    if (!buttonPanel) return;

    const rect = target.getBoundingClientRect();
    // Re-measure the panel's size AFTER it has been styled by CSS.
    const panelRect = buttonPanel.getBoundingClientRect(); 
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const offset = 8; // A slightly larger offset for better appearance

    let top = 0;
    let left = 0;

    switch (position) {
        case 'top-left':
            top = rect.top + scrollY + offset;
            left = rect.left + scrollX + offset;
            break;
        case 'bottom-left':
            top = rect.bottom + scrollY - panelRect.height - offset;
            left = rect.left + scrollX + offset;
            break;
        case 'top-right':
            top = rect.top + scrollY + offset;
            left = rect.right + scrollX - panelRect.width - offset;
            break;
        case 'bottom-right':
        default:
            // CORRECTED LOGIC
            top = rect.bottom + scrollY - panelRect.height - offset;
            left = rect.right + scrollX - panelRect.width - offset;
            break;
    }

    buttonPanel.style.top = `${top}px`;
    buttonPanel.style.left = `${left}px`;
};

export const showRedactionUI = (targetElement: HTMLElement, settings: AppSettings, onRedact: () => void) => {
    if (!buttonPanel) {
        buttonPanel = createButtonPanel(onRedact);
        document.body.appendChild(buttonPanel);
    }
    
    // It's important to make the panel visible BEFORE positioning it,
    // so we can measure its dimensions accurately.
    buttonPanel.style.visibility = 'visible';
    positionPanel(targetElement, settings.hoverAreaPosition);
};

export const hideRedactionUI = () => {
    if (buttonPanel) {
        // Instead of removing the button, just hide it. This is more efficient.
        buttonPanel.style.visibility = 'hidden';
    }
};