import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Gamepad2, Plus } from 'lucide-react';
import { useGames } from '../../hooks/queries';

export default function GameSwitcher() {
  const { data: games = [] } = useGames();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { gameId } = useParams();
  const current = games.find((g) => g.id === gameId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm hover:border-brand/40 hover:shadow"
      >
        {current ? (
          <>
            <span>{current.icon}</span>
            <span>{current.name}</span>
          </>
        ) : (
          <>
            <Gamepad2 size={16} className="text-slate-400" />
            <span className="text-slate-400">Select game</span>
          </>
        )}
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              My Games
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {games.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    navigate(`/games/${g.id}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                    style={{ backgroundColor: g.color + '22' }}
                  >
                    {g.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">
                      {g.name}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {g.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100 p-2">
              <Link
                to="/games"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand hover:bg-brand/5"
              >
                <Plus size={16} /> New game …
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
