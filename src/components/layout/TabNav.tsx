import { NavLink, useParams } from 'react-router-dom';

const TABS = [
  { to: (id: string) => `/games/${id}`, label: 'Overview', end: true },
  { to: (id: string) => `/games/${id}/quarter`, label: 'Quarter', end: false },
  { to: (id: string) => `/games/${id}/sprint`, label: 'Sprint', end: false },
];

export default function TabNav() {
  const { gameId } = useParams();
  if (!gameId) return null;
  return (
    <nav className="flex gap-1">
      {TABS.map((t) => (
        <NavLink
          key={t.label}
          to={t.to(gameId)}
          end={t.end}
          className={({ isActive }) =>
            `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? 'bg-white text-brand shadow-sm'
                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
