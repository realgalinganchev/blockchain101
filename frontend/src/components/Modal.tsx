import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: React.ReactNode;
  /** extra controls next to the close button (e.g. previous / next block) */
  actions?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/** Accessible dialog: Escape and backdrop click close it, Tab stays inside, focus returns on close. */
const Modal: React.FC<ModalProps> = ({ title, actions, onClose, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="modal" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={dialogRef}>
        <header className="modal__head">
          <h2 id="modal-title" className="modal__title">{title}</h2>
          <div className="modal__actions">
            {actions}
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
