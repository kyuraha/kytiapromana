import type { Category, DayName, TrackType } from './types';

export const DAYS: DayName[] = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

// index within DAYS matching JS getDay() semantics (0 = Sunday)
export const DAY_INDEX: Record<DayName, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;
export const MILESTONE_STATUSES = [
  'planned',
  'active',
  'done',
  'late',
] as const;
export const SPRINT_STATUSES = [
  'planned',
  'running',
  'closed',
  'deferred',
] as const;

export const CATEGORIES: Category[] = [
  'Code',
  'Asset',
  'Marketing',
  'Finance',
  'Ops',
  'Other',
];

export const TRACK_META: Record<
  TrackType,
  { label: string; icon: string; badge: string }
> = {
  agile: { label: 'Agile', icon: '⚡', badge: 'bg-amber-100 text-amber-700' },
  waterfall: {
    label: 'Waterfall',
    icon: '📦',
    badge: 'bg-sky-100 text-sky-700',
  },
};

export const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-600',
  active: 'bg-indigo-100 text-indigo-700',
  done: 'bg-emerald-100 text-emerald-700',
  late: 'bg-rose-100 text-rose-700',
  running: 'bg-indigo-100 text-indigo-700',
  closed: 'bg-slate-200 text-slate-600',
  deferred: 'bg-rose-100 text-rose-700',
  todo: 'bg-slate-100 text-slate-600',
  doing: 'bg-amber-100 text-amber-700',
  done2: 'bg-emerald-100 text-emerald-700',
};

export const PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];
