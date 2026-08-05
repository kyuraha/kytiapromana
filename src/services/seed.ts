import type {
  Feature,
  Game,
  Metric,
  Milestone,
  Quarter,
  Sprint,
  Task,
  Vision,
} from '../lib/types';
import { MOCK_USER_ID } from '../lib/firebase';

// Seed data per Appendix H, expanded so every page has something real to show.
const USER = MOCK_USER_ID;

const DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

export interface SeedDatabase {
  games: Game[];
  visions: Vision[];
  metrics: Metric[];
  quarters: Quarter[];
  features: Feature[];
  milestones: Milestone[];
  sprints: Sprint[];
  tasks: Task[];
}

function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function buildSeed(): SeedDatabase {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const monday = mondayOf(now);
  const sunday = addDays(monday, 6);
  const seedYear = now.getFullYear();

  const g1: Game = {
    id: 'game-arnava',
    userId: USER,
    name: 'ARNAVA',
    color: '#6366f1',
    icon: '🎮',
    description: 'Action RPG with a living ecosystem',
    defaultTrackType: 'agile',
    createdAt: todayISO,
  };
  const g2: Game = {
    id: 'game-sidex',
    userId: USER,
    name: 'Side Project X',
    color: '#10b981',
    icon: '🧪',
    description: 'Small experimental prototype',
    defaultTrackType: 'agile',
    createdAt: todayISO,
  };

  const v1: Vision = {
    id: 'vision-arnava-2026',
    gameId: g1.id,
    year: seedYear,
    northStarId: 'm-user',
  };
  const v2: Vision = {
    id: 'vision-sidex-2026',
    gameId: g2.id,
    year: seedYear,
    northStarId: 'm-alpha',
  };

  const metrics1: Metric[] = [
    {
      id: 'm-user',
      visionId: v1.id,
      gameId: g1.id,
      name: 'Daily Active Users',
      unit: 'users',
      target: 10000,
      current: 1240,
      trend: 'up',
      history: [
        { date: addDays(monday, -35), value: 900 },
        { date: addDays(monday, -28), value: 980 },
        { date: addDays(monday, -21), value: 1050 },
        { date: addDays(monday, -14), value: 1120 },
        { date: addDays(monday, -7), value: 1240 },
      ],
      contributorMilestoneIds: ['ml-combat', 'ml-trailer'],
    },
    {
      id: 'm-revenue',
      visionId: v1.id,
      gameId: g1.id,
      name: 'Revenue / month',
      unit: 'R$',
      target: 50000,
      current: 12300,
      trend: 'flat',
      history: [
        { date: addDays(monday, -21), value: 11900 },
        { date: addDays(monday, -14), value: 12100 },
        { date: addDays(monday, -7), value: 12300 },
      ],
      contributorMilestoneIds: ['ml-finance'],
    },
    {
      id: 'm-retention',
      visionId: v1.id,
      gameId: g1.id,
      name: 'D30 retention',
      unit: '%',
      target: 25,
      current: 21,
      trend: 'down',
      history: [
        { date: addDays(monday, -21), value: 24 },
        { date: addDays(monday, -14), value: 22 },
        { date: addDays(monday, -7), value: 21 },
      ],
      contributorMilestoneIds: ['ml-combat', 'ml-inventory'],
    },
  ];

  const metrics2: Metric[] = [
    {
      id: 'm-alpha',
      visionId: v2.id,
      gameId: g2.id,
      name: 'Alpha signups',
      unit: 'users',
      target: 50,
      current: 12,
      trend: 'flat',
      history: [{ date: addDays(monday, -7), value: 12 }],
      contributorMilestoneIds: ['ml-proto'],
    },
  ];

  // Seed all four quarters so the Quarter tab's default (current calendar
  // quarter) always exists. Seeding only Q1 made the page fall into an endless
  // ensure+refetch loop whenever the current quarter wasn't Q1.
  const quarters1: Quarter[] = (['Q1', 'Q2', 'Q3', 'Q4'] as const).map(
    (q) => ({
      id: `q-arnava-${q.toLowerCase()}`,
      gameId: g1.id,
      userId: USER,
      year: seedYear,
      quarter: q,
    }),
  );
  const quarters2: Quarter[] = (['Q1', 'Q2', 'Q3', 'Q4'] as const).map(
    (q) => ({
      id: `q-sidex-${q.toLowerCase()}`,
      gameId: g2.id,
      userId: USER,
      year: seedYear,
      quarter: q,
    }),
  );

  const features1: Feature[] = [
    {
      id: 'f-combat',
      milestoneId: 'ml-combat',
      gameId: g1.id,
      name: 'Combat V2',
      category: 'Code',
      trackType: 'agile',
      storyPoints: 13,
    },
    {
      id: 'f-inventory',
      milestoneId: 'ml-inventory',
      gameId: g1.id,
      name: 'Inventory',
      category: 'Code',
      trackType: 'agile',
      storyPoints: 8,
    },
    {
      id: 'f-trailer',
      milestoneId: 'ml-trailer',
      gameId: g1.id,
      name: 'Trailer Launch',
      category: 'Marketing',
      trackType: 'waterfall',
      storyPoints: 5,
    },
    {
      id: 'f-finance',
      milestoneId: 'ml-finance',
      gameId: g1.id,
      name: 'Finance Ops',
      category: 'Finance',
      trackType: 'waterfall',
      storyPoints: 3,
    },
  ];

  const features2: Feature[] = [
    {
      id: 'f-proto',
      milestoneId: 'ml-proto',
      gameId: g2.id,
      name: 'Prototype',
      category: 'Code',
      trackType: 'agile',
      storyPoints: 5,
    },
  ];

  const milestones1: Milestone[] = [
    {
      id: 'ml-combat',
      quarterId: quarters1[0].id,
      gameId: g1.id,
      name: 'Combat loop playable end-to-end',
      targetStatement:
        'Players can move, attack and take damage in a stable loop.',
      criteria: ['hit-registration', 'damage UI', 'attack timing'],
      status: 'active',
      metricIds: ['m-retention'],
    },
    {
      id: 'ml-inventory',
      quarterId: quarters1[0].id,
      gameId: g1.id,
      name: 'Inventory v1 in',
      targetStatement: 'Basic inventory grid with pick-up and storage.',
      criteria: ['grid UI', 'pick-up', 'stacking'],
      status: 'planned',
      metricIds: ['m-retention'],
    },
    {
      id: 'ml-trailer',
      quarterId: quarters1[0].id,
      gameId: g1.id,
      name: 'Teaser out 15 Mar',
      targetStatement: 'Public teaser trailer released on March 15.',
      criteria: ['rendered scenes', 'music mix', 'platform upload'],
      status: 'active',
      metricIds: ['m-user'],
    },
    {
      id: 'ml-finance',
      quarterId: quarters1[0].id,
      gameId: g1.id,
      name: 'Auto monthly revenue dashboard',
      targetStatement: 'Revenue dashboard pulls weekly data automatically.',
      criteria: ['data pull', 'charts', 'export'],
      status: 'active',
      metricIds: ['m-revenue'],
    },
  ];

  const milestones2: Milestone[] = [
    {
      id: 'ml-proto',
      quarterId: quarters2[0].id,
      gameId: g2.id,
      name: 'Playable prototype',
      targetStatement: 'A 5-minute playable slice of the concept.',
      criteria: ['core loop', 'tutorial'],
      status: 'active',
      metricIds: ['m-alpha'],
    },
  ];

  const sprints1: Sprint[] = [
    {
      id: 's-arnava-12',
      gameId: g1.id,
      userId: USER,
      number: 12,
      startDate: monday,
      endDate: sunday,
      goal: 'Stable combat loop for internal playtest.',
      status: 'running',
      milestoneIds: ['ml-combat', 'ml-finance', 'ml-trailer'],
    },
  ];

  const sprints2: Sprint[] = [
    {
      id: 's-sidex-1',
      gameId: g2.id,
      userId: USER,
      number: 1,
      startDate: monday,
      endDate: sunday,
      goal: 'Wireframe the core loop on paper, then prototype.',
      status: 'running',
      milestoneIds: ['ml-proto'],
    },
  ];

  const tasks1: Task[] = [
    {
      id: 't-dmg-ui',
      sprintId: sprints1[0].id,
      featureId: features1[0].id,
      gameId: g1.id,
      title: 'Damage number UI',
      status: 'done',
      day: 'Senin',
      isBacklog: false,
    },
    {
      id: 't-atk-timing',
      sprintId: sprints1[0].id,
      featureId: features1[0].id,
      gameId: g1.id,
      title: 'Attack-response timing',
      status: 'doing',
      day: 'Selasa',
      isBacklog: false,
    },
    {
      id: 't-hitreg',
      sprintId: sprints1[0].id,
      featureId: features1[0].id,
      gameId: g1.id,
      title: 'Hit-registration core',
      status: 'doing',
      day: 'Rabu',
      isBacklog: false,
    },
    {
      id: 't-scene-a',
      sprintId: sprints1[0].id,
      featureId: features1[2].id,
      gameId: g1.id,
      title: 'Render scene A (waiting on model)',
      status: 'todo',
      day: 'Kamis',
      isBacklog: false,
      note: 'Blocked: character model not 100% finished.',
    },
    {
      id: 't-finance',
      sprintId: sprints1[0].id,
      featureId: features1[3].id,
      gameId: g1.id,
      title: 'Revenue dashboard weekly data pull',
      status: 'done',
      day: 'Jumat',
      isBacklog: false,
    },
    {
      id: 't-sfx',
      sprintId: sprints1[0].id,
      featureId: features1[0].id,
      gameId: g1.id,
      title: 'SFX polish',
      status: 'todo',
      isBacklog: true,
    },
    {
      id: 't-combo',
      sprintId: sprints1[0].id,
      featureId: features1[0].id,
      gameId: g1.id,
      title: 'Combo variant',
      status: 'todo',
      isBacklog: true,
    },
  ];

  const tasks2: Task[] = [
    {
      id: 't-wireframe',
      sprintId: sprints2[0].id,
      featureId: features2[0].id,
      gameId: g2.id,
      title: 'Wireframe core loop',
      status: 'doing',
      day: DAY_NAMES[(new Date().getDay() + 6) % 7],
      isBacklog: false,
    },
    {
      id: 't-paper-test',
      sprintId: sprints2[0].id,
      featureId: features2[0].id,
      gameId: g2.id,
      title: 'Paper test with friends',
      status: 'todo',
      isBacklog: true,
    },
  ];

  return {
    games: [g1, g2],
    visions: [v1, v2],
    metrics: [...metrics1, ...metrics2],
    quarters: [...quarters1, ...quarters2],
    features: [...features1, ...features2],
    milestones: [...milestones1, ...milestones2],
    sprints: [...sprints1, ...sprints2],
    tasks: [...tasks1, ...tasks2],
  };
}
