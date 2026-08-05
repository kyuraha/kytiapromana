// Central types for the whole app — mirroring the Firestore schema in §10.2 / §C.

export type TrackType = 'waterfall' | 'agile';
export type DayName =
  | 'Minggu'
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type MetricTrend = 'up' | 'flat' | 'down';
export type QuarterName = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type MilestoneStatus = 'planned' | 'active' | 'done' | 'late';
export type SprintStatus = 'planned' | 'running' | 'closed' | 'deferred';
export type Category =
  | 'Code'
  | 'Asset'
  | 'Marketing'
  | 'Finance'
  | 'Ops'
  | 'Other';

export interface Game {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  defaultTrackType: TrackType;
  createdAt: string;
}

export interface Vision {
  id: string;
  gameId: string;
  year: number;
  northStarId: string;
}

export interface MetricSnapshot {
  date: string;
  value: number;
}

export interface Metric {
  id: string;
  visionId: string;
  gameId: string;
  name: string;
  unit: string;
  target: number;
  current: number;
  trend: MetricTrend;
  history: MetricSnapshot[];
  contributorMilestoneIds: string[];
  note?: string;
}

export interface Quarter {
  id: string;
  gameId: string;
  userId: string;
  year: number;
  quarter: QuarterName;
}

export interface Feature {
  id: string;
  milestoneId: string;
  gameId: string;
  name: string;
  category: Category;
  trackType: TrackType;
  storyPoints: number;
}

export interface Milestone {
  id: string;
  quarterId: string;
  gameId: string;
  name: string;
  targetStatement: string;
  criteria: string[]; // Definition of Done (DoD)
  status: MilestoneStatus;
  metricIds: string[];
}

export interface Sprint {
  id: string;
  gameId: string;
  userId: string;
  number: number;
  startDate: string; // yyyy-mm-dd (Monday)
  endDate: string; // yyyy-mm-dd (Sunday)
  goal: string;
  status: SprintStatus;
  retro?: string;
  milestoneIds: string[];
}

export interface Task {
  id: string;
  sprintId: string;
  featureId: string;
  gameId: string;
  title: string;
  status: TaskStatus;
  day?: DayName | null;
  isBacklog: boolean;
  note?: string | null;
}
