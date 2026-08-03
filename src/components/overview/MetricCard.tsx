import { useState } from 'react';
import { Star } from 'lucide-react';
import type { Metric } from '../../lib/types';
import { formatNumber } from '../../lib/format';

// Tiny inline sparkline rendered with SVG polygons from the metric history.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-8 text-xs text-slate-300">not enough data</div>;
  }
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 3 - ((v - min) / range) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="#6366f1"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={w}
        cy={h - 3 - ((values[values.length - 1] - min) / range) * (h - 6)}
        r={2.5}
        fill="#6366f1"
      />
    </svg>
  );
}

export default function MetricCard({
  metric,
  isNorthStar,
  contributors,
  onUpdateCurrent,
}: {
  metric: Metric;
  isNorthStar: boolean;
  contributors: string[];
  onUpdateCurrent: (metric: Metric, value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(metric.current));

  const save = () => {
    const num = Number(val);
    if (!Number.isNaN(num)) onUpdateCurrent(metric, num);
    setEditing(false);
  };

  const pct = metric.target !== 0 ? (metric.current / metric.target) * 100 : 0;
  const trendIcon =
    metric.trend === 'up' ? (
      <span className="text-emerald-600">↑</span>
    ) : metric.trend === 'down' ? (
      <span className="text-rose-600">↓</span>
    ) : (
      <span className="text-slate-400">→</span>
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-ink">{metric.name}</span>
          {isNorthStar && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
              title="North star metric"
            >
              <Star size={10} fill="currentColor" /> NORTH STAR
            </span>
          )}
        </div>
        <span className="text-base leading-none">{trendIcon}</span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            {editing ? (
              <input
                autoFocus
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className="w-28 rounded-lg border border-brand px-2 py-1 text-xl font-bold text-ink outline-none"
              />
            ) : (
              <button
                onClick={() => {
                  setVal(String(metric.current));
                  setEditing(true);
                }}
                className="text-2xl font-bold text-ink hover:text-brand"
                title="Click to update current value"
              >
                {formatNumber(metric.current)}
              </button>
            )}
            <span className="text-sm text-ink-light">{metric.unit}</span>
          </div>
          <div className="text-xs text-slate-400">
            target: <span className="font-semibold text-brand">{formatNumber(metric.target)}</span>{' '}
            {metric.unit}
          </div>
        </div>
        <Sparkline values={metric.history.map((h) => h.value)} />
      </div>

      <div className="mt-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {Math.round(pct)}% of goal
          </span>
        </div>
      </div>

      {contributors.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Contributors
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {contributors.map((c, i) => (
              <span
                key={i}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
