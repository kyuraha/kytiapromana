import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGames } from '../hooks/queries';
import { getCurrentUid } from '../lib/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { seedFirestoreForUser } from '../services/firestoreRepo';
import GameRow from '../components/games/GameRow';
import NewGameModal from '../components/games/NewGameModal';
import SignOutButton from '../components/auth/SignOutButton';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function GamesPage() {
  const { data: games, isLoading } = useGames();
  const [showNew, setShowNew] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();

  const loadDemo = async () => {
    if (!isFirebaseConfigured) return;
    setSeeding(true);
    try {
      await seedFirestoreForUser(getCurrentUid());
      await queryClient.invalidateQueries({ queryKey: ['games'] });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Games</h1>
          <p className="mt-1 text-sm text-slate-400">
            One account, many projects — each with its own Vision, Quarter and
            Sprint.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark"
          >
            <Plus size={16} /> New Game
          </button>
          <SignOutButton />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : games && games.length > 0 ? (
        <div className="space-y-4">
          {games.map((g) => (
            <GameRow key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🎮"
          title="No games yet"
          hint="Create your first game to set its Vision, Quarter and Sprint."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setShowNew(true)}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Create a game
              </button>
              {isFirebaseConfigured && (
                <button
                  onClick={loadDemo}
                  disabled={seeding}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand/40 hover:text-brand disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  {seeding ? 'Loading demo…' : 'Load demo data'}
                </button>
              )}
            </div>
          }
        />
      )}

      <NewGameModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}

