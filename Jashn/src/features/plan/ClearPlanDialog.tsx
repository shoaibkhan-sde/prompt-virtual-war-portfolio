'use client';

import React from 'react';

interface ClearPlanDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement>;
  onConfirmClear: () => void;
}

export const ClearPlanDialog: React.FC<ClearPlanDialogProps> = ({
  dialogRef,
  onConfirmClear,
}) => {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="clear-dialog-title"
      className="p-6 rounded-2xl bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full backdrop:bg-black/60"
    >
      <h3 id="clear-dialog-title" className="text-base font-bold mb-2">
        Clear current celebration plan?
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
        This will clear this plan from the &ldquo;Start a new plan&rdquo; workspace. Your event and progress will still remain safely stored and accessible anytime under <strong className="text-slate-900 dark:text-white font-semibold">&ldquo;Events&rdquo;</strong>.
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            dialogRef.current?.close();
            onConfirmClear();
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
        >
          Clear Plan
        </button>
      </div>
    </dialog>
  );
};

export default ClearPlanDialog;
