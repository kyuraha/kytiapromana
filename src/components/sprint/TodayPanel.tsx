import { useState } from 'react';
import { Star } from 'lucide-react';
import { useTodayTasks } from '../../hooks/useToday';
import { useToggleDone } from '../../hooks/queries';
import TrackBadge from '../common/TrackBadge';
import { todayDayName } from '../../lib/format';

/**
 * Cross-game Today panel. Lists every task scheduled for today across all games.
 * Check an item → mark done (optimistic). A small "focus" selector highlights
 * up to 3 must-do items.
 */
export default function TodayPanel() {
  const { data: items = [] } = useTodayTasks();
  const today = todayDayName();
  const [focus, setFocus] = useState<Set<string>>(new Set());
  const toggleDone = useToggleDoneForToday();

  const toggleFocus = (id: string) => {
    setFocus((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const done = items.filter((it) => it.task.status === 'done').length;
  const pending = items.length - done;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            Today{' '}
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {today}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            All games · {pending} pending · {done} done
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Star size={13} className="text-amber-400" />
          <span>Tap to focus up to 3 must-do items</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          Nothing scheduled for today. Drag a task onto today in the Day view above.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map(({ task, game, feature }) => {
            const isFocus = focus.has(task.id);
            return (
              <li
                key={task.id}
                className={`flex items-center gap-3 px-5 py-3 transition ${
                  isFocus ? 'bg-amber-50/60' : ''
                }`}
              >
                <button
                  onClick={() => toggleDone.mutate(task.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    task.status === 'done'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 hover:border-brand'
                  }`}
                  title="Mark done"
                >
                  {task.status === 'done' && '✓'}
                </button>

                <button
                  onClick={() => toggleFocus(task.id)}
                  className={`shrink-0 text-lg ${isFocus ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}
                  title="Focus"
                >
                  <Star size={16} fill={isFocus ? 'currentColor' : 'none'} />
                </button>

                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                  style={{ backgroundColor: game.color + '1a' }}
                  title={game.name}
                >
                  {game.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-ink'}`}
                  >
                    {task.title}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {game.name}
                    {feature ? ` · ${feature.name}` : ''}
                  </span>
                </div>

                {feature && <TrackBadge trackType={feature.trackType} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// toggleDone needs a gameId; here we tell the server to toggle and invalidate
// all game caches by re-using whichever id — the hook invalidates globally.
function useToggleDoneForToday() {
  const toggle = useToggleDone('__all__');
  return toggle;
}
