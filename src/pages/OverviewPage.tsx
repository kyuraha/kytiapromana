import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import {
  useAddMetric,
  useCurrentSprint,
  useEnsureVision,
  useFeatures,
  useGame,
  useMetrics,
  useMilestones,
  useTasks,
  useUpdateMetric,
  useVision,
  CURRENT_YEAR,
} from '../hooks/queries';
import MetricCard from '../components/overview/MetricCard';
import TrackBadge from '../components/common/TrackBadge';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { formatShort } from '../lib/format';

function AddMetricModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (d: { name: string; unit: string; target: number }) => void;
}) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [target, setTarget] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add metric"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ name, unit, target: Number(target) || 0 });
              setName('');
              setUnit('');
              setTarget('');
              onClose();
            }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Add metric
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-ink">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Daily Active Users"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink">Unit</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="users, R$, %…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink">Target (goal)</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            type="number"
            placeholder="10000"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>
    </Modal>
  );
}

export default function OverviewPage() {
  const { gameId = '' } = useParams();
  const { data: game } = useGame(gameId);
  const { data: vision } = useVision(gameId, CURRENT_YEAR);
  const ensureVision = useEnsureVision(gameId);
  const addMetric = useAddMetric();
  const { data: metrics = [] } = useMetrics(gameId);
  const { data: features = [] } = useFeatures(gameId);
  const { data: milestones = [] } = useMilestones(gameId);
  const { data: currentSprint } = useCurrentSprint(gameId);
  const { data: tasks = [] } = useTasks(gameId);
  const updateMetric = useUpdateMetric();
  const [showAdd, setShowAdd] = useState(false);
  const [addVisionId, setAddVisionId] = useState<string | null>(null);

  const placeholders: Record<string, number> = {
    Combat: 60,
    Inventory: 40,
    Trailer: 75,
  };

  const contributorNames = useMemo(
    () => new Map(milestones.map((m) => [m.id, m.name])),
    [milestones],
  );

  const activeMilestones = useMemo(
    () => milestones.filter((m) => m.status === 'active'),
    [milestones],
  );

  const sprintTasks = useMemo(
    () => (currentSprint ? tasks.filter((t) => t.sprintId === currentSprint.id) : []),
    [currentSprint, tasks],
  );
  const doneCount = sprintTasks.filter((t) => t.status === 'done').length;
  const doingCount = sprintTasks.filter((t) => t.status === 'doing').length;
  const blockedCount = sprintTasks.filter((t) => t.status === 'todo' && t.note).length;

  const openAddMetric = () => {
    if (vision) {
      setAddVisionId(vision.id);
      setShowAdd(true);
    } else {
      ensureVision.mutate(undefined, {
        onSuccess: (v) => {
          setAddVisionId(v?.id ?? null);
          setShowAdd(true);
        },
      });
    }
  };

  if (!game) return <Spinner />;

  return (
    <div className="space-y-8">
      {/* VISION */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            Vision {CURRENT_YEAR}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              Goal vs current
            </span>
          </h2>
          <button
            onClick={openAddMetric}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand"
          >
            <Plus size={14} /> Add metric
          </button>
        </div>

        {metrics.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => (
              <MetricCard
                key={m.id}
                metric={m}
                isNorthStar={vision?.northStarId === m.id}
                contributors={m.contributorMilestoneIds
                  .map((id) => contributorNames.get(id))
                  .filter(Boolean) as string[]}
                onUpdateCurrent={(metric, value) =>
                  updateMetric.mutate({ metricId: metric.id, value })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🎯"
            title="Set your vision goal"
            hint="Add metrics (target + current position) to build the scoreboard. Update Current on Fridays — history & trend update automatically."
            action={
              <button
                onClick={openAddMetric}
                className="flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                <Plus size={14} /> Add first metric
              </button>
            }
          />
        )}
      </section>

      <AddMetricModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(d) => {
          if (addVisionId) {
            addMetric.mutate({
              visionId: addVisionId,
              gameId,
              data: d,
            });
          }
        }}
      />

      {/* QUARTER position */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">
          Quarter Q1 · position
        </h2>
        {features.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {features.slice(0, 6).map((f) => {
              const fm = milestones.filter((m) => m.featureId === f.id);
              const done = fm.filter((m) => m.status === 'done').length;
              const pct = fm.length
                ? Math.round((done / fm.length) * 100)
                : (placeholders[f.name] ?? 0);
              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">
                      {f.name}
                    </span>
                    <TrackBadge trackType={f.trackType} />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {f.category} · SP {f.storyPoints}
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>
                        {done}/{fm.length} milestones done
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="📅"
            title="No features in this quarter yet"
            hint="Head to the Quarter tab to add features & milestones."
          />
        )}
      </section>

      {/* THIS WEEK */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">This week</h2>
              {currentSprint && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  Sprint #{currentSprint.number}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {currentSprint
                ? `${formatShort(currentSprint.startDate)} – ${formatShort(currentSprint.endDate)}`
                : 'No sprint for this game yet.'}
            </p>
          </div>
          <Link
            to={`/games/${gameId}/sprint`}
            className="flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Open Sprint <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
          {[
            { label: 'Goal', value: currentSprint?.goal || '—' },
            { label: 'Done', value: String(doneCount) },
            { label: 'In progress', value: String(doingCount) },
            { label: 'Blocked', value: String(blockedCount) },
          ].map((s) => (
            <div key={s.label} className="bg-white px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {s.label}
              </div>
              <div className="mt-1 truncate text-sm font-medium text-ink">
                {s.value}
              </div>
            </div>
          ))}
        </div>
        {activeMilestones.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Active milestones
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {activeMilestones.map((m) => (
                <span
                  key={m.id}
                  className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
