import { PaginationMeta } from '../types';

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export const parsePagination = (opts: PaginationOptions): ParsedPagination => {
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = {
    [opts.sortBy ?? 'createdAt']: opts.sortOrder === 'asc' ? 1 : -1,
  };
  return { page, limit, skip, sort };
};

export const buildMeta = (total: number, page: number, limit: number): PaginationMeta => {
  const pages = Math.ceil(total / limit);
  return { total, page, limit, pages, hasNext: page < pages, hasPrev: page > 1 };
};
