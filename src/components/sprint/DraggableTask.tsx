import { useDraggable } from '@dnd-kit/core';
import type { Feature, Task } from '../../lib/types';
import TaskCard from './TaskCard';

export default function DraggableTask({
  task,
  feature,
  onToggle,
  onDelete,
  compact = false,
  hidden = false,
}: {
  task: Task;
  feature?: Feature;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  hidden?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({ id: `task-${task.id}` });

  // The DragOverlay renders the moving card, so the ORIGINAL source card is
  // hidden in place while it is being dragged — and stays hidden through the
  // drop until the card has re-rendered into its target column (see how the
  // parent keeps `activeTask`/`hidden` set for one frame after the drop).
  //
  // We use `visibility: hidden` rather than `opacity: 0` or removing the node:
  //  - the element stays mounted in its layout slot, which dnd-kit needs for
  //    correct collision detection (no dropped-into-the-wrong-column bug), and
  //  - `visibility` is never animated by a CSS transition, so nothing glides
  //    or fades back toward the old column on drop.
  const style = {
    visibility: isDragging || hidden ? ('hidden' as const) : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
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
