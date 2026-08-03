import { TRACK_META } from '../../lib/constants';
import type { TrackType } from '../../lib/types';

export default function TrackBadge({
  trackType,
  size = 'sm',
}: {
  trackType: TrackType;
  size?: 'sm' | 'md';
}) {
  const meta = TRACK_META[trackType];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        meta.badge
      } ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
