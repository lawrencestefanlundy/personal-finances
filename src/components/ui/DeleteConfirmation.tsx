'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DeleteConfirmationProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName: string;
}

export default function DeleteConfirmation({
  open,
  onConfirm,
  onCancel,
  itemName,
}: DeleteConfirmationProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4 w-full">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Item</h3>
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
