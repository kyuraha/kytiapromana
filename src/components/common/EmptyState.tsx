import type { ReactNode } from 'react';

export default function EmptyState({
  icon = '🗒️',
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="font-medium text-ink">{title}</p>
        {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
