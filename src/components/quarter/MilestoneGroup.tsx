import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Feature, Milestone } from '../../lib/types';
import TrackBadge from '../common/TrackBadge';
import MilestoneCard from './MilestoneCard';

/**
 * A milestone card rendered at the top level of the Quarter tab. Each milestone
 * is now the container that holds its features (feature ↔ milestone swap).
 */
export default function MilestoneGroup({
  milestone,
  features,
  gameId,
  metricNames,
  onAddFeature,
  onEditFeature,
  onDeleteFeature,
}: {
  milestone: Milestone;
  features: Feature[];
  gameId: string;
  metricNames: (ids: string[]) => string[];
  onAddFeature: (milestone: Milestone) => void;
  onEditFeature: (feature: Feature) => void;
  onDeleteFeature: (feature: Feature) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <MilestoneCard
        milestone={milestone}
        gameId={gameId}
        metricNames={metricNames}
      />

      <div className="mt-3 space-y-2">
        {features.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink">
                  {f.name}
                </span>
                <TrackBadge trackType={f.trackType} />
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  SP {f.storyPoints}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">{f.category}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => onEditFeature(f)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                title="Edit feature"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDeleteFeature(f)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                title="Delete feature"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {features.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
            No features yet — add the features that deliver this milestone.
          </p>
        )}
        <button
          onClick={() => onAddFeature(milestone)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-xs font-medium text-slate-400 hover:border-brand hover:text-brand"
        >
          <Plus size={13} /> Add feature
        </button>
      </div>
    </div>
  );
}
