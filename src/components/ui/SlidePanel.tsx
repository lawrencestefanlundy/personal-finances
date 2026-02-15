'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './Icons';

// Module-level counter to track how many panels are open.
// Only reset body overflow when all panels are closed.
let openPanelCount = 0;

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  useEffect(() => {
    if (open) {
      openPanelCount++;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (open) {
        openPanelCount--;
        if (openPanelCount <= 0) {
          openPanelCount = 0; // guard against negative
          document.body.style.overflow = '';
        }
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 transition-opacity" onClick={onClose} />
      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
