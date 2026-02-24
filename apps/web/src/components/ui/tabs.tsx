import * as React from "react";

export function Tabs({ tabs, value, onChange }: { tabs: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-4 text-sm">
      {tabs.map((t) => (
        <button key={t.value} className={value === t.value ? "text-blue-600 font-medium" : "text-gray-600 hover:text-gray-900"} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
