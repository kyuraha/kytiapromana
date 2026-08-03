import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Feature, Task } from '../../lib/types';
import TaskCard from './TaskCard';

export default function DraggableTask({
  task,
  feature,
  onToggle,
  onDelete,
  compact = false,
}: {
  task: Task;
  feature?: Feature;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `task-${task.id}` });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard
        task={task}
        feature={feature}
        compact={compact}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </div>
  );
}
