import React from 'react';

// Circular progress ring showing the resume ↔ JD match score (0-100).
const ScoreCard: React.FC<{ score: number; label: string }> = ({ score, label }) => {
  const clamped = Math.max(0, Math.min(100, score));
  const R = 34;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - clamped / 100);
  const color =
    clamped >= 75 ? 'text-emerald-500' : clamped >= 50 ? 'text-amber-500' : 'text-rose-500';
  const badge =
    clamped >= 75
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : clamped >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className={`flex items-center gap-5 p-5 rounded-2xl border ${badge} mb-8 animate-in fade-in zoom-in-95 duration-300`}>
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r={R} fill="none" strokeWidth="8" className="stroke-white" />
          <circle
            cx="40" cy="40" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
            className={`${color} stroke-current transition-all duration-700`}
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-black text-xl ${color}`}>
          {clamped}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</div>
        <div className="text-2xl font-black">{clamped} / 100</div>
      </div>
    </div>
  );
};

export default ScoreCard;
