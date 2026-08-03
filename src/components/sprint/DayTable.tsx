import { useEffect, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { DayName, Feature, Task } from '../../lib/types';
import { DAYS } from '../../lib/constants';
import { isToday, displayDate } from '../../lib/format';
import DraggableTask from './DraggableTask';

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
      className={`flex min-w-[200px] flex-1 flex-col rounded-xl border p-3 transition ${
        isOver
          ? 'border-brand ring-2 ring-brand/25'
          : today
            ? 'border-brand bg-brand/[0.04]'
            : weekend
              ? 'border-slate-100 bg-slate-50/40'
              : 'border-slate-200 bg-slate-50/70'
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
      <div className="flex flex-1 flex-col gap-2">
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

  const unassigned = tasks.filter((t) => !t.day);
  const { setNodeRef: setUnassignedRef, isOver: unassignedOver } = useDroppable({
    id: 'day-__unassigned__',
  });

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id).replace('task-', '');
    const overId = String(over.id);
    if (!overId.startsWith('day-')) return;
    const day = overId === 'day-__unassigned__' ? undefined : (overId.replace('day-', '') as DayName);
    onDropDay(taskId, day);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        <div ref={scrollerRef} className="flex gap-2 overflow-x-auto pb-2">
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
    </DndContext>
  );
}
