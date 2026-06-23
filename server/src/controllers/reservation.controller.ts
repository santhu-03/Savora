import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getAvailableSlots,
  createReservation,
  getMyReservations,
  getRestaurantReservations,
  confirmReservation,
  updateStatus,
  cancelReservation,
  sendReminders,
  ReservationService,    // kept for old routes
} from '../services/reservation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { ReservationStatus } from '../models/Reservation';

// ─── Validation schemas ───────────────────────────────────────
const createSchema = z.object({
  restaurantId: z.string().min(1),
  date: z.string().refine(s => !isNaN(new Date(s).getTime()), 'Invalid date'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  partySize: z.coerce.number().int().min(1).max(50),
  duration: z.coerce.number().int().min(15).optional(),
  specialRequests: z.string().max(500).optional(),
});

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']),
});

// ─── GET /reservations/available-slots ───────────────────────
export const availableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, date, partySize } = z
    .object({
      restaurantId: z.string().min(1),
      date: z.string().min(1),
      partySize: z.coerce.number().int().min(1),
    })
    .parse(req.query);

  const slots = await getAvailableSlots(restaurantId, date, partySize);
  return ApiResponse.success(res, slots);
});

// ─── POST /reservations ───────────────────────────────────────
export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);
  const reservation = await createReservation({
    ...body,
    date: new Date(body.date),
    customerId: req.user!.userId,
  });
  return ApiResponse.created(res, reservation, 'Reservation created');
});

// ─── GET /reservations/my-reservations ───────────────────────
export const myReservations = asyncHandler(async (req: Request, res: Response) => {
  const { data, pagination } = await getMyReservations(
    req.user!.userId,
    req.query as Record<string, string>
  );
  return ApiResponse.paginated(res, data, pagination);
});

// ─── GET /reservations/restaurant/:restaurantId ───────────────
export const restaurantReservations = asyncHandler(async (req: Request, res: Response) => {
  const { data, pagination } = await getRestaurantReservations(
    req.params.restaurantId,
    req.query as Record<string, string>
  );
  return ApiResponse.paginated(res, data, pagination);
});

// ─── PATCH /reservations/:id/confirm ─────────────────────────
export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await confirmReservation(req.params.id);
  return ApiResponse.success(res, reservation, 'Reservation confirmed');
});

// ─── PATCH /reservations/:id/status ──────────────────────────
export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = statusSchema.parse(req.body);
  const reservation = await updateStatus(req.params.id, status as ReservationStatus);
  return ApiResponse.success(res, reservation, 'Status updated');
});

// ─── DELETE /reservations/:id ─────────────────────────────────
export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await cancelReservation(req.params.id, req.user!.userId, req.user!.role);
  return ApiResponse.success(res, reservation, 'Reservation cancelled');
});

// ─── POST /reservations/send-reminder ────────────────────────
export const sendReminderEmails = asyncHandler(async (req: Request, res: Response) => {
  const result = await sendReminders();
  return ApiResponse.success(res, result, `Reminders sent: ${result.sent}/${result.total}`);
});

// ─── Legacy handlers for /restaurants/:id/reservations routes ─
export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date, partySize } = z
    .object({ date: z.string(), partySize: z.coerce.number() })
    .parse(req.query);
  const slots = await getAvailableSlots(req.params.restaurantId, date, partySize);
  return ApiResponse.success(res, { available: slots.some(s => s.available), slots });
});

export const createReservation_legacy = asyncHandler(async (req: Request, res: Response) => {
  const body = createSchema.omit({ restaurantId: true }).parse(req.body);
  const reservation = await ReservationService.create({
    ...body,
    date: new Date(body.date),
    restaurantId: req.params.restaurantId,
    customerId: req.user!.userId,
  });
  return ApiResponse.created(res, reservation);
});

export const getReservations = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReservationService.findByRestaurant(
    req.params.restaurantId,
    req.query as Record<string, string>
  );
  return ApiResponse.paginated(res, result.data, result.pagination);
});

export const cancelReservation_legacy = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await ReservationService.cancel(req.params.id);
  return ApiResponse.success(res, reservation);
});

// Backward-compat aliases for old reservation.routes.ts
export { createReservation_legacy as createReservation };
export { cancelReservation_legacy as cancelReservation };
