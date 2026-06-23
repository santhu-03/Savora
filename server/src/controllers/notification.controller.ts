import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await NotificationService.findForUser(req.user!.userId, req.query as Record<string, string>);
  ApiResponse.paginated(res, result.data, result.pagination, { unreadCount: result.unreadCount });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const n = await NotificationService.markRead(req.params.id, req.user!.userId);
  ApiResponse.success(res, n);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.markAllRead(req.user!.userId);
  ApiResponse.noContent(res);
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await NotificationService.delete(req.params.id, req.user!.userId);
  ApiResponse.noContent(res);
});
