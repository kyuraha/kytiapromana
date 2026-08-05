import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Feature, Task } from '../../lib/types';
import { columnCollision } from '../../lib/dnd';
import TaskCard from './TaskCard';
import DraggableTask from './DraggableTask';

type ColumnKey = 'todo' | 'doing' | 'done' | 'blocked' | 'backlog';

const COLUMNS: { key: ColumnKey; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'text-slate-400' },
  { key: 'todo', label: 'Todo', color: 'text-slate-500' },
  { key: 'doing', label: 'Doing', color: 'text-amber-500' },
  { key: 'done', label: 'Done', color: 'text-emerald-600' },
  { key: 'blocked', label: 'Blocked', color: 'text-rose-500' },
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
  activeTaskId,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  featureById: Map<string, Feature>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  activeTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.key}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[230px] flex-1 flex-col px-2 transition ${
        isOver ? 'bg-brand/5' : ''
      }`}
    >
      <div
        className={`mb-2 flex items-center justify-between px-1 text-sm font-bold uppercase tracking-wide ${column.color}`}
      >
        <span>{column.label}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
          {tasks.length}
        </span>
      </div>
      <div className="flex min-h-[300px] flex-1 flex-col gap-2">
        {tasks.map((t) => (
          <DraggableTask
            key={t.id}
            task={t}
            feature={featureById.get(t.featureId)}
            onToggle={onToggle}
            onDelete={onDelete}
            hidden={activeTaskId === t.id}
          />
        ))}
        {tasks.length === 0 && (
          <div className="py-4 text-center text-xs text-slate-300">
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const grouped = (key: ColumnKey) =>
    tasks.filter((t) => columnOf(t) === key);

  const handleDragStart = (e: DragStartEvent) => {
    const taskId = String(e.active.id).replace('task-', '');
    setActiveTask(tasks.find((t) => t.id === taskId) ?? null);
  };

  const handleDragCancel = () => setActiveTask(null);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const taskId = String(active.id).replace('task-', '');
    const overId = over ? String(over.id) : '';

    // No valid column target → cancel (reveals the card in its original spot).
    if (!over || !overId.startsWith('col-')) {
      setActiveTask(null);
      return;
    }

    onDropColumn(taskId, overId.replace('col-', '') as ColumnKey);

    // Keep the dragged card hidden in the DragOverlay and the source card
    // hidden for one animation frame, so the optimistic update has re-rendered
    // the card into the target column before the source is revealed again.
    // This way the source can never flash back to the column it came from.
    requestAnimationFrame(() => setActiveTask(null));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={columnCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex divide-x divide-slate-200 overflow-x-auto pb-2">
        {COLUMNS.map((c) => (
          <Column
            key={c.key}
            column={c}
            tasks={grouped(c.key)}
            featureById={featureById}
            onToggle={onToggle}
            onDelete={onDelete}
            activeTaskId={activeTask?.id ?? null}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="cursor-grabbing rotate-2 rounded-lg shadow-2xl ring-2 ring-brand/40">
            <TaskCard
              task={activeTask}
              feature={featureById.get(activeTask.featureId)}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export type { ColumnKey };
