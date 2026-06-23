import { Reservation, IReservationDocument } from '../models/Reservation.model';
import { Table } from '../models/Table.model';
import { AppError } from '../middleware/errorHandler';
import { sendMail, emailTemplates } from '../utils/email';
import { cache } from '../config/redis';
import { parsePagination, buildMeta } from '../utils/pagination';
import { PaginatedResult } from '../types';
import { getIO } from '../config/socket';
import { logger } from '../utils/logger';

export class ReservationService {
  // ─── Check availability ──────────────────────────────────────
  static async checkAvailability(restaurantId: string, date: Date, time: string, partySize: number) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const existingReservations = await Reservation.find({
      restaurant: restaurantId,
      date: { $gte: dayStart, $lt: dayEnd },
      time,
      status: { $in: ['confirmed', 'seated', 'pending'] },
    }).select('table partySize');

    const reservedTableIds = existingReservations.map(r => r.table?.toString()).filter(Boolean);

    const availableTables = await Table.find({
      restaurant: restaurantId,
      maxCapacity: { $gte: partySize },
      isActive: true,
      _id: { $nin: reservedTableIds },
    }).sort({ maxCapacity: 1 });

    return availableTables;
  }

  // ─── Create ──────────────────────────────────────────────────
  static async create(data: {
    restaurantId: string;
    customerId?: string;
    guestInfo: { name: string; email: string; phone: string };
    date: Date;
    time: string;
    partySize: number;
    adults: number;
    children?: number;
    specialRequests?: string;
    occasion?: string;
    occasionNote?: string;
    seatingPreference?: string;
    source?: string;
  }) {
    const available = await ReservationService.checkAvailability(
      data.restaurantId, data.date, data.time, data.partySize
    );
    if (!available.length) throw new AppError('No tables available for the selected time', 409, 'NO_AVAILABILITY');

    const table = available[0];
    const reservation = await Reservation.create({
      restaurant: data.restaurantId,
      customer: data.customerId,
      guestInfo: data.guestInfo,
      table: table._id,
      date: data.date,
      time: data.time,
      partySize: data.partySize,
      adults: data.adults,
      children: data.children ?? 0,
      specialRequests: data.specialRequests,
      occasion: data.occasion,
      occasionNote: data.occasionNote,
      seatingPreference: data.seatingPreference,
      source: data.source ?? 'website',
      status: 'confirmed',
    });

    await Table.findByIdAndUpdate(table._id, {
      status: 'reserved',
      currentReservation: reservation._id,
    });

    // Send confirmation email
    sendMail({
      to: data.guestInfo.email,
      subject: `Reservation Confirmed — ${reservation.confirmationCode}`,
      html: emailTemplates.reservationConfirmation(
        data.guestInfo.name,
        reservation.confirmationCode,
        data.date.toLocaleDateString('en-IN', { dateStyle: 'long' }),
        data.time,
        data.partySize
      ),
    }).catch(err => logger.error('Reservation email failed', { err }));

    getIO()?.to('admin').emit('newReservation', reservation);
    await cache.delPattern(`reservations:${data.restaurantId}:*`);

    return reservation;
  }

  // ─── List ────────────────────────────────────────────────────
  static async findByRestaurant(restaurantId: string, query: Record<string, string>): Promise<PaginatedResult<IReservationDocument>> {
    const { page, limit, skip, sort } = parsePagination(query);
    const filter: Record<string, unknown> = { restaurant: restaurantId };
    if (query.status) filter.status = query.status;
    if (query.date) {
      const d = new Date(query.date);
      filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const [data, total] = await Promise.all([
      Reservation.find(filter).sort(sort).skip(skip).limit(limit).populate('table', 'number section'),
      Reservation.countDocuments(filter),
    ]);

    return { data, pagination: buildMeta(total, page, limit) };
  }

  // ─── Cancel ──────────────────────────────────────────────────
  static async cancel(reservationId: string, reason?: string) {
    const res = await Reservation.findById(reservationId);
    if (!res) throw new AppError('Reservation not found', 404);
    if (['cancelled', 'completed'].includes(res.status)) throw new AppError('Cannot cancel this reservation', 400);

    res.status = 'cancelled';
    res.cancelledAt = new Date();
    res.cancellationReason = reason;
    await res.save();

    await Table.findByIdAndUpdate(res.table, { status: 'available', currentReservation: null });

    return res;
  }

  // ─── Send reminders ──────────────────────────────────────────
  static async sendReminders(): Promise<number> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow.getTime() + 86400000);

    const reservations = await Reservation.find({
      date: { $gte: tomorrow, $lt: dayAfter },
      status: 'confirmed',
      remindersSent: 0,
    });

    let sent = 0;
    for (const r of reservations) {
      try {
        await sendMail({
          to: r.guestInfo.email,
          subject: `Reminder: Your Savora reservation is tomorrow`,
          html: emailTemplates.reservationReminder(
            r.guestInfo.name,
            r.date.toLocaleDateString('en-IN', { dateStyle: 'long' }),
            r.time
          ),
        });
        r.remindersSent += 1;
        r.lastReminderAt = new Date();
        await r.save();
        sent++;
      } catch (err) {
        logger.error('Reminder email failed', { reservationId: r._id, err });
      }
    }
    return sent;
  }
}
