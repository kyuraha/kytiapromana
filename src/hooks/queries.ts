import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { repo } from '../services';
import { getCurrentUid } from '../lib/auth';
import type {
  Feature,
  Game,
  Metric,
  Milestone,
  Quarter,
  Sprint,
  Task,
  TaskStatus,
  TrackType,
} from '../lib/types';

export const CURRENT_YEAR = new Date().getFullYear();

// Reads can be served from cache for this long before a background refetch.
// This makes cross-screen navigation and the games list feel instant, while
// mutations still force refetches via explicit invalidation of their keys.
const STALE = 60_000;

const qk = {
  games: ['games'] as const,
  game: (id: string) => ['games', id] as const,
  vision: (gameId: string, year: number) =>
    ['vision', gameId, year] as const,
  metrics: (gameId: string) => ['metrics', gameId] as const,
  quarters: (gameId: string) => ['quarters', gameId] as const,
  features: (gameId: string) => ['features', gameId] as const,
  milestones: (gameId: string) => ['milestones', gameId] as const,
  sprints: (gameId: string) => ['sprints', gameId] as const,
  tasks: (userId: string) => ['tasks', userId] as const,
  tasksSprint: (sprintId: string) => ['tasks', 'sprint', sprintId] as const,
};

// Narrower invalidation for task-level mutations (board / days / today).
// Changing a task never affects features/agents/metrics/quarters/etc.,
// so we skip the full invalidate storm to keep sprint interactions fast.
//
// The `['tasks']` cache is invalidated with `refetchType: 'none'` on purpose:
// every task mutation already applies its change optimistically via
// `setQueryData` (and rolls back in `onError`), so forcing a background
// refetch here can resolve OUT OF ORDER over that newer optimistic value and
// snap a just-moved card back to its previous column. Marking the cache stale
// keeps the optimistic value authoritative while signalling other screens
// (Overview, GameRow) to refresh on their next mount.
function useInvalidateTasks() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
    qc.invalidateQueries({ queryKey: ['currentSprint'] });
    qc.invalidateQueries({ queryKey: ['today'] });
  };
}

// Generic invalidator for a set of query-key prefixes (e.g. ['features']).
// Partial invalidation refreshes only the caches that a mutation actually
// touches instead of the whole game, keeping interactions fast.
function useInvalidateKeys(prefixes: string[]) {
  const qc = useQueryClient();
  return () => {
    for (const p of prefixes) qc.invalidateQueries({ queryKey: [p] });
  };
}

// ---------------- reads ----------------
export function useGames() {
  return useQuery({
    queryKey: qk.games,
    queryFn: () => repo.listGames(getCurrentUid()),
    staleTime: STALE,
  });
}

export function useGame(gameId: string) {
  return useQuery({
    queryKey: qk.game(gameId),
    queryFn: () => repo.getGame(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useVision(gameId: string, year: number) {
  return useQuery({
    queryKey: qk.vision(gameId, year),
    queryFn: () => repo.getVision(gameId, year),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useMetrics(gameId: string) {
  return useQuery({
    queryKey: qk.metrics(gameId),
    queryFn: () => repo.listMetricsByGame(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useQuarters(gameId: string) {
  return useQuery({
    queryKey: qk.quarters(gameId),
    queryFn: () => repo.listQuarters(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useFeatures(gameId: string) {
  return useQuery({
    queryKey: qk.features(gameId),
    queryFn: () => repo.listFeatures(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useMilestones(gameId: string) {
  return useQuery({
    queryKey: qk.milestones(gameId),
    queryFn: () => repo.listMilestones(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useSprints(gameId: string) {
  return useQuery({
    queryKey: qk.sprints(gameId),
    queryFn: () => repo.listSprints(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useCurrentSprint(gameId: string) {
  return useQuery({
    queryKey: ['currentSprint', gameId],
    queryFn: () => repo.getCurrentSprint(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useTasks(gameId: string) {
  return useQuery({
    queryKey: qk.tasks(gameId),
    queryFn: () => repo.listTasks(gameId),
    enabled: !!gameId,
    staleTime: STALE,
  });
}

export function useTasksBySprint(sprintId: string) {
  return useQuery({
    queryKey: qk.tasksSprint(sprintId),
    queryFn: () => repo.listTasksBySprint(sprintId),
    enabled: !!sprintId,
    staleTime: STALE,
  });
}

// ---------------- game mutations ----------------
export function useSaveGame() {
  const qc = useQueryClient();
  const gamesKey = qk.games;
  return useMutation<Game | undefined, Error, { id?: string; data: Omit<Game, 'id' | 'createdAt' | 'userId'> }, { prev?: Game[] }>({
    mutationFn: async (input) => {
      if (input.id) {
        await repo.updateGame(input.id, input.data);
        return undefined;
      }
      return repo.createGame({ ...input.data, userId: getCurrentUid() });
    },
    // Optimistic: show the new/edited game immediately, then resync on settle.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['games'] });
      const prev = qc.getQueryData<Game[]>(gamesKey);
      if (input.id) {
        qc.setQueryData<Game[]>(gamesKey, (old = []) =>
          old.map((g) => (g.id === input.id ? { ...g, ...input.data } : g)),
        );
      } else {
        const temp: Game = {
          id: `temp-${Date.now()}`,
          ...input.data,
          userId: getCurrentUid(),
          createdAt: new Date().toISOString().slice(0, 10),
        };
        qc.setQueryData<Game[]>(gamesKey, (old = []) => [temp, ...old]);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(gamesKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['games'] }),
  });
}

export function useDeleteGame() {
  const qc = useQueryClient();
  const gamesKey = qk.games;
  return useMutation({
    mutationFn: (gameId: string) => repo.deleteGame(gameId),
    // Optimistic: remove the row immediately, restore on error.
    onMutate: async (gameId) => {
      await qc.cancelQueries({ queryKey: ['games'] });
      const prev = qc.getQueryData<Game[]>(gamesKey);
      qc.setQueryData<Game[]>(gamesKey, (old = []) =>
        old.filter((g) => g.id !== gameId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(gamesKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['games'] }),
  });
}

export function useEnsureVision(gameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => repo.ensureVision(gameId, CURRENT_YEAR),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.vision(gameId, CURRENT_YEAR) }),
  });
}

export function useAddMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      visionId: string;
      gameId: string;
      data: { name: string; unit: string; target: number };
    }) => repo.addMetric(input.visionId, input.gameId, input.data),
    onSuccess: (m) =>
      qc.invalidateQueries({ queryKey: qk.metrics(m.gameId) }),
  });
}

export function useUpdateMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { metricId: string; value: number }) =>
      repo.updateMetricCurrent(input.metricId, input.value),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: qk.metrics(m.gameId) });
      qc.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useEnsureQuarters(gameId: string) {
  const qc = useQueryClient();
  const quartersKey = qk.quarters(gameId);
  return useMutation({
    mutationFn: () => repo.ensureQuartersForYear(gameId, CURRENT_YEAR),
    // Write the ensured quarters straight into the cache instead of
    // invalidating+refetching: an invalidation would trigger a background
    // refetch whose result still reports the selected quarter as missing (it
    // wasn't there yet), re-firing the ensure effect forever.
    onSuccess: (created) => {
      qc.setQueryData<Quarter[]>(quartersKey, (old = []) => {
        const byId = new Map(old.map((q) => [q.id, q]));
        for (const q of created) byId.set(q.id, q);
        return [...byId.values()];
      });
    },
  });
}

export function useAddFeature(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateKeys(['features', 'today']);
  const featuresKey = qk.features(gameId);
  return useMutation({
    mutationFn: (input: {
      milestoneId: string;
      data: {
        name: string;
        category: Feature['category'];
        trackType: TrackType;
        storyPoints: number;
      };
    }) => repo.addFeature(input.milestoneId, gameId, input.data),
    // Optimistic: show the new feature immediately.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['features'] });
      const prev = qc.getQueryData<Feature[]>(featuresKey);
      const temp: Feature = {
        id: `temp-${Date.now()}`,
        milestoneId: input.milestoneId,
        gameId,
        name: input.data.name,
        category: input.data.category,
        trackType: input.data.trackType,
        storyPoints: input.data.storyPoints,
      };
      qc.setQueryData<Feature[]>(featuresKey, (old = []) => [temp, ...old]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(featuresKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useUpdateFeature(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateKeys(['features', 'today']);
  const featuresKey = qk.features(gameId);
  return useMutation({
    mutationFn: (input: { featureId: string; patch: Partial<Feature> }) =>
      repo.updateFeature(input.featureId, input.patch),
    // Optimistic: apply the edit immediately.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['features'] });
      const prev = qc.getQueryData<Feature[]>(featuresKey);
      qc.setQueryData<Feature[]>(featuresKey, (old = []) =>
        old.map((f) => (f.id === input.featureId ? { ...f, ...input.patch } : f)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(featuresKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useDeleteFeature(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateKeys(['features', 'today']);
  const featuresKey = qk.features(gameId);
  return useMutation({
    mutationFn: (featureId: string) => repo.deleteFeature(featureId),
    // Optimistic: remove the feature immediately.
    onMutate: async (featureId) => {
      await qc.cancelQueries({ queryKey: ['features'] });
      const prev = qc.getQueryData<Feature[]>(featuresKey);
      qc.setQueryData<Feature[]>(featuresKey, (old = []) =>
        old.filter((f) => f.id !== featureId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(featuresKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useAddMilestone(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateKeys(['milestones']);
  const milestonesKey = qk.milestones(gameId);
  return useMutation({
    mutationFn: (input: {
      quarterId: string;
      data: {
        name: string;
        targetStatement: string;
        criteria: string[];
        metricIds: string[];
      };
    }) => repo.addMilestone(input.quarterId, gameId, input.data),
    // Optimistic: show the new milestone immediately.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['milestones'] });
      const prev = qc.getQueryData<Milestone[]>(milestonesKey);
      const temp: Milestone = {
        id: `temp-${Date.now()}`,
        quarterId: input.quarterId,
        gameId,
        name: input.data.name,
        targetStatement: input.data.targetStatement,
        criteria: input.data.criteria,
        status: 'planned',
        metricIds: input.data.metricIds,
      };
      qc.setQueryData<Milestone[]>(milestonesKey, (old = []) => [temp, ...old]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(milestonesKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useUpdateMilestone(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateKeys(['milestones']);
  const milestonesKey = qk.milestones(gameId);
  return useMutation({
    mutationFn: (input: {
      milestoneId: string;
      patch: Partial<Milestone>;
    }) => repo.updateMilestone(input.milestoneId, input.patch),
    // Optimistic: apply the status/field edit immediately.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['milestones'] });
      const prev = qc.getQueryData<Milestone[]>(milestonesKey);
      qc.setQueryData<Milestone[]>(milestonesKey, (old = []) =>
        old.map((m) =>
          m.id === input.milestoneId ? { ...m, ...input.patch } : m,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(milestonesKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useDeleteMilestone(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateKeys(['milestones', 'features']);
  const milestonesKey = qk.milestones(gameId);
  const featuresKey = qk.features(gameId);
  return useMutation({
    mutationFn: (milestoneId: string) => repo.deleteMilestone(milestoneId),
    // Optimistic: remove the milestone and its features immediately.
    onMutate: async (milestoneId) => {
      await qc.cancelQueries({ queryKey: ['milestones'] });
      await qc.cancelQueries({ queryKey: ['features'] });
      const prevM = qc.getQueryData<Milestone[]>(milestonesKey);
      const prevF = qc.getQueryData<Feature[]>(featuresKey);
      qc.setQueryData<Milestone[]>(milestonesKey, (old = []) =>
        old.filter((m) => m.id !== milestoneId),
      );
      qc.setQueryData<Feature[]>(featuresKey, (old = []) =>
        old.filter((f) => f.milestoneId !== milestoneId),
      );
      return { prevM, prevF };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevM) qc.setQueryData(milestonesKey, ctx.prevM);
      if (ctx?.prevF) qc.setQueryData(featuresKey, ctx.prevF);
    },
    onSettled: invalidate,
  });
}

export function useCreateSprint(gameId: string) {
  const invalidate = useInvalidateKeys([
    'sprints',
    'currentSprint',
    'tasks',
    'today',
    'games',
  ]);
  return useMutation({
    mutationFn: () => repo.createSprint(gameId),
    onSuccess: invalidate,
  });
}

export function useUpdateSprint(gameId: string) {
  const invalidate = useInvalidateKeys(['sprints', 'currentSprint', 'games']);
  return useMutation({
    mutationFn: (input: { sprintId: string; patch: Partial<Sprint> }) =>
      repo.updateSprint(input.sprintId, input.patch),
    onSuccess: invalidate,
  });
}

export function useCloseSprint(gameId: string) {
  const invalidate = useInvalidateKeys([
    'sprints',
    'currentSprint',
    'tasks',
    'today',
    'games',
  ]);
  return useMutation({
    mutationFn: (sprintId: string) => repo.closeSprint(gameId, sprintId),
    onSuccess: invalidate,
  });
}

export function useAddTask(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  const tasksKey = qk.tasks(gameId);
  return useMutation({
    mutationFn: (input: {
      sprintId: string;
      featureId: string;
      title: string;
      status: TaskStatus;
      day?: Task['day'];
      isBacklog: boolean;
      note?: string;
    }) => repo.addTask({ ...input, gameId }),
    // Optimistic: insert a temp card immediately, then resync on settle.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(tasksKey);
      const temp: Task = {
        id: `temp-${Date.now()}`,
        sprintId: input.sprintId,
        featureId: input.featureId,
        gameId,
        title: input.title,
        status: input.status,
        day: input.day,
        isBacklog: input.isBacklog,
        note: input.note,
      };
      qc.setQueryData<Task[]>(tasksKey, (old = []) => [temp, ...old]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(tasksKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useUpdateTask(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  const tasksKey = qk.tasks(gameId);
  return useMutation({
    mutationFn: (input: { taskId: string; patch: Partial<Task> }) =>
      repo.updateTask(input.taskId, input.patch),
    // Optimistic: apply the patch to the cached task immediately.
    // The cache update is applied BEFORE the awaited cancel so it runs in the
    // same synchronous tick as the drag overlay being dismissed. Awaiting the
    // cancel first deferred setQueryData to a microtask, which let the dragged
    // card flash back to its original column before settling into the new one.
    onMutate: async (input) => {
      const prev = qc.getQueryData<Task[]>(tasksKey);
      qc.setQueryData<Task[]>(tasksKey, (old = []) =>
        old.map((t) => (t.id === input.taskId ? { ...t, ...input.patch } : t)),
      );
      // Cancel any in-flight reads afterwards so they can't overwrite the
      // optimistic value with stale data.
      await qc.cancelQueries({ queryKey: ['tasks'] });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(tasksKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useToggleDone(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  const tasksKey = qk.tasks(gameId);
  return useMutation({
    mutationFn: (taskId: string) => repo.toggleDone(taskId),
    // Optimistic: flip the status in the cache straight away.
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(tasksKey);
      qc.setQueryData<Task[]>(tasksKey, (old = []) =>
        old.map((t) =>
          t.id === taskId
            ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(tasksKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useMoveTaskDay(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  const tasksKey = qk.tasks(gameId);
  return useMutation({
    mutationFn: (input: { taskId: string; day: Task['day'] }) =>
      repo.moveTaskDay(input.taskId, input.day),
    // Optimistic: drop the card onto the target day immediately.
    // Like useUpdateTask, apply the cache update synchronously (before any
    // await) so the card lands on the target day in the same render as the
    // drag overlay disappears, instead of flashing back to the old day first.
    onMutate: async (input) => {
      const prev = qc.getQueryData<Task[]>(tasksKey);
      qc.setQueryData<Task[]>(tasksKey, (old = []) =>
        old.map((t) =>
          t.id === input.taskId
            ? { ...t, day: input.day, isBacklog: input.day === undefined }
            : t,
        ),
      );
      // Cancel any in-flight reads afterwards so they can't overwrite the
      // optimistic value with stale data.
      await qc.cancelQueries({ queryKey: ['tasks'] });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(tasksKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}

export function useDeleteTask(gameId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  const tasksKey = qk.tasks(gameId);
  return useMutation({
    mutationFn: (taskId: string) => repo.deleteTask(taskId),
    // Optimistic: remove the card immediately.
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(tasksKey);
      qc.setQueryData<Task[]>(tasksKey, (old = []) =>
        old.filter((t) => t.id !== taskId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(tasksKey, ctx.prev);
    },
    onSettled: invalidate,
  });
}
