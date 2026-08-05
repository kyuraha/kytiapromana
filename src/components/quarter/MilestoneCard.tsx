import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { Milestone, MilestoneStatus } from '../../lib/types';
import { MILESTONE_STATUSES, STATUS_COLORS } from '../../lib/constants';
import { useConfirm } from '../../lib/dialogs';
import { useDeleteMilestone, useUpdateMilestone } from '../../hooks/queries';

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  done: 'Done',
  late: 'Late',
};

export default function MilestoneCard({
  milestone,
  gameId,
  metricNames,
}: {
  milestone: Milestone;
  gameId: string;
  metricNames: (ids: string[]) => string[];
}) {
  const updateMilestone = useUpdateMilestone(gameId);
  const deleteMilestone = useDeleteMilestone(gameId);
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const names = metricNames(milestone.metricIds);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            size={14}
            className={`shrink-0 text-slate-400 transition ${expanded ? '' : '-rotate-90'}`}
          />
          <span className="truncate text-sm font-medium text-ink">
            {milestone.name}
          </span>
        </button>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[milestone.status]}`}
        >
          {STATUS_LABEL[milestone.status]}
        </span>

        <select
          value={milestone.status}
          onChange={(e) =>
            updateMilestone.mutate({
              milestoneId: milestone.id,
              patch: { status: e.target.value as MilestoneStatus },
            })
          }
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 outline-none focus:border-brand"
        >
          {MILESTONE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <button
          onClick={async () => {
            const ok = await confirm({
              title: 'Delete milestone',
              message: `Delete milestone "${milestone.name}"? This cannot be undone.`,
              confirmLabel: 'Delete',
              cancelLabel: 'Cancel',
              danger: true,
            });
            if (ok) deleteMilestone.mutate(milestone.id);
          }}
          className="shrink-0 rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
          title="Delete milestone"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-slate-200 pt-2 pl-6">
          <p className="text-xs text-ink-light">
            <span className="font-semibold text-slate-500">Target:</span>{' '}
            {milestone.targetStatement || '—'}
          </p>

          {milestone.criteria.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Definition of Done
              </div>
              <ul className="space-y-1">
                {milestone.criteria.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!checked[c]}
                      onChange={() =>
                        setChecked((prev) => ({ ...prev, [c]: !prev[c] }))
                      }
                      className="h-3.5 w-3.5 rounded accent-brand"
                    />
                    <span
                      className={`text-xs ${checked[c] ? 'line-through text-slate-400' : 'text-ink'}`}
                    >
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {names.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Drives metrics
              </div>
              <div className="flex flex-wrap gap-1">
                {names.map((n) => (
                  <span
                    key={n}
                    className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                  >
                    🎯 {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
