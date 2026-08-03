import { Check, Trash2 } from 'lucide-react';
import type { Feature, Task } from '../../lib/types';
import TrackBadge from '../common/TrackBadge';

export default function TaskCard({
  task,
  feature,
  compact = false,
  onToggle,
  onDelete,
}: {
  task: Task;
  feature?: Feature;
  compact?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusColor =
    task.status === 'done'
      ? 'border-l-emerald-500'
      : task.status === 'doing'
        ? 'border-l-amber-400'
        : 'border-l-slate-300';

  return (
    <div
      className={`group cursor-grab rounded-lg border border-slate-200 border-l-4 bg-white p-2 shadow-sm transition hover:shadow ${
        task.isBacklog ? 'opacity-70' : ''
      } ${statusColor}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
            task.status === 'done'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 hover:border-brand'
          }`}
          title={task.status === 'done' ? 'Mark todo' : 'Mark done'}
        >
          {task.status === 'done' && <Check size={11} />}
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm leading-snug ${
              task.status === 'done'
                ? 'text-slate-400 line-through'
                : 'text-ink'
            }`}
          >
            {task.title}
          </p>
          {!compact && feature && (
            <div className="mt-1 flex items-center gap-1">
              <TrackBadge trackType={feature.trackType} />
              {task.day && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {task.day}
                </span>
              )}
              {task.note && (
                <span className="truncate text-xs text-amber-600" title={task.note}>
                  ⚠ note
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="shrink-0 rounded p-0.5 text-slate-200 hover:bg-rose-50 hover:text-rose-500 group-hover:text-slate-300"
          title="Delete task"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
