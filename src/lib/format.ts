import dayjs from 'dayjs';
import { DAYS, DAY_INDEX } from './constants';
import type { DayName } from './types';

export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function todayDayName(): DayName {
  return DAYS[new Date().getDay()];
}

export function isToday(day: DayName): boolean {
  return todayDayName() === day;
}

export function formatDay(iso: string): string {
  return dayjs(iso).format('ddd DD MMM');
}

export function formatShort(iso: string): string {
  return dayjs(iso).format('DD MMM');
}

export function displayDate(day: DayName, isoBase: string): string {
  const base = dayjs(isoBase + 'T00:00:00');
  const offset = DAY_INDEX[day];
  return base.startOf('week').add(offset, 'day').format('DD MMM');
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 100_000) return `${(n / 1000).toFixed(0)}k`;
    return `${(n / 1000).toFixed(1)}k`;
  }
  return String(n);
}
