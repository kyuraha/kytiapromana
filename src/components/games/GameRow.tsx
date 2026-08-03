import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import type { Game } from '../../lib/types';
import {
  useCurrentSprint,
  useDeleteGame,
  useMilestones,
  useTasks,
  useVision,
  useMetrics,
  CURRENT_YEAR,
} from '../../hooks/queries';
import { formatNumber, formatShort } from '../../lib/format';

export default function GameRow({ game }: { game: Game }) {
  const navigate = useNavigate();
  const deleteGame = useDeleteGame();
  const { data: vision } = useVision(game.id, CURRENT_YEAR);
  const { data: metrics = [] } = useMetrics(game.id);
  const { data: milestones = [] } = useMilestones(game.id);
  const { data: currentSprint } = useCurrentSprint(game.id);
  const { data: tasks = [] } = useTasks(game.id);

  const goal = useMemo(() => {
    if (!vision?.northStarId) return null;
    return metrics.find((m) => m.id === vision.northStarId) ?? null;
  }, [vision, metrics]);

  const activeMilestones = useMemo(
    () => milestones.filter((m) => m.status === 'active').length,
    [milestones],
  );

  const sprintTasks = useMemo(() => {
    if (!currentSprint) return [];
    return tasks.filter((t) => t.sprintId === currentSprint.id);
  }, [currentSprint, tasks]);
  const doneCount = sprintTasks.filter((t) => t.status === 'done').length;
  const totalCount = sprintTasks.length;

  const trendIcon =
    goal?.trend === 'up' ? (
      <span className="text-emerald-600">↑</span>
    ) : goal?.trend === 'down' ? (
      <span className="text-rose-600">↓</span>
    ) : (
      <span className="text-slate-400">→</span>
    );

  return (
    <div
      onClick={() => navigate(`/games/${game.id}`)}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand/30 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: game.color + '1a' }}
        >
          {game.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink">{game.name}</h3>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: game.color }}
            />
          </div>
          <p className="truncate text-sm text-slate-400">{game.description}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Goal
              </div>
              {goal ? (
                <div className="mt-1">
                  <div className="text-sm font-bold text-ink">{goal.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatNumber(goal.current)}{' '}
                    <span className="text-slate-300">/</span>{' '}
                    <span className="font-semibold text-brand">
                      {formatNumber(goal.target)}
                    </span>{' '}
                    {goal.unit} {trendIcon}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-400">
                  No metric set yet
                </div>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Now
              </div>
              <div className="mt-1 text-sm text-ink">
                Q1 · {currentSprint ? `Sprint #${currentSprint.number}` : '—'}
              </div>
              <div className="text-xs text-slate-500">
                {activeMilestones > 0
                  ? `${activeMilestones} active milestone${activeMilestones > 1 ? 's' : ''}`
                  : 'no active milestone'}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                This week
              </div>
              <div className="mt-1 truncate text-sm text-ink">
                {currentSprint?.goal || 'No goal set'}
              </div>
              <div className="text-xs text-slate-500">
                {doneCount} done{currentSprint ? ` · ${totalCount} total` : ''}
              </div>
            </div>
          </div>

          {currentSprint && (
            <div className="mt-2 text-xs text-slate-400">
              {formatShort(currentSprint.startDate)} –{' '}
              {formatShort(currentSprint.endDate)}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${game.name}" and all its data?`)) {
                deleteGame.mutate(game.id);
              }
            }}
            className="rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
            title="Delete game"
          >
            <Trash2 size={16} />
          </button>
          <Link
            to={`/games/${game.id}`}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-brand/5 hover:text-brand group-hover:opacity-100"
            title="Open"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
