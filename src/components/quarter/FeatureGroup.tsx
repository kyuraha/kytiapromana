import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Feature, Milestone } from '../../lib/types';
import TrackBadge from '../common/TrackBadge';
import MilestoneCard from './MilestoneCard';

export default function FeatureGroup({
  feature,
  milestones,
  gameId,
  metricNames,
  onAddMilestone,
  onEditFeature,
  onDeleteFeature,
  hoverable = false,
}: {
  feature: Feature;
  milestones: Milestone[];
  gameId: string;
  metricNames: (ids: string[]) => string[];
  onAddMilestone: (feature: Feature) => void;
  onEditFeature: (feature: Feature) => void;
  onDeleteFeature: (feature: Feature) => void;
  hoverable?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{feature.name}</span>
            <TrackBadge trackType={feature.trackType} />
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              SP {feature.storyPoints}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{feature.category}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEditFeature(feature)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
            title="Edit feature"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDeleteFeature(feature)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
            title="Delete feature"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {milestones.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            gameId={gameId}
            metricNames={metricNames}
          />
        ))}
        {milestones.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
            No milestones yet — break this feature into quarter-sized targets.
          </p>
        )}
        <button
          onClick={() => onAddMilestone(feature)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-xs font-medium text-slate-400 hover:border-brand hover:text-brand"
        >
          <Plus size={13} /> Add milestone
        </button>
      </div>
    </div>
  );
}
