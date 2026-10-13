import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { getDialogOpener } from "../dialog-focus";

export function useDialogDismiss(onClose: () => void) {
  const startedOutside = useRef(false);
  function outside(
    event: PointerEvent<HTMLDialogElement> | MouseEvent<HTMLDialogElement>,
  ) {
    if (event.target !== event.currentTarget) return false;
    const rect = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }
  return {
    onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
      startedOutside.current =
        event.isPrimary && event.button === 0 && outside(event);
    },
    onPointerCancel: () => {
      startedOutside.current = false;
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      const dismiss = startedOutside.current && outside(event);
      startedOutside.current = false;
      if (dismiss) onClose();
    },
  };
}

export function trapDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab" || event.defaultPrevented) return;
  const dialog = event.currentTarget;
  if ((event.target as HTMLElement).closest("dialog") !== dialog) return;
  const controls = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, a[href], summary, [tabindex], [contenteditable="true"]',
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      element.getClientRects().length > 0 &&
      element.closest("dialog") === dialog,
  );
  const first = controls[0],
    last = controls.at(-1);
  if (!first) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last!.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function FileExportErrors() {
  const [error, setError] = useState("");
  useEffect(() => {
    const report = (event: Event) =>
      setError(String((event as CustomEvent).detail));
    window.addEventListener("slate-file-error", report);
    return () => window.removeEventListener("slate-file-error", report);
  }, []);
  return error ? (
    <Modal title="Export failed" onClose={() => setError("")}>
      <p role="alert">{error}</p>
      <p>
        Your campaign is still on this device. Try saving or sharing the export
        again.
      </p>
    </Modal>
  ) : null;
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
  actions,
  dismissible = true,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  actions?: ReactNode;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const dismiss = useDialogDismiss(() => {
    if (dismissible) onClose();
  });
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const opener = getDialogOpener();
    dialog.showModal();
    return () => {
      dialog.close();
      requestAnimationFrame(() => {
        if (!dialog.isConnected && opener?.isConnected) opener.focus();
      });
    };
  }, []);
  return createPortal(
    <dialog
      {...dismiss}
      ref={ref}
      className={wide ? "modal modal-wide" : "modal"}
      aria-labelledby={titleId}
      onKeyDown={trapDialogFocus}
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        if (!dismissible) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={(event) => {
        // StrictMode cleanup queues a close event before the dialog reopens.
        if (event.target === event.currentTarget && !event.currentTarget.open)
          onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <div className="toolbar-actions">
          {actions}
          <button
            className="icon-button"
            aria-label="Close dialog"
            disabled={!dismissible}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
