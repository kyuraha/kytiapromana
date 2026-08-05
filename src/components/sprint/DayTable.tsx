import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { DayName, Feature, Task } from '../../lib/types';
import { DAYS } from '../../lib/constants';
import { isToday, displayDate } from '../../lib/format';
import DraggableTask from './DraggableTask';
import TaskCard from './TaskCard';

function DayColumn({
  day,
  tasks,
  featureById,
  baseDate,
  onToggle,
  onDelete,
}: {
  day: DayName;
  tasks: Task[];
  featureById: Map<string, Feature>;
  baseDate: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });
  const today = isToday(day);
  const weekend = day === 'Sabtu' || day === 'Minggu';
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[200px] flex-1 flex-col px-2 transition ${
        isOver ? 'bg-brand/5' : ''
      }`}
    >
      <div
        className={`mb-2 text-center text-sm font-bold ${
          today ? 'text-brand' : weekend ? 'text-slate-300' : 'text-slate-500'
        }`}
      >
        {today && <span className="mr-1">★</span>}
        {day}
        <span className="block text-xs font-normal text-slate-400">
          {displayDate(day, baseDate)}
        </span>
      </div>
      <div className="flex min-h-[320px] flex-col gap-2">
        {tasks.map((t) => (
          <DraggableTask
            key={t.id}
            task={t}
            feature={featureById.get(t.featureId)}
            compact
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="py-4 text-center text-xs text-slate-300">
            Add tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function DayTable({
  tasks,
  featureById,
  baseDate,
  onDropDay,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  featureById: Map<string, Feature>;
  baseDate: string;
  onDropDay: (taskId: string, day: DayName | undefined) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const today = DAYS[new Date().getDay()];
  const todayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll today's column to the centre on mount.
  useEffect(() => {
    if (todayRef.current && scrollerRef.current) {
      const container = scrollerRef.current;
      const el = todayRef.current;
      const target = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
      container.scrollLeft = Math.max(0, target);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const unassigned = tasks.filter((t) => !t.day);
  const { setNodeRef: setUnassignedRef, isOver: unassignedOver } = useDroppable({
    id: 'day-__unassigned__',
  });

  const handleDragStart = (e: DragStartEvent) => {
    const taskId = String(e.active.id).replace('task-', '');
    setActiveTask(tasks.find((t) => t.id === taskId) ?? null);
  };

  const handleDragCancel = () => setActiveTask(null);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id).replace('task-', '');
    const overId = String(over.id);
    if (!overId.startsWith('day-')) return;
    const day = overId === 'day-__unassigned__' ? undefined : (overId.replace('day-', '') as DayName);
    onDropDay(taskId, day);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-3">
        <div
          ref={scrollerRef}
          className="flex max-h-[60vh] divide-x divide-slate-200 overflow-x-auto overflow-y-auto pb-2"
        >
          {DAYS.map((d) => (
            <div
              key={d}
              ref={d === today ? todayRef : undefined}
              className="flex flex-1"
            >
              <DayColumn
                day={d}
                tasks={tasks.filter((t) => t.day === d)}
                featureById={featureById}
                baseDate={baseDate}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>

        {/* Unassigned / backlog */}
        <div
          ref={(node) => {
            setUnassignedRef(node);
            // eslint-disable-next-line react-hooks/rules-of-hooks
          }}
          className={`rounded-xl border border-dashed p-3 transition ${
            unassignedOver ? 'border-brand bg-brand/5' : 'border-slate-200'
          }`}
        >
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Unassigned / Backlog {unassigned.length > 0 && `(${unassigned.length})`}
          </div>
          {unassigned.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unassigned.map((t) => (
                <DraggableTask
                  key={t.id}
                  task={t}
                  feature={featureById.get(t.featureId)}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-300">
              Drag a card here to unassign it / keep it as backlog.
            </p>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="cursor-grabbing rotate-2 rounded-lg shadow-2xl ring-2 ring-brand/40">
            <TaskCard
              task={activeTask}
              feature={featureById.get(activeTask.featureId)}
              compact
              onToggle={onToggle}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
