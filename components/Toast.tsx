import React from 'react';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

const STYLES: Record<ToastItem['type'], string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
  info: 'bg-gray-900/90 text-white',
};

const ICONS: Record<ToastItem['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

// Presentational toast stack. Lifetime is managed by the caller (App).
const Toasts: React.FC<{ items: ToastItem[] }> = ({ items }) => {
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`${STYLES[t.type]} w-fit max-w-full px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200`}
        >
          <span className="text-xs opacity-80">{ICONS[t.type]}</span>
          <span className="truncate">{t.text}</span>
        </div>
      ))}
    </div>
  );
};

export default Toasts;
