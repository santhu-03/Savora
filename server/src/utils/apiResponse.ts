import { Response } from 'express';
import { PaginationMeta } from '../types';

interface SuccessPayload<T> {
  success: true;
  message?: string;
  data: T;
}

interface PaginatedPayload<T> extends SuccessPayload<T[]> {
  pagination: PaginationMeta;
}

interface ErrorPayload {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export const ApiResponse = {
  success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    const payload: SuccessPayload<T> = { success: true, data };
    if (message) payload.message = message;
    return res.status(statusCode).json(payload);
  },

  created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  },

  paginated<T>(res: Response, data: T[], pagination: PaginationMeta, meta?: Record<string, unknown>): Response {
    return res.status(200).json({ success: true, data, pagination, ...meta });
  },

  noContent(res: Response): Response {
    return res.status(204).send();
  },

  error(res: Response, message: string, statusCode = 500, code?: string, errors?: Record<string, string[]>): Response {
    const payload: ErrorPayload = { success: false, message };
    if (code) payload.code = code;
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
  },
};
