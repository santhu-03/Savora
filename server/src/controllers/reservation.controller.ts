import { Request, Response } from 'express';
import { z } from 'zod';
import { ReservationService } from '../services/reservation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

const createReservationSchema = z.object({
  guestInfo: z.object({ name: z.string().min(2), email: z.string().email(), phone: z.string().min(6) }),
  date: z.string().transform(s => new Date(s)),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional(),
  specialRequests: z.string().max(500).optional(),
  occasion: z.string().optional(),
  occasionNote: z.string().optional(),
  seatingPreference: z.string().optional(),
});

export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date, time, partySize } = z.object({
    date: z.string(),
    time: z.string(),
    partySize: z.coerce.number(),
  }).parse(req.query);
  const tables = await ReservationService.checkAvailability(req.params.restaurantId, new Date(date), time, partySize);
  ApiResponse.success(res, { available: tables.length > 0, tableCount: tables.length });
});

export const createReservation = asyncHandler(async (req: Request, res: Response) => {
  const data = createReservationSchema.parse(req.body);
  const reservation = await ReservationService.create({
    ...data,
    restaurantId: req.params.restaurantId,
    customerId: req.user?.userId,
  });
  ApiResponse.created(res, reservation);
});

export const getReservations = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReservationService.findByRestaurant(req.params.restaurantId, req.query as Record<string, string>);
  ApiResponse.paginated(res, result.data, result.pagination);
});

export const cancelReservation = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
  const reservation = await ReservationService.cancel(req.params.id, reason);
  ApiResponse.success(res, reservation);
});
