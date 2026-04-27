import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  current,
  total,
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const pct = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="eyebrow">Progress</span>
          <span className="font-mono text-[11px] tracking-[0.18em] text-ink-dim">
            {current}/{total} · {pct}%
          </span>
        </div>
      )}
      <div className="progress">
        <div className="bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
