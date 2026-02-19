'use client';

import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';

interface EditableCellProps {
  value: number;
  onSave: (value: number) => void;
  className?: string;
}

export default function EditableCell({ value, onSave, className = '' }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleClick = () => {
    setEditValue(String(value));
    setEditing(true);
  };

  const handleSave = () => {
    const num = parseFloat(editValue.replace(/[,£]/g, ''));
    if (!isNaN(num) && num !== value) {
      onSave(num);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-1 py-0.5 text-right text-xs border border-blue-400 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`cursor-pointer hover:bg-blue-50 rounded text-xs text-right block ${className}`}
      title="Click to edit"
    >
      {formatCurrency(value)}
    </span>
  );
}
