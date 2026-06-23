import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { UserRole } from '../models/User';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 0,
  staff: 1,
  kitchen: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

/** Allow only the listed roles */
export const authorize = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };

/** Allow roles at or above the given minimum level */
export const minRole = (minLevel: UserRole) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    const userLevel = ROLE_HIERARCHY[req.user.role as UserRole] ?? 0;
    if (userLevel < ROLE_HIERARCHY[minLevel]) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };

export const isAdmin = authorize('admin', 'super_admin');
export const isManager = minRole('manager');
export const isStaff = minRole('staff');
