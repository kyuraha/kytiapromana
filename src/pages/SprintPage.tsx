import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckSquare, Plus, RotateCcw } from 'lucide-react';
import {
  useAddTask,
  useCloseSprint,
  useCreateSprint,
  useCurrentSprint,
  useFeatures,
  useGame,
  useMilestones,
  useMoveTaskDay,
  useTasks,
  useToggleDone,
  useUpdateSprint,
  useUpdateTask,
} from '../hooks/queries';
import SprintKanban, { type ColumnKey } from '../components/sprint/SprintKanban';
import DayTable from '../components/sprint/DayTable';
import TodayPanel from '../components/sprint/TodayPanel';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { DAYS, STATUS_COLORS } from '../lib/constants';
import { useConfirm } from '../lib/dialogs';
import { formatShort, todayDayName } from '../lib/format';
import type { DayName, Feature, TaskStatus } from '../lib/types';

function AddTaskModal({
  open,
  onClose,
  onSave,
  features,
  defaultFeatureId,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (d: {
    featureId: string;
    title: string;
    status: TaskStatus;
    day?: DayName;
    isBacklog: boolean;
    note?: string;
  }) => void;
  features: Feature[];
  defaultFeatureId?: string;
}) {
  const [title, setTitle] = useState('');
  const [featureId, setFeatureId] = useState(defaultFeatureId ?? '');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [day, setDay] = useState<DayName | ''>('');
  const [note, setNote] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add task / deliverable"
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
              if (!title.trim() || !featureId) return;
              onSave({
                featureId,
                title: title.trim(),
                status,
                day: day === '' ? undefined : day,
                isBacklog: day === '',
                note: note.trim() || undefined,
              });
              setTitle('');
              setNote('');
              setDay('');
              setStatus('todo');
              onClose();
            }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Add task
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-ink">Task title</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Damage number UI"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm text-ink">Feature</span>
            <select
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Select…</option>
              {features.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="todo">Todo</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm text-ink">Day (optional)</span>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayName | '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Backlog / unassigned</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink">Note / blocked?</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="optional"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}

export default function SprintPage() {
  const { gameId = '' } = useParams();

  const { data: game } = useGame(gameId);
  const { data: features = [] } = useFeatures(gameId);
  const { data: milestones = [] } = useMilestones(gameId);
  const { data: currentSprint } = useCurrentSprint(gameId);
  const { data: tasks = [] } = useTasks(gameId);

  const updateSprint = useUpdateSprint(gameId);
  const updateTask = useUpdateTask(gameId);
  const moveTaskDay = useMoveTaskDay(gameId);
  const toggleDone = useToggleDone(gameId);
  const addTask = useAddTask(gameId);
  const createSprint = useCreateSprint(gameId);
  const closeSprint = useCloseSprint(gameId);
  const confirm = useConfirm();

  const [addOpen, setAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  const featureById = useMemo(
    () => new Map(features.map((f) => [f.id, f])),
    [features],
  );
  const milestoneById = useMemo(
    () => new Map(milestones.map((m) => [m.id, m.name])),
    [milestones],
  );
  const sprintTasks = useMemo(
    () =>
      currentSprint
        ? tasks.filter((t) => t.sprintId === currentSprint.id)
        : [],
    [currentSprint, tasks],
  );

  const saveGoal = () => {
    if (currentSprint && goalDraft !== currentSprint.goal) {
      updateSprint.mutate({ sprintId: currentSprint.id, patch: { goal: goalDraft } });
    }
    setEditingGoal(false);
  };

  const toggleMilestone = (id: string) => {
    if (!currentSprint) return;
    const has = currentSprint.milestoneIds.includes(id);
    updateSprint.mutate({
      sprintId: currentSprint.id,
      patch: {
        milestoneIds: has
          ? currentSprint.milestoneIds.filter((x) => x !== id)
          : [...currentSprint.milestoneIds, id],
      },
    });
  };

  const handleDropColumn = (taskId: string, column: ColumnKey) => {
    // `note` must be cleared with `null`, not `undefined`: the repo layers
    // strip `undefined` before writing (Firestore can't store it), so a stale
    // note would survive the update and make the task snap back to Blocked on
    // the next refetch. `null` is Firestore's way to delete a field.
    const patchByColumn: Record<ColumnKey, Parameters<typeof updateTask.mutate>[0]['patch']> = {
      todo: { status: 'todo', isBacklog: false, note: null },
      doing: { status: 'doing', isBacklog: false, note: null },
      done: { status: 'done', isBacklog: false, note: null },
      blocked: { status: 'todo', isBacklog: false, note: 'Blocked: needs attention.' },
      // `day: null` (not `undefined`): the repo layers strip `undefined` before
      // writing, so an undefined day would never clear a previously-assigned
      // day — the card would stay on its day in the Days view. `null` deletes
      // the field in Firestore.
      backlog: { status: 'todo', isBacklog: true, day: null, note: null },
    };
    updateTask.mutate({ taskId, patch: patchByColumn[column] });
  };

  const handleDropDay = (taskId: string, day: DayName | undefined) => {
    moveTaskDay.mutate({ taskId, day });
  };

  const handleStartSprint = async () => {
    if (features.length === 0) {
      await confirm({
        title: 'Start with a feature first',
        message:
          'You need at least one feature in a quarter before starting the sprint. Add a feature in the Quarter tab first, then come back here to start the sprint.',
        confirmLabel: 'Got it',
        confirmOnly: true,
      });
      return;
    }
    createSprint.mutate();
  };

  const handleClose = async () => {
    if (!currentSprint) return;
    const ok = await confirm({
      title: 'Close sprint',
      message:
        'Close this sprint? Done tasks are deleted, in-progress tasks move to the next sprint, and todo tasks return to the backlog.',
      confirmLabel: 'Close sprint',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (ok) closeSprint.mutate(currentSprint.id);
  };

  if (!game) return <Spinner />;

  return (
    <div className="space-y-6">
      {!currentSprint ? (
        <EmptyState
          icon="📅"
          title="No active sprint for this game"
          hint="Start the weekly rhythm — create a sprint to track this week's delivery."
          action={
            <button
              onClick={handleStartSprint}
              className="flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              <RotateCcw size={14} /> Start first sprint
            </button>
          }
        />
      ) : (
        <>
          {/* Sprint header */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">
                    Sprint #{currentSprint.number}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[currentSprint.status] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {currentSprint.status}
                  </span>
                  <span className="text-sm text-slate-400">
                    {formatShort(currentSprint.startDate)} –{' '}
                    {formatShort(currentSprint.endDate)}
                  </span>
                </div>

                {/* Goal */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Goal
                  </span>
                  {editingGoal ? (
                    <input
                      autoFocus
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(e.target.value)}
                      onBlur={saveGoal}
                      onFocus={() => setGoalDraft(currentSprint.goal)}
                      onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                      className="flex-1 rounded-lg border border-brand px-2 py-1 text-sm outline-none"
                      placeholder="One-sentence goal…"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingGoal(true)}
                      className="flex-1 rounded-lg bg-slate-50 px-3 py-1.5 text-left text-sm text-ink hover:bg-slate-100"
                      title="Click to edit goal"
                    >
                      {currentSprint.goal || 'Set a one-sentence goal…'}
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Milestones
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {milestones.length === 0 ? (
                      <span className="text-xs text-slate-300">
                        No milestones yet — add them in the Quarter tab.
                      </span>
                    ) : (
                      milestones.map((m) => {
                        const active = currentSprint.milestoneIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            onClick={() => toggleMilestone(m.id)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              active
                                ? 'border-brand bg-brand/10 text-brand'
                                : 'border-slate-200 text-slate-500 hover:border-brand/40'
                            }`}
                            title={milestoneById.get(m.id)}
                          >
                            {milestoneById.get(m.id)}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-ink hover:bg-slate-200"
                  >
                    <Plus size={15} /> Add task
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={closeSprint.isPending}
                    className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    <CheckSquare size={15} /> Close sprint
                  </button>
                </div>
              </div>
            </div>
            {/* Retro */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Retro
              </span>
              <textarea
                defaultValue={currentSprint.retro ?? ''}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== currentSprint.retro) {
                    updateSprint.mutate({
                      sprintId: currentSprint.id,
                      patch: { retro: v || undefined },
                    });
                  }
                }}
                rows={1}
                placeholder="1–2 lines lesson from this week…"
                className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </section>

          {/* Board */}
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              Board
            </h2>
            <SprintKanban
              tasks={sprintTasks}
              featureById={featureById}
              onDropColumn={handleDropColumn}
              onToggle={(id) => toggleDone.mutate(id)}
              onDelete={(id) =>
                updateTask.mutate({
                  taskId: id,
                  patch: { isBacklog: true, day: undefined },
                })
              }
            />
          </section>

          {/* Days — below the board */}
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              Days
            </h2>
            <DayTable
              tasks={sprintTasks}
              featureById={featureById}
              baseDate={currentSprint.startDate}
              onDropDay={handleDropDay}
              onToggle={(id) => toggleDone.mutate(id)}
              onDelete={(id) =>
                updateTask.mutate({
                  taskId: id,
                  patch: { isBacklog: true, day: undefined },
                })
              }
            />
          </section>

          {/* Cross-game Today panel */}
          <TodayPanel />

          <AddTaskModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            features={features}
            defaultFeatureId={features[0]?.id}
            onSave={(d) => {
              addTask.mutate({ sprintId: currentSprint.id, ...d });
            }}
          />
        </>
      )}
    </div>
  );
}
