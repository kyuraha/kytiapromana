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
import type { Repo } from './repo';
import { buildSeed, type SeedDatabase } from './seed';

// A small localStorage-backed "local-first" implementation of the Repo.
// It simulates async latency so TanStack Query behaviour feels realistic, and
// persists everything to localStorage so the demo survives reloads (this is the
// "local cache" of §10.7, minus the service worker).

const DB_KEY = 'kytia-db-v1';
const LATENCY = 90;

function delay(ms = LATENCY): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

type Trend = Metric['trend'];

function computeTrend(history: { value: number }[]): Trend {
  if (history.length < 2) return 'flat';
  const first = history[0].value;
  const last = history[history.length - 1].value;
  const diff = last - first;
  const pct = first === 0 ? 0 : diff / first;
  if (pct > 0.02) return 'up';
  if (pct < -0.02) return 'down';
  return 'flat';
}

export class MockRepo implements Repo {
  private db: SeedDatabase;

  constructor() {
    this.db = this.load();
  }

  private load(): SeedDatabase {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw) as SeedDatabase;
    } catch {
      /* ignore corrupt cache */
    }
    const seeded = buildSeed();
    this.persist(seeded);
    return seeded;
  }

  private persist(db: SeedDatabase) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      /* quota exceeded — ignore for mock */
    }
  }

  private mutate(fn: (db: SeedDatabase) => void): Promise<void> {
    const next: SeedDatabase = JSON.parse(JSON.stringify(this.db));
    fn(next);
    this.db = next;
    this.persist(next);
    return delay();
  }

  // ---------------- games ----------------
  async listGames(userId: string): Promise<Game[]> {
    await delay();
    return this.db.games.filter((g) => g.userId === userId);
  }

  async getGame(gameId: string): Promise<Game | null> {
    await delay();
    return this.db.games.find((g) => g.id === gameId) ?? null;
  }

  async createGame(
    data: Omit<Game, 'id' | 'createdAt'>,
  ): Promise<Game> {
    const game: Game = {
      ...data,
      id: uid('game'),
      createdAt: today(),
    };
    await this.mutate((db) => {
      db.games.push(game);
    });
    return game;
  }

  async updateGame(
    gameId: string,
    patch: Partial<Game>,
  ): Promise<void> {
    await this.mutate((db) => {
      const g = db.games.find((x) => x.id === gameId);
      if (g) Object.assign(g, patch);
    });
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.mutate((db) => {
      db.games = db.games.filter((x) => x.id !== gameId);
      db.visions = db.visions.filter((x) => x.gameId !== gameId);
      db.metrics = db.metrics.filter((x) => x.gameId !== gameId);
      db.quarters = db.quarters.filter((x) => x.gameId !== gameId);
      db.features = db.features.filter((x) => x.gameId !== gameId);
      db.milestones = db.milestones.filter((x) => x.gameId !== gameId);
      db.sprints = db.sprints.filter((x) => x.gameId !== gameId);
      db.tasks = db.tasks.filter((x) => x.gameId !== gameId);
    });
  }

  // ---------------- vision & metrics ----------------
  async getVision(
    gameId: string,
    year: number,
  ): Promise<Vision | null> {
    await delay();
    return (
      this.db.visions.find((v) => v.gameId === gameId && v.year === year) ??
      null
    );
  }

  async ensureVision(gameId: string, year: number): Promise<Vision> {
    const existing = await this.getVision(gameId, year);
    if (existing) return existing;
    const vision: Vision = {
      id: uid('vision'),
      gameId,
      year,
      northStarId: '',
    };
    await this.mutate((db) => {
      db.visions.push(vision);
    });
    return vision;
  }

  async listMetricsByGame(gameId: string): Promise<Metric[]> {
    await delay();
    return this.db.metrics.filter((m) => m.gameId === gameId);
  }

  async addMetric(
    visionId: string,
    gameId: string,
    data: { name: string; unit: string; target: number },
  ): Promise<Metric> {
    const metric: Metric = {
      id: uid('m'),
      visionId,
      gameId,
      name: data.name,
      unit: data.unit,
      target: data.target,
      current: 0,
      trend: 'flat',
      history: [],
      contributorMilestoneIds: [],
    };
    await this.mutate((db) => {
      db.metrics.push(metric);
    });
    return metric;
  }

  async updateMetricCurrent(
    metricId: string,
    value: number,
  ): Promise<Metric> {
    let updated: Metric | null = null;
    await this.mutate((db) => {
      const m = db.metrics.find((x) => x.id === metricId);
      if (m) {
        m.current = value;
        m.history.push({ date: today(), value });
        m.trend = computeTrend(m.history);
        updated = m;
      }
    });
    if (!updated) throw new Error('Metric not found');
    return updated;
  }

  // ---------------- quarters ----------------
  async listQuarters(gameId: string): Promise<Quarter[]> {
    await delay();
    return this.db.quarters.filter((q) => q.gameId === gameId);
  }

  async getQuarter(
    gameId: string,
    year: number,
    quarter: QuarterName,
  ): Promise<Quarter | null> {
    await delay();
    return (
      this.db.quarters.find(
        (q) =>
          q.gameId === gameId &&
          q.year === year &&
          q.quarter === quarter,
      ) ?? null
    );
  }

  async ensureQuartersForYear(
    gameId: string,
    year: number,
  ): Promise<Quarter[]> {
    const existing = await this.listQuarters(gameId);
    if (existing.some((q) => q.year === year)) {
      return existing.filter((q) => q.year === year);
    }
    const created: Quarter[] = [];
    const user = this.db.games.find((g) => g.id === gameId)?.userId ?? '';
    await this.mutate((db) => {
      (['Q1', 'Q2', 'Q3', 'Q4'] as QuarterName[]).forEach((q) => {
        const quarter: Quarter = {
          id: uid('q'),
          gameId,
          userId: user,
          year,
          quarter: q,
        };
        db.quarters.push(quarter);
        created.push(quarter);
      });
    });
    return created;
  }

  // ---------------- features ----------------
  async listFeatures(gameId: string): Promise<Feature[]> {
    await delay();
    return this.db.features.filter((f) => f.gameId === gameId);
  }

  async addFeature(
    quarterId: string,
    gameId: string,
    data: {
      name: string;
      category: Feature['category'];
      trackType: Feature['trackType'];
      storyPoints: number;
    },
  ): Promise<Feature> {
    const feature: Feature = {
      id: uid('f'),
      quarterId,
      gameId,
      name: data.name,
      category: data.category,
      trackType: data.trackType,
      storyPoints: data.storyPoints,
    };
    await this.mutate((db) => {
      db.features.push(feature);
    });
    return feature;
  }

  async updateFeature(
    featureId: string,
    patch: Partial<Feature>,
  ): Promise<void> {
    await this.mutate((db) => {
      const f = db.features.find((x) => x.id === featureId);
      if (f) Object.assign(f, patch);
    });
  }

  async deleteFeature(featureId: string): Promise<void> {
    await this.mutate((db) => {
      db.features = db.features.filter((x) => x.id !== featureId);
      const f = db.features.find((x) => x.id === featureId);
      if (f) return;
      db.milestones = db.milestones.filter(
        (m) => m.featureId !== featureId,
      );
    });
  }

  // ---------------- milestones ----------------
  async listMilestones(gameId: string): Promise<Milestone[]> {
    await delay();
    return this.db.milestones.filter((m) => m.gameId === gameId);
  }

  async addMilestone(
    featureId: string,
    gameId: string,
    data: {
      name: string;
      targetStatement: string;
      criteria: string[];
      metricIds: string[];
    },
  ): Promise<Milestone> {
    const milestone: Milestone = {
      id: uid('ml'),
      featureId,
      gameId,
      name: data.name,
      targetStatement: data.targetStatement,
      criteria: data.criteria,
      status: 'planned',
      metricIds: data.metricIds,
    };
    await this.mutate((db) => {
      db.milestones.push(milestone);
    });
    return milestone;
  }

  async updateMilestone(
    milestoneId: string,
    patch: Partial<Milestone>,
  ): Promise<void> {
    await this.mutate((db) => {
      const m = db.milestones.find((x) => x.id === milestoneId);
      if (m) Object.assign(m, patch);
    });
  }

  async deleteMilestone(milestoneId: string): Promise<void> {
    await this.mutate((db) => {
      db.milestones = db.milestones.filter(
        (x) => x.id !== milestoneId,
      );
    });
  }

  // ---------------- sprints ----------------
  async listSprints(gameId: string): Promise<Sprint[]> {
    await delay();
    return this.db.sprints
      .filter((s) => s.gameId === gameId)
      .sort((a, b) => b.number - a.number);
  }

  async getCurrentSprint(
    gameId: string,
    _date?: string,
  ): Promise<Sprint | null> {
    await delay();
    const open = this.db.sprints
      .filter((s) => s.gameId === gameId && s.status !== 'closed')
      .sort((a, b) => b.number - a.number);
    return open[0] ?? null;
  }

  async createSprint(gameId: string): Promise<Sprint> {
    const sprints = this.db.sprints
      .filter((s) => s.gameId === gameId)
      .sort((a, b) => b.number - a.number);
    const last = sprints[0];
    const nextNumber = last ? last.number + 1 : 1;
    const user = this.db.games.find((g) => g.id === gameId)?.userId ?? '';
    // Start on the Monday following the last sprint's end (or this week's Monday).
    const from = last ? addDays(last.endDate, 1) : mondayOf(new Date());
    const start = mondayOf(new Date(from + 'T00:00:00'));
    const sprint: Sprint = {
      id: uid('s'),
      gameId,
      userId: user,
      number: nextNumber,
      startDate: start,
      endDate: addDays(start, 6),
      goal: '',
      status: 'planned',
      milestoneIds: last?.milestoneIds ?? [],
    };
    await this.mutate((db) => {
      db.sprints.push(sprint);
    });
    return sprint;
  }

  async updateSprint(
    sprintId: string,
    patch: Partial<Sprint>,
  ): Promise<void> {
    await this.mutate((db) => {
      const s = db.sprints.find((x) => x.id === sprintId);
      if (s) Object.assign(s, patch);
    });
  }

  async closeSprint(gameId: string, sprintId: string): Promise<Sprint> {
    let closed: Sprint | null = null;
    await this.mutate((db) => {
      const sprint = db.sprints.find((s) => s.id === sprintId);
      if (!sprint) return;
      sprint.status = 'closed';

      const tasks = db.tasks.filter((t) => t.sprintId === sprintId);
      db.tasks = db.tasks.filter((t) => t.sprintId !== sprintId);

      // Create the next sprint first so in-progress tasks can be moved into it.
      const nextNumber = sprint.number + 1;
      const start = mondayOf(new Date(addDays(sprint.endDate, 1) + 'T00:00:00'));
      const next: Sprint = {
        id: uid('s'),
        gameId,
        userId: sprint.userId,
        number: nextNumber,
        startDate: start,
        endDate: addDays(start, 6),
        goal: '',
        status: 'planned',
        milestoneIds: sprint.milestoneIds,
      };
      db.sprints.push(next);

      for (const t of tasks) {
        if (t.status === 'done') continue; // done → deleted
        if (t.status === 'doing') {
          // doing → carry to next sprint, keep status
          db.tasks.push({ ...t, id: t.id, sprintId: next.id });
        } else {
          // todo → back to backlog
          db.tasks.push({
            ...t,
            id: t.id,
            sprintId: next.id,
            isBacklog: true,
            day: undefined,
            status: 'todo',
          });
        }
      }
      closed = sprint;
    });
    if (!closed) throw new Error('Sprint not found');
    return closed;
  }

  // ---------------- tasks ----------------
  async listTasks(gameId: string): Promise<Task[]> {
    await delay();
    return this.db.tasks.filter((t) => t.gameId === gameId);
  }

  async listTasksBySprint(sprintId: string): Promise<Task[]> {
    await delay();
    return this.db.tasks.filter((t) => t.sprintId === sprintId);
  }

  async addTask(data: {
    sprintId: string;
    featureId: string;
    gameId: string;
    title: string;
    status: TaskStatus;
    day?: Task['day'];
    isBacklog: boolean;
    note?: string;
  }): Promise<Task> {
    const task: Task = {
      id: uid('t'),
      sprintId: data.sprintId,
      featureId: data.featureId,
      gameId: data.gameId,
      title: data.title,
      status: data.status,
      day: data.day,
      isBacklog: data.isBacklog,
      note: data.note,
    };
    await this.mutate((db) => {
      db.tasks.push(task);
    });
    return task;
  }

  async updateTask(
    taskId: string,
    patch: Partial<Task>,
  ): Promise<void> {
    await this.mutate((db) => {
      const t = db.tasks.find((x) => x.id === taskId);
      if (t) Object.assign(t, patch);
    });
  }

  async toggleDone(taskId: string): Promise<void> {
    await this.mutate((db) => {
      const t = db.tasks.find((x) => x.id === taskId);
      if (t) {
        t.status = t.status === 'done' ? 'todo' : 'done';
      }
    });
  }

  async moveTaskDay(taskId: string, day: Task['day']): Promise<void> {
    await this.mutate((db) => {
      const t = db.tasks.find((x) => x.id === taskId);
      if (t) {
        t.day = day;
        t.isBacklog = day === undefined ? true : false;
      }
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.mutate((db) => {
      db.tasks = db.tasks.filter((x) => x.id !== taskId);
    });
  }
}

function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
