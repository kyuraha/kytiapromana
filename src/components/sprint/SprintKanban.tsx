import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Feature, Task } from '../../lib/types';
import TaskCard from './TaskCard';
import DraggableTask from './DraggableTask';

type ColumnKey = 'todo' | 'doing' | 'done' | 'blocked' | 'backlog';

const COLUMNS: { key: ColumnKey; label: string; color: string }[] = [
  { key: 'todo', label: 'Todo', color: 'text-slate-500' },
  { key: 'doing', label: 'Doing', color: 'text-amber-500' },
  { key: 'done', label: 'Done', color: 'text-emerald-600' },
  { key: 'blocked', label: 'Blocked', color: 'text-rose-500' },
  { key: 'backlog', label: 'Backlog', color: 'text-slate-400' },
];

function columnOf(t: Task): ColumnKey {
  if (t.isBacklog) return 'backlog';
  if (t.status === 'done') return 'done';
  if (t.status === 'doing') return 'doing';
  if (t.note) return 'blocked';
  return 'todo';
}

function Column({
  column,
  tasks,
  featureById,
  onToggle,
  onDelete,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  featureById: Map<string, Feature>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.key}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[230px] flex-1 flex-col rounded-2xl border bg-slate-50/70 p-3 transition ${
        isOver ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200'
      }`}
    >
      <div
        className={`mb-2 flex items-center justify-between px-1 text-sm font-bold uppercase tracking-wide ${column.color}`}
      >
        <span>{column.label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-400">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((t) => (
          <DraggableTask
            key={t.id}
            task={t}
            feature={featureById.get(t.featureId)}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-300">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function SprintKanban({
  tasks,
  featureById,
  onDropColumn,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  featureById: Map<string, Feature>;
  onDropColumn: (taskId: string, column: ColumnKey) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const grouped = (key: ColumnKey) =>
    tasks.filter((t) => columnOf(t) === key);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id).replace('task-', '');
    const overId = String(over.id);
    if (!overId.startsWith('col-')) return;
    onDropColumn(taskId, overId.replace('col-', '') as ColumnKey);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((c) => (
          <Column
            key={c.key}
            column={c}
            tasks={grouped(c.key)}
            featureById={featureById}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}

export type { ColumnKey };
