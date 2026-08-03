import { Link, Outlet, useParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import GameSwitcher from './GameSwitcher';
import TabNav from './TabNav';
import SignOutButton from '../auth/SignOutButton';
import { useGame } from '../../hooks/queries';
import Spinner from '../common/Spinner';

/**
 * Shell for the three game-scoped pages (Overview / Quarter / Sprint).
 * Shows the brand, the game switcher, the current game's name/icon and the 3 tabs.
 */
export default function GameShell() {
  const { gameId } = useParams();
  const { data: game, isLoading } = useGame(gameId ?? '');

  return (
    <div className="min-h-screen bg-ink-bg">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1720px] items-center gap-4 px-6 py-3 lg:px-10">
          <Link to="/games" className="flex items-center gap-2" title="All games">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <Home size={16} />
            </span>
            <span className="hidden text-sm font-bold text-ink sm:inline">
              Studio PM
            </span>
          </Link>

          <GameSwitcher />

          <div className="ml-auto flex items-center gap-3">
            {game && (
              <div className="hidden items-center gap-2 sm:flex">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: game.color }}
                />
                <span className="text-sm font-semibold text-ink">
                  {game.icon} {game.name}
                </span>
              </div>
            )}
            <TabNav />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1720px] px-6 py-6 lg:px-10">
        {isLoading ? <Spinner /> : <Outlet />}
      </main>
    </div>
  );
}
