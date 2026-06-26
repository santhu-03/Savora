import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt);
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}…` : str;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
