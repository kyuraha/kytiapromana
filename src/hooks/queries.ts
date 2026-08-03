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
  Sprint,
  Task,
  TaskStatus,
  TrackType,
} from '../lib/types';

export const CURRENT_YEAR = new Date().getFullYear();

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

function useInvalidateGame(gameId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['games'] });
    [
      qk.metrics(gameId),
      qk.quarters(gameId),
      qk.features(gameId),
      qk.milestones(gameId),
      qk.sprints(gameId),
      qk.vision(gameId, CURRENT_YEAR),
      qk.tasks(getCurrentUid()),
    ].forEach((key) => qc.invalidateQueries({ queryKey: key }));
    qc.invalidateQueries({ queryKey: ['tasks'] });
    qc.invalidateQueries({ queryKey: ['today'] });
    qc.invalidateQueries({ queryKey: ['currentSprint'] });
  };
}

// ---------------- reads ----------------
export function useGames() {
  return useQuery({
    queryKey: qk.games,
    queryFn: () => repo.listGames(getCurrentUid()),

  });
}

export function useGame(gameId: string) {
  return useQuery({
    queryKey: qk.game(gameId),
    queryFn: () => repo.getGame(gameId),
    enabled: !!gameId,
  });
}

export function useVision(gameId: string, year: number) {
  return useQuery({
    queryKey: qk.vision(gameId, year),
    queryFn: () => repo.getVision(gameId, year),
    enabled: !!gameId,
  });
}

export function useMetrics(gameId: string) {
  return useQuery({
    queryKey: qk.metrics(gameId),
    queryFn: () => repo.listMetricsByGame(gameId),
    enabled: !!gameId,
  });
}

export function useQuarters(gameId: string) {
  return useQuery({
    queryKey: qk.quarters(gameId),
    queryFn: () => repo.listQuarters(gameId),
    enabled: !!gameId,
  });
}

export function useFeatures(gameId: string) {
  return useQuery({
    queryKey: qk.features(gameId),
    queryFn: () => repo.listFeatures(gameId),
    enabled: !!gameId,
  });
}

export function useMilestones(gameId: string) {
  return useQuery({
    queryKey: qk.milestones(gameId),
    queryFn: () => repo.listMilestones(gameId),
    enabled: !!gameId,
  });
}

export function useSprints(gameId: string) {
  return useQuery({
    queryKey: qk.sprints(gameId),
    queryFn: () => repo.listSprints(gameId),
    enabled: !!gameId,
  });
}

export function useCurrentSprint(gameId: string) {
  return useQuery({
    queryKey: ['currentSprint', gameId],
    queryFn: () => repo.getCurrentSprint(gameId),
    enabled: !!gameId,
  });
}

export function useTasks(gameId: string) {
  return useQuery({
    queryKey: qk.tasks(gameId),
    queryFn: () => repo.listTasks(gameId),
    enabled: !!gameId,
  });
}

export function useTasksBySprint(sprintId: string) {
  return useQuery({
    queryKey: qk.tasksSprint(sprintId),
    queryFn: () => repo.listTasksBySprint(sprintId),
    enabled: !!sprintId,
  });
}

// ---------------- game mutations ----------------
export function useSaveGame() {
  const qc = useQueryClient();
  return useMutation<Game | undefined, Error, { id?: string; data: Omit<Game, 'id' | 'createdAt' | 'userId'> }>({
    mutationFn: async (input) => {
      if (input.id) {
        await repo.updateGame(input.id, input.data);
        return undefined;
      }
      return repo.createGame({ ...input.data, userId: getCurrentUid() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  });
}

export function useDeleteGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gameId: string) => repo.deleteGame(gameId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
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
  return useMutation({
    mutationFn: () => repo.ensureQuartersForYear(gameId, CURRENT_YEAR),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.quarters(gameId) }),
  });
}

export function useAddFeature(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (input: {
      quarterId: string;
      data: {
        name: string;
        category: Feature['category'];
        trackType: TrackType;
        storyPoints: number;
      };
    }) => repo.addFeature(input.quarterId, gameId, input.data),
    onSuccess: invalidate,
  });
}

export function useUpdateFeature(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (input: { featureId: string; patch: Partial<Feature> }) =>
      repo.updateFeature(input.featureId, input.patch),
    onSuccess: invalidate,
  });
}

export function useDeleteFeature(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (featureId: string) => repo.deleteFeature(featureId),
    onSuccess: invalidate,
  });
}

export function useAddMilestone(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (input: {
      featureId: string;
      data: {
        name: string;
        targetStatement: string;
        criteria: string[];
        metricIds: string[];
      };
    }) => repo.addMilestone(input.featureId, gameId, input.data),
    onSuccess: invalidate,
  });
}

export function useUpdateMilestone(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (input: {
      milestoneId: string;
      patch: Partial<Milestone>;
    }) => repo.updateMilestone(input.milestoneId, input.patch),
    onSuccess: invalidate,
  });
}

export function useDeleteMilestone(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (milestoneId: string) => repo.deleteMilestone(milestoneId),
    onSuccess: invalidate,
  });
}

export function useCreateSprint(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: () => repo.createSprint(gameId),
    onSuccess: invalidate,
  });
}

export function useUpdateSprint(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (input: { sprintId: string; patch: Partial<Sprint> }) =>
      repo.updateSprint(input.sprintId, input.patch),
    onSuccess: invalidate,
  });
}

export function useCloseSprint(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (sprintId: string) => repo.closeSprint(gameId, sprintId),
    onSuccess: invalidate,
  });
}

export function useAddTask(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
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
    onSuccess: invalidate,
  });
}

export function useUpdateTask(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (input: { taskId: string; patch: Partial<Task> }) =>
      repo.updateTask(input.taskId, input.patch),
    onSuccess: invalidate,
  });
}

export function useToggleDone(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (taskId: string) => repo.toggleDone(taskId),
    onSuccess: invalidate,
  });
}

export function useMoveTaskDay(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (input: { taskId: string; day: Task['day'] }) =>
      repo.moveTaskDay(input.taskId, input.day),
    onSuccess: invalidate,
  });
}

export function useDeleteTask(gameId: string) {
  const invalidate = useInvalidateGame(gameId);
  return useMutation({
    mutationFn: (taskId: string) => repo.deleteTask(taskId),
    onSuccess: invalidate,
  });
}
