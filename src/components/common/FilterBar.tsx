import type { TrackType } from '../../lib/types';
import TrackBadge from './TrackBadge';

const OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'agile', label: 'Agile' },
  { key: 'waterfall', label: 'Waterfall' },
];

const STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'All status' },
  { key: 'planned', label: 'Planned' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
  { key: 'late', label: 'Late' },
];

export default function FilterBar({
  track,
  onTrack,
  status,
  onStatus,
}: {
  track: TrackType | 'all';
  onTrack: (t: TrackType | 'all') => void;
  status: string;
  onStatus: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((o) => {
        const val = o.key as TrackType | 'all';
        const active = track === val;
        return (
          <button
            key={o.key}
            onClick={() => onTrack(val)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
              active
                ? 'border-brand bg-brand text-white'
                : 'border-slate-200 text-slate-600 hover:border-brand/40'
            }`}
          >
            {val === 'agile' && <span>⚡</span>}
            {val === 'waterfall' && <span>📦</span>}
            {o.label}
          </button>
        );
      })}
      <div className="w-px self-stretch bg-slate-200" />
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none focus:border-brand"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
