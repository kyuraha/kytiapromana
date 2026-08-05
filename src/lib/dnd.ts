import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core';

/**
 * Collision strategy for dragging a task card onto one column / day.
 *
 * The app previously used `closestCorners`, which compares the four corners of
 * the dragged (DragOverlay) card against each column's corners. Because the
 * dragged card is wide — and slightly rotated by the overlay's `rotate-2` —
 * those corners can end up *nearest a different column than the one under the
 * cursor*. That's why a drop sometimes landed on "Blocked" or a neighbouring
 * column instead of the intended target.
 *
 * Fix: resolve the drop from where the pointer actually is (`pointerWithin`),
 * which matches the user's intent and is deterministic. If the pointer sits in
 * a gap/padding between columns, fall back to the nearest column so the drop
 * still resolves sensibly.
 */
export const columnCollision: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  if (underPointer.length > 0) {
    return underPointer;
  }
  return closestCorners(args);
};