import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import type { Game } from '../../lib/types';
import { useConfirm } from '../../lib/dialogs';
import {
  useCurrentSprint,
  useDeleteGame,
  useFeatures,
  useMilestones,
  useTasks,
  useVision,
  useMetrics,
  CURRENT_YEAR,
} from '../../hooks/queries';
import { formatNumber, formatShort } from '../../lib/format';

export default function GameRow({ game }: { game: Game }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const deleteGame = useDeleteGame();
  const { data: vision } = useVision(game.id, CURRENT_YEAR);
  const { data: metrics = [] } = useMetrics(game.id);
  const { data: milestones = [] } = useMilestones(game.id);
  const { data: features = [] } = useFeatures(game.id);
  const { data: currentSprint } = useCurrentSprint(game.id);
  const { data: tasks = [] } = useTasks(game.id);

  // The "Goal" for the games-list card. Ideally it's the metric flagged as the
  // vision's north star, but nothing in the app sets `northStarId`, so fall back
  // to the first metric — otherwise this card is permanently stuck on
  // "No metric set yet" even after metrics are added.
  const goal = useMemo(() => {
    const north = vision?.northStarId
      ? metrics.find((m) => m.id === vision.northStarId)
      : null;
    return north ?? (metrics.length ? metrics[0] : null);
  }, [vision, metrics]);

  const activeMilestones = useMemo(
    () => milestones.filter((m) => m.status === 'active'),
    [milestones],
  );

  // Lead active milestone + its feature completion (mirrors the Quarter cards on
  // the Overview tab: features are "done" when the milestone itself is done).
  const leadMilestone = activeMilestones[0] ?? null;
  const leadFeatureCount = useMemo(() => {
    if (!leadMilestone) return 0;
    return features.filter((f) => f.milestoneId === leadMilestone.id).length;
  }, [leadMilestone, features]);
  const leadDone = leadMilestone?.status === 'done' ? leadFeatureCount : 0;
  const leadPct = leadFeatureCount
    ? Math.round((leadDone / leadFeatureCount) * 100)
    : 0;

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
                Active milestone
              </div>
              {activeMilestones.length > 0 ? (
                <div className="mt-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {activeMilestones[0].name}
                  </div>
                  <div className="mt-1">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>
                        {leadDone}/{leadFeatureCount} features done
                      </span>
                      <span>{leadPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.min(leadPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  {activeMilestones.length > 1 && (
                    <div className="mt-1 text-xs text-slate-500">
                      +{activeMilestones.length - 1} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-400">
                  No active milestone
                </div>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                This sprint
              </div>
              <div className="mt-1 truncate text-sm text-ink">
                {currentSprint?.goal || 'No goal set'}
              </div>
              <div className="text-xs text-slate-500">
                {doneCount} done{currentSprint ? ` · ${totalCount} total` : ''}
                {currentSprint && totalCount > 0
                  ? ` · ${Math.round((doneCount / totalCount) * 100)}%`
                  : ''}
              </div>
              {currentSprint && totalCount > 0 && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min((doneCount / totalCount) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
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
            onClick={async (e) => {
              e.stopPropagation();
              const ok = await confirm({
                title: 'Delete game',
                message: `Delete "${game.name}" and all its data? This cannot be undone.`,
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel',
                danger: true,
              });
              if (ok) deleteGame.mutate(game.id);
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
