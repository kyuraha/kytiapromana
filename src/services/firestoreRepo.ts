import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { getCurrentUid } from '../lib/auth';
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

// Firestore-backed implementation of `Repo`.
//
// Every document carries `userId` so the security rules
// (`resource.data.userId == request.auth.uid`) pass. Collection names and the
// shape mirror §10.2. NaN / undefined are stripped before writes (Firestore
// rejects them), so `undefined` fields are removed.

const C = {
  games: 'games',
  visions: 'visions',
  metrics: 'metrics',
  quarters: 'quarters',
  features: 'features',
  milestones: 'milestones',
  sprints: 'sprints',
  tasks: 'tasks',
};

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

function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

// Firestore can't store `undefined` or `NaN`; strip them for writes.
function clean<T>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === undefined || (typeof v === 'number' && Number.isNaN(v))) continue;
    out[k] = v;
  }
  return out;
}

function snapTo<T>(snap: DocumentData): T {
  const { userId: _userId, ...rest } = snap as Record<string, unknown>;
  const id = (snap as { id?: string }).id as string;
  return { ...(rest as T), id } as T;
}

type Trend = Metric['trend'];
function computeTrend(history: { value: number }[]): Trend {
  if (history.length < 2) return 'flat';
  const first = history[0].value;
  const last = history[history.length - 1].value;
  const pct = first === 0 ? 0 : (last - first) / first;
  if (pct > 0.02) return 'up';
  if (pct < -0.02) return 'down';
  return 'flat';
}

async function allDocs<T>(col: string, q: ReturnType<typeof query>): Promise<T[]> {
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    snapTo<T>({ ...(d.data() as DocumentData), id: d.id }),
  );
}

export class FirestoreRepo implements Repo {
  // ---------------- games ----------------
  async listGames(userId: string): Promise<Game[]> {
    const db = getDb()!;
    const q = query(collection(db, C.games), where('userId', '==', userId));
    return allDocs<Game>(C.games, q);
  }

  async getGame(gameId: string): Promise<Game | null> {
    const db = getDb()!;
    const snap = await getDoc(doc(db, C.games, gameId));
    if (!snap.exists()) return null;
    return snapTo<Game>({ ...snap.data(), id: snap.id });
  }

  async createGame(data: Omit<Game, 'id' | 'createdAt'>): Promise<Game> {
    const db = getDb()!;
    const id = uid('game');
    const game: Game = { ...data, id, createdAt: today() };
    await setDoc(doc(db, C.games, id), clean({ ...game, userId: getCurrentUid() }));
    return game;
  }

  async updateGame(gameId: string, patch: Partial<Game>): Promise<void> {
    const db = getDb()!;
    await updateDoc(doc(db, C.games, gameId), { ...clean(patch), userId: getCurrentUid() });
  }

  async deleteGame(gameId: string): Promise<void> {
    const db = getDb()!;
    const uidUser = getCurrentUid();
    const batch = writeBatch(db);
    const children: { col: string; field: string }[] = [
      { col: C.visions, field: 'gameId' },
      { col: C.metrics, field: 'gameId' },
      { col: C.quarters, field: 'gameId' },
      { col: C.features, field: 'gameId' },
      { col: C.milestones, field: 'gameId' },
      { col: C.sprints, field: 'gameId' },
      { col: C.tasks, field: 'gameId' },
    ];
    for (const { col, field } of children) {
      const snap = await getDocs(
        query(collection(db, col), where('userId', '==', uidUser)),
      );
      snap.docs
        .filter((d) => d.data()[field] === gameId)
        .forEach((d) => batch.delete(d.ref));
    }
    batch.delete(doc(db, C.games, gameId));
    await batch.commit();
  }

  // ---------------- vision & metrics ----------------
  async getVision(gameId: string, year: number): Promise<Vision | null> {
    const db = getDb()!;
    // Filter by userId so the security rule (`resource.data.userId == uid`)
    // is satisfied by the query itself — otherwise Firestore denies the read.
    const q = query(collection(db, C.visions), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Vision>(C.visions, q);
    return list.find((v) => v.gameId === gameId && v.year === year) ?? null;
  }

  async ensureVision(gameId: string, year: number): Promise<Vision> {
    const existing = await this.getVision(gameId, year);
    if (existing) return existing;
    const id = uid('vision');
    const vision: Vision = { id, gameId, year, northStarId: '' };
    await setDoc(doc(getDb()!, C.visions, id), {
      ...clean(vision),
      userId: getCurrentUid(),
    });
    return vision;
  }

  async listMetricsByGame(gameId: string): Promise<Metric[]> {
    const db = getDb()!;
    const q = query(collection(db, C.metrics), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Metric>(C.metrics, q);
    return list.filter((m) => m.gameId === gameId);
  }

  async addMetric(
    visionId: string,
    gameId: string,
    data: { name: string; unit: string; target: number },
  ): Promise<Metric> {
    const db = getDb()!;
    const id = uid('m');
    const metric: Metric = {
      id,
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
    await setDoc(doc(db, C.metrics, id), { ...clean(metric), userId: getCurrentUid() });
    return metric;
  }

  async updateMetricCurrent(metricId: string, value: number): Promise<Metric> {
    const db = getDb()!;
    const ref = doc(db, C.metrics, metricId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Metric not found');
    const metric = snapTo<Metric>({ ...snap.data(), id: snap.id });
    metric.current = value;
    metric.history = [...metric.history, { date: today(), value }];
    metric.trend = computeTrend(metric.history);
    await updateDoc(ref, { ...clean(metric), userId: getCurrentUid() });
    return metric;
  }

  // ---------------- quarters ----------------
  async listQuarters(gameId: string): Promise<Quarter[]> {
    const db = getDb()!;
    const q = query(collection(db, C.quarters), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Quarter>(C.quarters, q);
    return list.filter((x) => x.gameId === gameId);
  }

  async getQuarter(
    gameId: string,
    year: number,
    quarter: QuarterName,
  ): Promise<Quarter | null> {
    const db = getDb()!;
    const q = query(collection(db, C.quarters), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Quarter>(C.quarters, q);
    return (
      list.find((x) => x.gameId === gameId && x.year === year && x.quarter === quarter) ??
      null
    );
  }

  async ensureQuartersForYear(gameId: string, year: number): Promise<Quarter[]> {
    const existing = await this.listQuarters(gameId);
    const yearOnes = existing.filter((q) => q.year === year);
    if (yearOnes.length) return yearOnes;
    const db = getDb()!;
    const created: Quarter[] = [];
    const batch = writeBatch(db);
    (['Q1', 'Q2', 'Q3', 'Q4'] as QuarterName[]).forEach((q) => {
      const id = uid('q');
      const quarter: Quarter = { id, gameId, userId: getCurrentUid(), year, quarter: q };
      batch.set(doc(db, C.quarters, id), clean(quarter));
      created.push(quarter);
    });
    await batch.commit();
    return created;
  }

  // ---------------- features ----------------
  async listFeatures(gameId: string): Promise<Feature[]> {
    const db = getDb()!;
    const q = query(collection(db, C.features), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Feature>(C.features, q);
    return list.filter((f) => f.gameId === gameId);
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
    const db = getDb()!;
    const id = uid('f');
    const feature: Feature = {
      id,
      quarterId,
      gameId,
      name: data.name,
      category: data.category,
      trackType: data.trackType,
      storyPoints: data.storyPoints,
    };
    await setDoc(doc(db, C.features, id), { ...clean(feature), userId: getCurrentUid() });
    return feature;
  }

  async updateFeature(featureId: string, patch: Partial<Feature>): Promise<void> {
    const db = getDb()!;
    await updateDoc(doc(db, C.features, featureId), clean(patch));
  }

  async deleteFeature(featureId: string): Promise<void> {
    const db = getDb()!;
    const batch = writeBatch(db);
    const ms = await getDocs(
      query(collection(db, C.milestones), where('userId', '==', getCurrentUid())),
    );
    ms.docs
      .filter((d) => d.data()['featureId'] === featureId)
      .forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, C.features, featureId));
    await batch.commit();
  }

  // ---------------- milestones ----------------
  async listMilestones(gameId: string): Promise<Milestone[]> {
    const db = getDb()!;
    const q = query(collection(db, C.milestones), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Milestone>(C.milestones, q);
    return list.filter((m) => m.gameId === gameId);
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
    const db = getDb()!;
    const id = uid('ml');
    const milestone: Milestone = {
      id,
      featureId,
      gameId,
      name: data.name,
      targetStatement: data.targetStatement,
      criteria: data.criteria,
      status: 'planned',
      metricIds: data.metricIds,
    };
    await setDoc(doc(db, C.milestones, id), { ...clean(milestone), userId: getCurrentUid() });
    return milestone;
  }

  async updateMilestone(milestoneId: string, patch: Partial<Milestone>): Promise<void> {
    const db = getDb()!;
    await updateDoc(doc(db, C.milestones, milestoneId), clean(patch));
  }

  async deleteMilestone(milestoneId: string): Promise<void> {
    await deleteDoc(doc(getDb()!, C.milestones, milestoneId));
  }

  // ---------------- sprints ----------------
  async listSprints(gameId: string): Promise<Sprint[]> {
    const db = getDb()!;
    const q = query(collection(db, C.sprints), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Sprint>(C.sprints, q);
    return list
      .filter((s) => s.gameId === gameId)
      .sort((a, b) => b.number - a.number);
  }

  async getCurrentSprint(gameId: string, _date?: string): Promise<Sprint | null> {
    const all = await this.listSprints(gameId);
    return all.find((s) => s.status !== 'closed') ?? null;
  }

  async createSprint(gameId: string): Promise<Sprint> {
    const db = getDb()!;
    const all = await this.listSprints(gameId);
    const last = all[0]; // highest number (ordered desc)
    const nextNumber = last ? last.number + 1 : 1;
    const from = last ? addDays(last.endDate, 1) : mondayOf(new Date());
    const start = mondayOf(new Date(from + 'T00:00:00'));
    const id = uid('s');
    const sprint: Sprint = {
      id,
      gameId,
      userId: getCurrentUid(),
      number: nextNumber,
      startDate: start,
      endDate: addDays(start, 6),
      goal: '',
      status: 'planned',
      milestoneIds: last?.milestoneIds ?? [],
    };
    await setDoc(doc(db, C.sprints, id), clean(sprint));
    return sprint;
  }

  async updateSprint(sprintId: string, patch: Partial<Sprint>): Promise<void> {
    await updateDoc(doc(getDb()!, C.sprints, sprintId), clean(patch));
  }

  async closeSprint(gameId: string, sprintId: string): Promise<Sprint> {
    const db = getDb()!;
    const sprintRef = doc(db, C.sprints, sprintId);
    const snap = await getDoc(sprintRef);
    if (!snap.exists()) throw new Error('Sprint not found');
    const sprint = snapTo<Sprint>({ ...snap.data(), id: snap.id });

    const userTasks = await allDocs<Task>(
      C.tasks,
      query(collection(db, C.tasks), where('userId', '==', getCurrentUid())),
    );
    const tasks = userTasks.filter((t) => t.sprintId === sprintId);

    const nextNumber = sprint.number + 1;
    const start = mondayOf(new Date(addDays(sprint.endDate, 1) + 'T00:00:00'));
    const nextId = uid('s');
    const next: Sprint = {
      id: nextId,
      gameId,
      userId: sprint.userId,
      number: nextNumber,
      startDate: start,
      endDate: addDays(start, 6),
      goal: '',
      status: 'planned',
      milestoneIds: sprint.milestoneIds,
    };

    const batch = writeBatch(db);
    batch.update(sprintRef, { status: 'closed' });
    batch.set(doc(db, C.sprints, nextId), clean(next));

    for (const t of tasks) {
      const ref = doc(db, C.tasks, t.id);
      if (t.status === 'done') {
        batch.delete(ref); // done → deleted
      } else if (t.status === 'doing') {
        batch.update(ref, { sprintId: nextId }); // doing → next sprint, keep status
      } else {
        batch.update(ref, { sprintId: nextId, isBacklog: true, day: null, status: 'todo' });
      }
    }
    await batch.commit();
    return sprint;
  }

  // ---------------- tasks ----------------
  async listTasks(gameId: string): Promise<Task[]> {
    const db = getDb()!;
    const q = query(collection(db, C.tasks), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Task>(C.tasks, q);
    return list.filter((t) => t.gameId === gameId);
  }

  async listTasksBySprint(sprintId: string): Promise<Task[]> {
    const db = getDb()!;
    const q = query(collection(db, C.tasks), where('userId', '==', getCurrentUid()));
    const list = await allDocs<Task>(C.tasks, q);
    return list.filter((t) => t.sprintId === sprintId);
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
    const db = getDb()!;
    const id = uid('t');
    const task: Task = {
      id,
      sprintId: data.sprintId,
      featureId: data.featureId,
      gameId: data.gameId,
      title: data.title,
      status: data.status,
      day: data.day,
      isBacklog: data.isBacklog,
      note: data.note,
    };
    await setDoc(doc(db, C.tasks, id), { ...clean(task), userId: getCurrentUid() });
    return task;
  }

  async updateTask(taskId: string, patch: Partial<Task>): Promise<void> {
    await updateDoc(doc(getDb()!, C.tasks, taskId), clean(patch));
  }

  async toggleDone(taskId: string): Promise<void> {
    const db = getDb()!;
    const ref = doc(db, C.tasks, taskId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const task = snapTo<Task>({ ...snap.data(), id: snap.id });
    await updateDoc(ref, { status: task.status === 'done' ? 'todo' : 'done' });
  }

  async moveTaskDay(taskId: string, day: Task['day']): Promise<void> {
    await updateDoc(doc(getDb()!, C.tasks, taskId), {
      day: day ?? null,
      isBacklog: day === undefined,
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(getDb()!, C.tasks, taskId));
  }
}

// Seed the example data (Appendix H) into Firestore for a given user.
// Used by the "Load demo data" button on an empty Games page.
export async function seedFirestoreForUser(uidUser: string): Promise<void> {
  const { buildSeed } = await import('./seed');
  const { getDb } = await import('../lib/firebase');
  const db = getDb()!;
  const seed = buildSeed();

  type Entry = { col: string; id: string; data: Record<string, unknown> };
  const writes: Entry[] = [];

  const push = (col: string, id: string, rest: Record<string, unknown>) =>
    writes.push({ col, id, data: { ...rest, userId: uidUser } });

  seed.games.forEach((g) => {
    const { id, ...rest } = g;
    push('games', id, rest as Record<string, unknown>);
  });
  seed.visions.forEach((v) => {
    const { id, ...rest } = v;
    push('visions', id, rest as Record<string, unknown>);
  });
  seed.metrics.forEach((m) => {
    const { id, ...rest } = m;
    push('metrics', id, rest as Record<string, unknown>);
  });
  seed.quarters.forEach((q) => {
    const { id, ...rest } = q;
    push('quarters', id, rest as Record<string, unknown>);
  });
  seed.features.forEach((f) => {
    const { id, ...rest } = f;
    push('features', id, rest as Record<string, unknown>);
  });
  seed.milestones.forEach((m) => {
    const { id, ...rest } = m;
    push('milestones', id, rest as Record<string, unknown>);
  });
  seed.sprints.forEach((s) => {
    const { id, ...rest } = s;
    push('sprints', id, rest as Record<string, unknown>);
  });
  seed.tasks.forEach((t) => {
    const { id, ...rest } = t;
    push('tasks', id, rest as Record<string, unknown>);
  });

  const BATCH_LIMIT = 450;
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const slice = writes.slice(i, i + BATCH_LIMIT);
    const batch = writeBatchImpl(db);
    slice.forEach((w) => batch.set(docImpl(db, w.col, w.id), cleanImpl(w.data)));
    await batch.commit();
  }
}

// small local wrappers to keep this module self-contained
import {
  writeBatch as writeBatchFb,
  doc as docFb,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';

function writeBatchImpl(db: Firestore): WriteBatch {
  return writeBatchFb(db);
}
function docImpl(db: Firestore, col: string, id: string) {
  return docFb(db, col, id);
}
function cleanImpl<T>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === undefined || (typeof v === 'number' && Number.isNaN(v))) continue;
    out[k] = v;
  }
  return out;
}
