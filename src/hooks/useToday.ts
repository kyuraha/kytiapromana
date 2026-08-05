import { useQuery } from '@tanstack/react-query';
import { repo } from '../services';
import { useGames } from './queries';
import type { Feature, Game, Task } from '../lib/types';
import { todayDayName } from '../lib/format';

export interface TodayItem {
  task: Task;
  game: Game;
  feature?: Feature;
}

/**
 * Aggregates tasks scheduled for *today* across ALL games of the account,
 * enriching each with its game + feature (for badges). This powers the
 * cross-game Today panel under the Sprint screen.
 */
export function useTodayTasks() {
  const { data: games = [] } = useGames();
  const today = todayDayName();
  const gameIds = games.map((g) => g.id).join(',');

  return useQuery({
    queryKey: ['today', today, gameIds],
    enabled: games.length > 0,
    queryFn: async (): Promise<TodayItem[]> => {
      // Fetch across all games in parallel (not sequentially) for speed.
      const [allTaskLists, allFeatureLists] = await Promise.all([
        Promise.all(games.map((g) => repo.listTasks(g.id))),
        Promise.all(games.map((g) => repo.listFeatures(g.id))),
      ]);
      const all = allTaskLists.flat();
      const dayTasks = all.filter((t) => t.day === today);

      // Gather features for lookup.
      const features = allFeatureLists.flat();
      const featureById = new Map(features.map((f) => [f.id, f]));
      const gameById = new Map(games.map((g) => [g.id, g]));

      return dayTasks.map((task) => ({
        task,
        game: gameById.get(task.gameId)!,
        feature: featureById.get(task.featureId),
      }));
    },
  });
}
