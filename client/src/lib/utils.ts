import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFloat(value: string | number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

export function safeInt(value: string | number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? Math.floor(value) : parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function toLocaleDateSafe(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('it-IT');
  }
  return dateStr;
}

export function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getLocalMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function dateToLocalString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
