import { useState } from 'react';
import Modal from '../common/Modal';
import { useSaveGame } from '../../hooks/queries';
import { PALETTE } from '../../lib/constants';
import type { TrackType } from '../../lib/types';

const ICONS = ['🎮', '🧪', '🕹️', '🎲', '🎯', '🛸', '🚀', '🧠'];

export default function NewGameModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(PALETTE[0]);
  const [track, setTrack] = useState<TrackType>('agile');
  const saveGame = useSaveGame();

  const submit = () => {
    if (!name.trim()) return;
    saveGame.mutate(
      {
        data: {
          name: name.trim(),
          description: description.trim(),
          icon,
          color,
          defaultTrackType: track,
        },
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New game / project"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || saveGame.isPending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Create game
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ARNAVA"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">
            One-line description
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Action RPG with a living ecosystem"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink">Icon</span>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                  icon === i
                    ? 'bg-brand/10 ring-2 ring-brand'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink">Color</span>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ${
                  color === c ? 'ring-2 ring-offset-2 ring-brand' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink">
            Default track type
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setTrack('agile')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                track === 'agile'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              ⚡ Agile (code)
            </button>
            <button
              onClick={() => setTrack('waterfall')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                track === 'waterfall'
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              📦 Waterfall (assets)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
