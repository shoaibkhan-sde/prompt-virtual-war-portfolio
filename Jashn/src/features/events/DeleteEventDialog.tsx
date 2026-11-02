'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteEventDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement>;
  eventName: string;
  onConfirmDelete: () => void;
}

export const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({
  dialogRef,
  eventName,
  onConfirmDelete,
}) => {
  return (
    <dialog
      ref={dialogRef}
      className="p-0 rounded-2xl bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-[calc(100vw-32px)] backdrop:bg-slate-950/60"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Delete Event</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">&ldquo;{eventName}&rdquo;</strong> and its checklist, budget envelopes, and vendor assignments?
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              onConfirmDelete();
            }}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-xs"
          >
            Delete Event
          </button>
        </div>
      </div>
    </dialog>
  );
};
