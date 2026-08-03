import type {
  Feature,
  Game,
  Metric,
  Milestone,
  Quarter,
  QuarterName,
  Sprint,
  Task,
  TaskStatus,
  Vision,
} from '../lib/types';

/**
 * The repository interface abstracts the data backend. Both the local mock and
 * (future) Firebase implementations satisfy it. All reads are async so the
 * interface works both for a local cache and a remote database.
 *
 * Every object in this app carries a `gameId` (and top-level ones carry
 * `userId`) so the schema is ready for multi-user later.
 */
export interface Repo {
  // ---- games
  listGames(userId: string): Promise<Game[]>;
  getGame(gameId: string): Promise<Game | null>;
  createGame(
    data: Omit<Game, 'id' | 'createdAt'>,
  ): Promise<Game>;
  updateGame(gameId: string, patch: Partial<Game>): Promise<void>;
  deleteGame(gameId: string): Promise<void>;

  // ---- vision & metrics
  getVision(gameId: string, year: number): Promise<Vision | null>;
  ensureVision(gameId: string, year: number): Promise<Vision>;
  listMetricsByGame(gameId: string): Promise<Metric[]>;
  addMetric(
    visionId: string,
    gameId: string,
    data: { name: string; unit: string; target: number },
  ): Promise<Metric>;
  updateMetricCurrent(
    metricId: string,
    value: number,
  ): Promise<Metric>;

  // ---- quarters
  listQuarters(gameId: string): Promise<Quarter[]>;
  getQuarter(gameId: string, year: number, quarter: QuarterName): Promise<Quarter | null>;
  ensureQuartersForYear(gameId: string, year: number): Promise<Quarter[]>;

  // ---- features
  listFeatures(gameId: string): Promise<Feature[]>;
  addFeature(
    quarterId: string,
    gameId: string,
    data: {
      name: string;
      category: Feature['category'];
      trackType: Feature['trackType'];
      storyPoints: number;
    },
  ): Promise<Feature>;
  updateFeature(featureId: string, patch: Partial<Feature>): Promise<void>;
  deleteFeature(featureId: string): Promise<void>;

  // ---- milestones
  listMilestones(gameId: string): Promise<Milestone[]>;
  addMilestone(
    featureId: string,
    gameId: string,
    data: {
      name: string;
      targetStatement: string;
      criteria: string[];
      metricIds: string[];
    },
  ): Promise<Milestone>;
  updateMilestone(milestoneId: string, patch: Partial<Milestone>): Promise<void>;
  deleteMilestone(milestoneId: string): Promise<void>;

  // ---- sprints
  listSprints(gameId: string): Promise<Sprint[]>;
  getCurrentSprint(gameId: string, date?: string): Promise<Sprint | null>;
  createSprint(gameId: string): Promise<Sprint>;
  updateSprint(sprintId: string, patch: Partial<Sprint>): Promise<void>;
  closeSprint(gameId: string, sprintId: string): Promise<Sprint>;

  // ---- tasks
  listTasks(gameId: string): Promise<Task[]>;
  listTasksBySprint(sprintId: string): Promise<Task[]>;
  addTask(
    data: {
      sprintId: string;
      featureId: string;
      gameId: string;
      title: string;
      status: TaskStatus;
      day?: Task['day'];
      isBacklog: boolean;
      note?: string;
    },
  ): Promise<Task>;
  updateTask(taskId: string, patch: Partial<Task>): Promise<void>;
  toggleDone(taskId: string): Promise<void>;
  moveTaskDay(taskId: string, day: Task['day']): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}
