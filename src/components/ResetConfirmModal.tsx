import React, { useEffect, useRef } from "react";

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal dialog confirming ledger reset with focus trap.
 * Auto-focuses the Cancel button on open and returns focus on close.
 */
export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ onConfirm, onCancel }) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the Cancel button on mount (safer default)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Simple focus trap between the two buttons
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Escape") {
      onCancel();
      return;
    }
    if (e.key === "Tab") {
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
      onKeyDown={handleKeyDown}
    >
      <div className="ledger-card max-w-md w-full p-6 space-y-6 border border-rose-500/25 bg-surface shadow-2xl shadow-rose-950/20">
        <div className="space-y-2 text-center sm:text-left">
          <h3 id="reset-confirm-title" className="text-lg font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-rose-500">⚠️</span> Reset Account Ledger?
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            This action is permanent. It will delete your profile preferences, target budget goals, and erase all logged carbon transaction history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="ledger-btn-secondary py-2 text-xs min-h-[44px]"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={() => {
              onCancel();
              onConfirm();
            }}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-5 py-2 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs min-h-[44px]"
          >
            Reset Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmModal;
