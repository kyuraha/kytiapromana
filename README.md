# Studio PM — game/project management

A single-account, multi-game project management web app built from the design
document in `DESIGN.md` (the provided spec). Each game/project is managed
through **one screen**: **Vision** (yearly, metrics only) → **Quarter**
(features & milestones) → **Sprint** (weekly, with delivered work), using a
hybrid **Waterfall** (assets / marketing / finance) × **Agile** (code) model.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS v3
- React Router v6
- TanStack Query v5 (cache + revalidate)
- @dnd-kit (kanban & day-table drag & drop)
- dayjs (dates) · lucide-react (icons)
- Firebase (optional — see below)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build
```

### Data backend: local "mock" mode (default)

No Firebase credentials are needed. The app runs against a localStorage-backed
`Repo` (see `src/services/mockRepo.ts`) seeded with demo data from
`src/services/seed.ts` (matching Appendix H). Everything persists across
reloads, so you get a fully working, offline-friendly demo.

> Want a fresh seed? In the browser devtools run
> `localStorage.removeItem('kytia-db-v1')` and reload.

### Enabling real Firebase/Firestore

1. Set the `VITE_FIREBASE_*` vars in `.env` (see `.env.example`).
2. Implement `src/services/repo.ts` (`Repo`) against Firestore using the schema
   in §10.2 (games, visions, metrics, quarters, features, milestones, sprints,
   tasks — each with a `userId`).
3. Deploy rules + indexes: `npx firebase deploy --only firestore`
   (`firestore.rules`, `firestore.indexes.json`).
4. Host: `npm run build && npx firebase deploy --only hosting`.

## Project structure

```
src/
  lib/        types, constants, formatting, firebase config
  services/   repo interface + localStorage mock + seed
  hooks/      TanStack Query hooks (queries + mutations), useToday
  components/ layout, games, overview, quarter, sprint, common
  pages/      GamesPage, OverviewPage, QuarterPage, SprintPage
```

## Routing

- `/` → `/games`
- `/games` — list & create games (goal, position, this week)
- `/games/:id` — Overview (Vision scoreboard + quarter position + this week)
- `/games/:id/quarter` — features & milestones in Q1–Q4 (filters by track/status)
- `/games/:id/sprint` — work screen: Board (kanban) / Days (day table) + Today panel

## Key behaviours

- **Close Sprint** resets: `done` tasks are deleted, `doing` carries to the next
  sprint, `todo` returns to the backlog, and a new sprint is created (goal &
  retro of the closed sprint remain).
- **Metric update** pushes a `{date, value}` snapshot to history and recomputes
  the trend automatically.
- **Today panel** aggregates tasks scheduled for today across all games.
