import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

// Dialog frame shared by every modal: dimmed backdrop, 20px-radius surface
// panel (FAB Trades' dialog shape), Escape and backdrop click to close.
export function Modal({
  onClose,
  children,
  width = "max-w-md",
  z = "z-50",
  label,
  className = "",
}: {
  onClose: () => void;
  children: ReactNode;
  width?: string;
  z?: string;
  label?: string;
  className?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 ${z} flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-4`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`modal-in relative w-full ${width} bg-surface border border-line rounded-xl shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalClose({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={`inline-grid place-items-center w-9 h-9 rounded-md text-muted hover:text-fg hover:bg-sunken transition-colors shrink-0 ${className}`}
    >
      <CloseIcon size={18} />
    </button>
  );
}
