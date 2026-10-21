// src/ui/components/Dialog.tsx
// One modal for every confirmation and notice in the options page, on the native <dialog>
// element so focus trapping, Escape and the backdrop come from the browser. useDialog holds
// the state; render <Dialog> once per panel and call notify() or confirm() from handlers.
import React, { useEffect, useRef, useState } from 'react';

export interface DialogButton {
  label: string;
  onClick?: () => void;
  kind?: 'primary' | 'danger';
  /** Receives focus when the dialog opens, so Enter triggers it. Defaults to the last button. */
  focus?: boolean;
}

export interface DialogState {
  title: string;
  /** Plain text; line breaks are kept. */
  message: string;
  /** Rendered left to right; the last one is the default action. */
  buttons: DialogButton[];
}

export const useDialog = () => {
  const [state, setState] = useState<DialogState | null>(null);
  const close = () => setState(null);

  const notify = (title: string, message: string) =>
    setState({ title, message, buttons: [{ label: 'OK', kind: 'primary' }] });

  const confirm = (title: string, message: string, confirmLabel: string, onConfirm: () => void) =>
    setState({
      title,
      message,
      // Enter must never destroy anything: focus starts on Cancel.
      buttons: [
        { label: 'Cancel', focus: true },
        { label: confirmLabel, kind: 'danger', onClick: onConfirm },
      ],
    });

  return { state, show: setState, notify, confirm, close };
};

interface DialogProps {
  state: DialogState | null;
  onClose: () => void;
}

export const Dialog: React.FC<DialogProps> = ({ state, onClose }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (state && !element.open) element.showModal();
    if (!state && element.open) element.close();
  }, [state]);

  // Close first, then run the action: an action may open the next dialog (import then its
  // summary), and the later state update must win.
  const press = (button: DialogButton) => {
    onClose();
    button.onClick?.();
  };

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dialog-title">
      {state && (
        <>
          <h2 id="dialog-title" className="dialog-title">
            {state.title}
          </h2>
          <p className="dialog-message">{state.message}</p>
          <div className="dialog-buttons">
            {state.buttons.map((button) => (
              <button
                key={button.label}
                type="button"
                className={`dialog-button ${button.kind ?? ''}`}
                onClick={() => press(button)}
                autoFocus={
                  state.buttons.some((b) => b.focus) ? button.focus : button === state.buttons[state.buttons.length - 1]
                }
              >
                {button.label}
              </button>
            ))}
          </div>
        </>
      )}
    </dialog>
  );
};
