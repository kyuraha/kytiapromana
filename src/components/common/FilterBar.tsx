const STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'All status' },
  { key: 'planned', label: 'Planned' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
  { key: 'late', label: 'Late' },
];

export default function FilterBar({
  status,
  onStatus,
}: {
  status: string;
  onStatus: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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

