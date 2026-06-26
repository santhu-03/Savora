import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CalendarDays, Users, Clock, MessageSquare, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { api } from '@/lib/api';
import type { Restaurant, TimeSlot } from '@/types';

interface ReservationPayload {
  restaurant: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  occasion?: string;
}

interface ReservationResult {
  _id: string;
  confirmationCode: string;
  date: string;
  time: string;
  partySize: number;
  restaurant: Restaurant;
}

const OCCASIONS = ['None', 'Birthday', 'Anniversary', 'Business', 'Proposal', 'Graduation'];

// ─── SVG Floor Map ────────────────────────────────────────────
interface MapTable {
  id: string;
  number: string;
  x: number;
  y: number;
  w: number;
  h: number;
  seats: number;
  shape: 'round' | 'rect';
  available: boolean;
}

const MAP_TABLES: MapTable[] = [
  { id: 't1', number: '1', x: 30, y: 30, w: 50, h: 50, seats: 2, shape: 'round', available: true },
  { id: 't2', number: '2', x: 110, y: 30, w: 50, h: 50, seats: 2, shape: 'round', available: false },
  { id: 't3', number: '3', x: 190, y: 30, w: 50, h: 50, seats: 2, shape: 'round', available: true },
  { id: 't4', number: '4', x: 30, y: 120, w: 70, h: 55, seats: 4, shape: 'rect', available: true },
  { id: 't5', number: '5', x: 130, y: 120, w: 70, h: 55, seats: 4, shape: 'rect', available: true },
  { id: 't6', number: '6', x: 30, y: 210, w: 90, h: 60, seats: 6, shape: 'rect', available: false },
  { id: 't7', number: '7', x: 150, y: 210, w: 90, h: 60, seats: 6, shape: 'rect', available: true },
];

function FloorMap({ selectedTable, partySize, onSelect }: {
  selectedTable: string | null;
  partySize: number;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border border-gold/15 rounded-2xl overflow-hidden bg-[#faf6f0]">
      <div className="px-4 py-3 border-b border-gold/10 flex items-center justify-between">
        <p className="font-body text-sm font-semibold text-primary">Floor plan</p>
        <div className="flex items-center gap-3 text-xs font-body text-charcoal/50">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gold/60 border border-gold/40" />Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-charcoal/15 border border-charcoal/20" />Taken</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary border border-primary" />Selected</span>
        </div>
      </div>
      <svg viewBox="0 0 300 300" className="w-full h-64">
        {/* Room outline */}
        <rect x="10" y="10" width="280" height="280" rx="8" fill="none" stroke="#BF8B5E" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <text x="150" y="270" textAnchor="middle" fontSize="9" fill="#BF8B5E" opacity="0.5" fontFamily="serif">Entrance</text>

        {MAP_TABLES.map(t => {
          const isSelected = selectedTable === t.id;
          const fits = t.seats >= partySize;
          const canSelect = t.available && fits;

          const fill = isSelected ? '#260B10' : t.available && fits ? '#FDF8F3' : '#F0EBE3';
          const stroke = isSelected ? '#260B10' : t.available && fits ? '#BF8B5E' : '#C8BDB0';
          const textFill = isSelected ? '#FDF8F3' : t.available && fits ? '#260B10' : '#A09080';

          const cx = t.x + t.w / 2;
          const cy = t.y + t.h / 2;
          const r = Math.min(t.w, t.h) / 2;

          return (
            <g
              key={t.id}
              onClick={() => canSelect && onSelect(t.id)}
              className={canSelect ? 'cursor-pointer' : 'cursor-not-allowed'}
            >
              {t.shape === 'round' ? (
                <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1.5} />
              ) : (
                <rect x={t.x} y={t.y} width={t.w} height={t.h} rx="6" fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1.5} />
              )}
              <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={textFill} fontWeight={isSelected ? '700' : '500'} fontFamily="serif">
                {t.number}
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill={textFill} opacity="0.7" fontFamily="sans-serif">
                {t.seats}p
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Confirmation Modal ───────────────────────────────────────
function ConfirmationModal({ reservation, onClose }: { reservation: ReservationResult; onClose: () => void }) {
  return (
    <div className="text-center py-2">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center"
      >
        <CheckCircle2 size={32} className="text-green-600" />
      </motion.div>
      <h3 className="font-heading text-2xl text-primary mb-2">Booking Confirmed!</h3>
      <p className="font-body text-sm text-charcoal/50 mb-6">
        Your table at <strong className="text-primary">{reservation.restaurant.name}</strong> has been reserved.
      </p>
      <div className="bg-cream border border-gold/15 rounded-2xl p-4 mb-6 text-left space-y-2.5">
        {[
          { label: 'Confirmation code', value: reservation.confirmationCode },
          { label: 'Date', value: new Date(reservation.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
          { label: 'Time', value: reservation.time },
          { label: 'Guests', value: `${reservation.partySize} people` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm font-body">
            <span className="text-charcoal/50">{label}</span>
            <span className="font-semibold text-primary">{value}</span>
          </div>
        ))}
      </div>
      <p className="font-body text-xs text-charcoal/35 mb-4">A confirmation has been sent to your email.</p>
      <Button fullWidth onClick={onClose}>Done</Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function Reservation() {
  const { restaurantId: paramRestId } = useParams<{ restaurantId?: string }>();
  const [searchParams] = useSearchParams();
  const qRestId = searchParams.get('restaurantId');
  const restaurantId = paramRestId ?? qRestId ?? '';

  const [selectedRestaurantId] = useState(restaurantId);
  const [date, setDate] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [occasion, setOccasion] = useState('None');
  const [confirmation, setConfirmation] = useState<ReservationResult | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', selectedRestaurantId],
    queryFn: () => api.get<{ data: Restaurant }>(`/restaurants/${selectedRestaurantId}`).then(r => r.data.data),
    enabled: !!selectedRestaurantId,
  });

  const { data: timeSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', selectedRestaurantId, date, partySize],
    queryFn: () =>
      api.get<{ data: TimeSlot[] }>(`/restaurants/${selectedRestaurantId}/availability`, {
        params: { date, partySize },
      }).then(r => r.data.data),
    enabled: !!selectedRestaurantId && !!date,
  });

  const reserveMutation = useMutation({
    mutationFn: (payload: ReservationPayload) =>
      api.post<{ data: ReservationResult }>('/reservations', payload).then(r => r.data.data),
    onSuccess: data => setConfirmation(data),
  });

  const handleSubmit = () => {
    if (!selectedRestaurantId || !date || !selectedTime || !partySize) return;
    reserveMutation.mutate({
      restaurant: selectedRestaurantId,
      date,
      time: selectedTime,
      partySize,
      specialRequests: specialRequests || undefined,
      occasion: occasion !== 'None' ? occasion.toLowerCase() : undefined,
    });
  };

  const isFormValid = !!selectedRestaurantId && !!date && !!selectedTime && partySize > 0;

  return (
    <motion.div {...pageVariants}>
      <PageLayout>
        {/* Header */}
        <div className="bg-primary py-14 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.p variants={fadeUp} className="font-body text-gold/70 text-xs uppercase tracking-widest mb-3">
                Table booking
              </motion.p>
              <motion.h1 variants={fadeUp} className="font-heading text-4xl md:text-5xl text-cream mb-2">
                Reserve a Table
              </motion.h1>
              {restaurant && (
                <motion.p variants={fadeUp} className="font-body text-cream/50 text-sm">
                  at {restaurant.name} · {restaurant.address.city}
                </motion.p>
              )}
            </motion.div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Step 1: Date & Guests */}
          <div className="bg-white border border-gold/12 rounded-2xl p-5 sm:p-6">
            <h2 className="font-heading text-xl text-primary mb-5 flex items-center gap-2">
              <CalendarDays size={18} className="text-gold" />
              When & how many?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest block mb-2">Date</label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={e => { setDate(e.target.value); setSelectedTime(''); setSelectedTable(null); }}
                  className="w-full px-4 py-3 border border-gold/15 rounded-xl text-sm font-body text-charcoal focus:outline-none focus:border-gold/40 bg-cream/30"
                />
              </div>
              <div>
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest block mb-2">
                  <Users size={11} className="inline mr-1" />
                  Party size
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPartySize(p => Math.max(1, p - 1))}
                    className="w-10 h-10 rounded-xl border border-gold/20 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="flex-1 text-center font-heading text-2xl text-primary">{partySize}</span>
                  <button
                    onClick={() => setPartySize(p => Math.min(20, p + 1))}
                    className="w-10 h-10 rounded-xl border border-gold/20 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Time slots */}
          <AnimatePresence>
            {date && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-gold/12 rounded-2xl p-5 sm:p-6">
                  <h2 className="font-heading text-xl text-primary mb-5 flex items-center gap-2">
                    <Clock size={18} className="text-gold" />
                    Available times
                  </h2>
                  {slotsLoading ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
                    </div>
                  ) : !timeSlots || timeSlots.length === 0 ? (
                    <p className="font-body text-sm text-charcoal/40 text-center py-4">No availability for this date. Try another day.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {timeSlots.map(slot => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2.5 rounded-xl text-sm font-body font-medium border transition-colors ${
                            selectedTime === slot.time
                              ? 'bg-primary border-primary text-cream'
                              : slot.available
                              ? 'border-gold/20 text-charcoal/70 hover:border-gold/40 hover:text-primary'
                              : 'border-charcoal/8 text-charcoal/25 cursor-not-allowed bg-charcoal/3'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Floor map */}
          <AnimatePresence>
            {selectedTime && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <FloorMap
                  selectedTable={selectedTable}
                  partySize={partySize}
                  onSelect={setSelectedTable}
                />
                {selectedTable && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-body text-xs text-charcoal/50 text-center mt-2"
                  >
                    Table {MAP_TABLES.find(t => t.id === selectedTable)?.number} selected ·{' '}
                    {MAP_TABLES.find(t => t.id === selectedTable)?.seats} seats
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 4: Details */}
          <div className="bg-white border border-gold/12 rounded-2xl p-5 sm:p-6">
            <h2 className="font-heading text-xl text-primary mb-5 flex items-center gap-2">
              <MessageSquare size={18} className="text-gold" />
              Additional details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest block mb-2">Occasion</label>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map(o => (
                    <button
                      key={o}
                      onClick={() => setOccasion(o)}
                      className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
                        occasion === o
                          ? 'bg-primary border-primary text-cream'
                          : 'border-gold/20 text-charcoal/60 hover:border-gold/40'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest block mb-2">Special requests</label>
                <textarea
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="Dietary requirements, seating preferences, celebrations…"
                  rows={3}
                  className="w-full px-4 py-3 border border-gold/15 rounded-xl text-sm font-body text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-gold/40 resize-none bg-cream/30"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-cream/50 border border-gold/12 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1 font-body text-sm">
                {restaurant && <p className="font-semibold text-primary">{restaurant.name}</p>}
                {date && <p className="text-charcoal/50">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}{selectedTime ? ` · ${selectedTime}` : ''}</p>}
                <p className="text-charcoal/50">{partySize} {partySize === 1 ? 'guest' : 'guests'}</p>
              </div>
              {occasion !== 'None' && <Badge variant="gold">{occasion}</Badge>}
            </div>
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              loading={reserveMutation.isPending}
              disabled={!isFormValid || reserveMutation.isPending}
            >
              Confirm Reservation
            </Button>
            <p className="text-center font-body text-xs text-charcoal/35 mt-3">Free cancellation up to 2 hours before</p>
          </div>
        </div>

        {/* Confirmation modal */}
        <Modal
          open={!!confirmation}
          onClose={() => setConfirmation(null)}
          size="sm"
        >
          {confirmation && (
            <ConfirmationModal
              reservation={confirmation}
              onClose={() => setConfirmation(null)}
            />
          )}
        </Modal>
      </PageLayout>
    </motion.div>
  );
}
