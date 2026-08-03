import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  useAddFeature,
  useAddMilestone,
  useDeleteFeature,
  useEnsureQuarters,
  useFeatures,
  useGame,
  useMetrics,
  useMilestones,
  useQuarters,
  useUpdateFeature,
  CURRENT_YEAR,
} from '../hooks/queries';
import FeatureGroup from '../components/quarter/FeatureGroup';
import FilterBar from '../components/common/FilterBar';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { CATEGORIES, QUARTERS } from '../lib/constants';
import type {
  Feature,
  Metric,
  QuarterName,
  TrackType,
} from '../lib/types';

function AddFeatureModal({
  open,
  onClose,
  onSave,
  title = 'Add feature',
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (d: {
    name: string;
    category: Feature['category'];
    trackType: TrackType;
    storyPoints: number;
  }) => void;
  title?: string;
  initial?: Feature;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<Feature['category']>(
    initial?.category ?? 'Code',
  );
  const [track, setTrack] = useState<TrackType>(
    initial?.trackType ?? 'agile',
  );
  const [sp, setSp] = useState(String(initial?.storyPoints ?? 5));

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setCategory(initial?.category ?? 'Code');
      setTrack(initial?.trackType ?? 'agile');
      setSp(String(initial?.storyPoints ?? 5));
    }
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
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
              onSave({
                name,
                category,
                trackType: track,
                storyPoints: Number(sp) || 0,
              });
              onClose();
            }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-ink">Feature name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Combat V2"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm text-ink">Category</span>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Feature['category'])
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink">Story points</span>
            <input
              value={sp}
              onChange={(e) => setSp(e.target.value)}
              type="number"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>
        <div>
          <span className="mb-1 block text-sm text-ink">Track type</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTrack('agile')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                track === 'agile'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              ⚡ Agile
            </button>
            <button
              onClick={() => setTrack('waterfall')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                track === 'waterfall'
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              📦 Waterfall
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddMilestoneModal({
  open,
  onClose,
  onSave,
  metrics,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (d: {
    name: string;
    targetStatement: string;
    criteria: string[];
    metricIds: string[];
  }) => void;
  metrics: Metric[];
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [criteria, setCriteria] = useState('');
  const [metricIds, setMetricIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName('');
      setTarget('');
      setCriteria('');
      setMetricIds([]);
    }
  }, [open]);

  const toggleMetric = (id: string) =>
    setMetricIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add milestone"
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
              onSave({
                name,
                targetStatement: target,
                criteria: criteria
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean),
                metricIds,
              });
              onClose();
            }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Add
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-ink">Milestone name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Combat loop playable"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink">
            Target (one sentence)
          </span>
          <textarea
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            rows={2}
            placeholder="Players can move, attack and take damage…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink">
            Definition of Done (comma separated)
          </span>
          <input
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder="hit-reg, damage UI, attack timing"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <div>
          <span className="mb-1 block text-sm text-ink">Drives metrics</span>
          {metrics.length === 0 ? (
            <p className="text-xs text-slate-400">No metrics yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {metrics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMetric(m.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    metricIds.includes(m.id)
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-slate-200 text-slate-500 hover:border-brand/40'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function QuarterPage() {
  const { gameId = '' } = useParams();
  const { data: game } = useGame(gameId);
  const { data: quarters = [] } = useQuarters(gameId);
  const { data: features = [] } = useFeatures(gameId);
  const { data: milestones = [] } = useMilestones(gameId);
  const { data: metrics = [] } = useMetrics(gameId);
  const ensureQuarters = useEnsureQuarters(gameId);
  const addFeature = useAddFeature(gameId);
  const updateFeature = useUpdateFeature(gameId);
  const deleteFeature = useDeleteFeature(gameId);
  const addMilestone = useAddMilestone(gameId);

  const [year, setYear] = useState(CURRENT_YEAR);
  const [quarter, setQuarter] = useState<QuarterName>('Q1');
  const [trackFilter, setTrackFilter] = useState<TrackType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [addOpen, setAddOpen] = useState(false);
  const [editFeature, setEditFeature] = useState<Feature | null>(null);
  const [milestoneFeature, setMilestoneFeature] = useState<Feature | null>(null);

  const selectedQuarter = quarters.find(
    (q) => q.year === year && q.quarter === quarter,
  );

  // Ensure Q1..Q4 exist for the chosen year/quarter combination.
  useEffect(() => {
    if (gameId && quarters.length >= 0 && !selectedQuarter) {
      ensureQuarters.mutate();
    }
  }, [gameId, year, quarter, quarters, selectedQuarter, ensureQuarters]);

  const metricNames = useMemo(() => {
    const map = new Map(metrics.map((m) => [m.id, m.name]));
    return (ids: string[]) =>
      ids.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [metrics]);

  const quarterFeatures = useMemo(
    () => features.filter((f) => f.quarterId === selectedQuarter?.id),
    [features, selectedQuarter],
  );

  const visibleFeatures = useMemo(() => {
    return quarterFeatures
      .filter((f) => {
        if (trackFilter !== 'all' && f.trackType !== trackFilter)
          return false;
        if (statusFilter === 'all') return true;
        return milestones.some(
          (m) => m.featureId === f.id && m.status === statusFilter,
        );
      })
      .map((f) => ({
        feature: f,
        milestones:
          statusFilter === 'all'
            ? milestones.filter((m) => m.featureId === f.id)
            : milestones.filter(
                (m) => m.featureId === f.id && m.status === statusFilter,
              ),
      }));
  }, [quarterFeatures, milestones, trackFilter, statusFilter]);

  if (!game) return <Spinner />;

  return (
    <div>
      {/* Year + quarter selector */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {QUARTERS.map((q) => (
              <button
                key={q}
                onClick={() => setQuarter(q)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  quarter === q
                    ? 'bg-brand text-white'
                    : 'text-slate-500 hover:text-brand'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <FilterBar
          track={trackFilter}
          onTrack={setTrackFilter}
          status={statusFilter}
          onStatus={setStatusFilter}
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          Features in {quarter} {year}
        </h2>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <Plus size={15} /> Add feature
        </button>
      </div>

      {visibleFeatures.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleFeatures.map(({ feature, milestones: fm }) => (
            <FeatureGroup
              key={feature.id}
              feature={feature}
              milestones={fm}
              gameId={gameId}
              metricNames={metricNames}
              onAddMilestone={(f) => setMilestoneFeature(f)}
              onEditFeature={(f) => setEditFeature(f)}
              onDeleteFeature={(f) => {
                if (confirm(`Delete feature "${f.name}" and its milestones?`))
                  deleteFeature.mutate(f.id);
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🧩"
          title={
            quarterFeatures.length
              ? 'No features match filters'
              : 'No features yet'
          }
          hint={
            quarterFeatures.length
              ? 'Try changing the filters above.'
              : 'Add your first feature for this quarter and break it into milestones.'
          }
          action={
            quarterFeatures.length === 0 ? (
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                <Plus size={14} /> Add feature
              </button>
            ) : undefined
          }
        />
      )}

      <AddFeatureModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(d) => {
          if (selectedQuarter) {
            addFeature.mutate({ quarterId: selectedQuarter.id, data: d });
          } else {
            ensureQuarters.mutate();
          }
        }}
      />

      <AddFeatureModal
        open={!!editFeature}
        title="Edit feature"
        initial={editFeature ?? undefined}
        onClose={() => setEditFeature(null)}
        onSave={(d) => {
          if (editFeature)
            updateFeature.mutate({ featureId: editFeature.id, patch: d });
        }}
      />

      <AddMilestoneModal
        open={!!milestoneFeature}
        metrics={metrics}
        onClose={() => setMilestoneFeature(null)}
        onSave={(d) => {
          if (milestoneFeature)
            addMilestone.mutate({
              featureId: milestoneFeature.id,
              data: d,
            });
        }}
      />
    </div>
  );
}
