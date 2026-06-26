import mongoose from 'mongoose';
import { Reservation, IReservationDocument, ReservationStatus } from '../models/Reservation';
import { Restaurant } from '../models/Restaurant';
import { Table } from '../models/Table';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import { sendMail, emailTemplates } from '../utils/email';
import { getIO } from '../config/socket';
import { parsePagination, buildMeta } from '../utils/pagination';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────
export interface CreateReservationInput {
  restaurantId: string;
  customerId: string;
  date: Date;
  timeSlot: string;
  partySize: number;
  duration?: number;
  specialRequests?: string;
}

// ─── Helpers ──────────────────────────────────────────────────
function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
}

function minutesToSlot(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

// ─── Available time slots ─────────────────────────────────────
export async function getAvailableSlots(
  restaurantId: string,
  dateStr: string,
  partySize: number
) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) throw new AppError('Invalid date', 400);

  const restaurant = await Restaurant.findById(restaurantId).select('openingHours');
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const hours = restaurant.openingHours.find(h => h.day === DAYS[date.getDay()]);
  if (!hours || hours.isClosed) return [];

  const DURATION = 90;
  const INTERVAL = 30;
  const openMin = slotToMinutes(hours.open);
  const closeMin = slotToMinutes(hours.close);

  // All slots where reservation fits before closing
  const slots: string[] = [];
  for (let m = openMin; m + DURATION <= closeMin; m += INTERVAL) {
    slots.push(minutesToSlot(m));
  }
  if (!slots.length) return [];

  // Tables that fit the party
  const suitableTables = await Table.find({
    restaurantId,
    capacity: { $gte: partySize },
    isActive: true,
    status: { $ne: 'maintenance' },
  }).select('_id').lean();

  if (!suitableTables.length) return [];

  // Existing reservations for that day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const dayReservations = await Reservation.find({
    restaurantId,
    date: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ['pending', 'confirmed', 'seated'] },
    tableId: { $exists: true },
  })
    .select('tableId timeSlot duration')
    .lean();

  return slots.map(slot => {
    const slotStart = slotToMinutes(slot);
    const slotEnd = slotStart + DURATION;

    const bookedTableIds = new Set<string>(
      dayReservations
        .filter(r => {
          const rStart = slotToMinutes(r.timeSlot);
          const rEnd = rStart + (r.duration || DURATION);
          return slotStart < rEnd && slotEnd > rStart;
        })
        .map(r => r.tableId!.toString())
    );

    const available = suitableTables.filter(t => !bookedTableIds.has(t._id.toString()));
    return { time: slot, available: available.length > 0, tableCount: available.length };
  });
}

// ─── Create reservation ───────────────────────────────────────
export async function createReservation(
  input: CreateReservationInput
): Promise<IReservationDocument> {
  const { restaurantId, customerId, date, timeSlot, partySize, duration = 90, specialRequests } = input;

  // Verify slot is actually available
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const slotStart = slotToMinutes(timeSlot);
  const slotEnd = slotStart + duration;

  const conflicting = await Reservation.find({
    restaurantId,
    date: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ['pending', 'confirmed', 'seated'] },
    tableId: { $exists: true },
  })
    .select('tableId timeSlot duration')
    .lean();

  const occupiedTableIds = new Set(
    conflicting
      .filter(r => {
        const rStart = slotToMinutes(r.timeSlot);
        const rEnd = rStart + (r.duration || 90);
        return slotStart < rEnd && slotEnd > rStart;
      })
      .map(r => r.tableId!.toString())
  );

  const table = await Table.findOne({
    restaurantId,
    capacity: { $gte: partySize },
    isActive: true,
    status: { $ne: 'maintenance' },
    _id: { $nin: Array.from(occupiedTableIds) },
  });

  if (!table) throw new AppError('No tables available for this time slot', 409, 'NO_AVAILABILITY');

  const reservation = await Reservation.create({
    restaurantId,
    customerId,
    tableId: table._id,
    date,
    timeSlot,
    partySize,
    duration,
    specialRequests,
  });

  // Socket notification to restaurant
  const io = getIO();
  const customer = await User.findById(customerId).select('name email').lean();
  io?.to(`restaurant:${restaurantId}`).emit('reservation_created', {
    reservationId:   reservation._id.toString(),
    customerName:    (customer as any)?.name ?? 'Guest',
    customerEmail:   (customer as any)?.email ?? '',
    date:            date.toISOString(),
    timeSlot,
    partySize,
    specialRequests,
    confirmationCode: reservation.confirmationCode,
    tableNumber:     table.tableNumber,
  });

  // Confirmation email
  User.findById(customerId)
    .select('name email')
    .then(user => {
      if (!user) return;
      const dateStr = date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      sendMail({
        to: user.email,
        subject: `Reservation Confirmed — ${reservation.confirmationCode}`,
        html: emailTemplates.reservationConfirmation(
          user.name,
          reservation.confirmationCode,
          dateStr,
          timeSlot,
          partySize
        ),
      }).catch(e => logger.warn('Reservation email failed', { e }));
    })
    .catch(() => {});

  await cache.del(`reservations:${restaurantId}`);
  return reservation;
}

// ─── Customer's own reservations ─────────────────────────────
export async function getMyReservations(customerId: string, query: Record<string, string>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {
    customerId: new mongoose.Types.ObjectId(customerId),
  };
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Reservation.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('tableId', 'tableNumber section floor')
      .lean(),
    Reservation.countDocuments(filter),
  ]);

  return { data, pagination: buildMeta(total, page, limit) };
}

// ─── All reservations for a restaurant ───────────────────────
export async function getRestaurantReservations(restaurantId: string, query: Record<string, string>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {
    restaurantId: new mongoose.Types.ObjectId(restaurantId),
  };
  if (query.status) filter.status = query.status;
  if (query.date) {
    const d = new Date(query.date);
    d.setHours(0, 0, 0, 0);
    filter.date = { $gte: d, $lt: new Date(d.getTime() + 86_400_000) };
  }

  const [data, total] = await Promise.all([
    Reservation.find(filter)
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email phone')
      .populate('tableId', 'tableNumber section floor')
      .lean(),
    Reservation.countDocuments(filter),
  ]);

  return { data, pagination: buildMeta(total, page, limit) };
}

// ─── Confirm reservation (staff) ─────────────────────────────
export async function confirmReservation(id: string): Promise<IReservationDocument> {
  const r = await Reservation.findByIdAndUpdate(
    id,
    { status: 'confirmed' },
    { new: true }
  ).populate('tableId', 'tableNumber');
  if (!r) throw new AppError('Reservation not found', 404);

  // Notify the customer
  const io = getIO();
  if (r.customerId) {
    io?.to(`user:${r.customerId}`).emit('reservation_confirmed', {
      reservationId:    id,
      restaurantId:     r.restaurantId.toString(),
      date:             r.date.toISOString(),
      timeSlot:         r.timeSlot,
      tableNumber:      (r.tableId as any)?.tableNumber,
      confirmationCode: r.confirmationCode,
    });
  }
  io?.to(`restaurant:${r.restaurantId}`).emit('reservation_status_changed', {
    reservationId: id,
    status:        'confirmed',
    tableNumber:   (r.tableId as any)?.tableNumber,
  });

  return r;
}

// ─── Update status (staff) ────────────────────────────────────
export async function updateStatus(
  id: string,
  status: ReservationStatus
): Promise<IReservationDocument> {
  const r = await Reservation.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!r) throw new AppError('Reservation not found', 404);

  const io = getIO();
  io?.to(`restaurant:${r.restaurantId}`).emit('reservation_status_changed', {
    reservationId: id,
    status,
  });
  return r;
}

// ─── Cancel ───────────────────────────────────────────────────
export async function cancelReservation(
  id: string,
  userId: string,
  role: string
): Promise<IReservationDocument> {
  const r = await Reservation.findById(id);
  if (!r) throw new AppError('Reservation not found', 404);

  if (role === 'customer' && r.customerId.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }
  if (['cancelled', 'completed', 'no_show'].includes(r.status)) {
    throw new AppError(`Reservation is already ${r.status}`, 400);
  }

  r.status = 'cancelled';
  await r.save();

  const io = getIO();
  io?.to(`restaurant:${r.restaurantId}`).emit('reservation_cancelled', { reservationId: id });

  return r;
}

// ─── Send reminders (cron job endpoint) ──────────────────────
export async function sendReminders(): Promise<{ sent: number; total: number }> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow.getTime() + 86_400_000);

  const reservations = await Reservation.find({
    date: { $gte: tomorrow, $lt: dayAfter },
    status: 'confirmed',
    reminderSent: false,
  })
    .populate('customerId', 'name email')
    .lean();

  let sent = 0;
  await Promise.allSettled(
    reservations.map(async r => {
      const customer = r.customerId as any;
      if (!customer?.email) return;
      const dateStr = (r.date as Date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      await sendMail({
        to: customer.email,
        subject: 'Reminder: Your Savora Reservation Tomorrow',
        html: emailTemplates.reservationReminder(customer.name, dateStr, r.timeSlot),
      });
      await Reservation.findByIdAndUpdate(r._id, { reminderSent: true });
      sent++;
    })
  );

  return { sent, total: reservations.length };
}

// ─── Backward-compat class API ────────────────────────────────
export class ReservationService {
  static async checkAvailability(restaurantId: string, date: Date, _time: string, partySize: number) {
    return getAvailableSlots(restaurantId, date.toISOString(), partySize);
  }
  static async create(data: CreateReservationInput & { restaurantId: string }) {
    return createReservation(data);
  }
  static async findByRestaurant(restaurantId: string, query: Record<string, string>) {
    return getRestaurantReservations(restaurantId, query);
  }
  static async cancel(id: string, _reason?: string) {
    const r = await Reservation.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
    if (!r) throw new AppError('Reservation not found', 404);
    return r;
  }
}
