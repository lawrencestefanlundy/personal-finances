'use client';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthPickerProps {
  label: string;
  selected: number[];
  onChange: (months: number[]) => void;
}

export default function MonthPicker({ label, selected, onChange }: MonthPickerProps) {
  const toggle = (month: number) => {
    if (selected.includes(month)) {
      onChange(selected.filter((m) => m !== month));
    } else {
      onChange([...selected, month].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="grid grid-cols-6 gap-1.5">
        {MONTHS.map((name, i) => {
          const monthNum = i + 1;
          const active = selected.includes(monthNum);
          return (
            <button
              key={monthNum}
              type="button"
              onClick={() => toggle(monthNum)}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
