import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { connectSocket, joinKitchen } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';

// ─── Types ─────────────────────────────────────────────────────
interface KitchenItem { name: string; qty: number; note?: string; done: boolean }
interface Ticket {
  id: string; table: string; type: 'Dine In' | 'Takeaway' | 'Delivery';
  items: KitchenItem[];
  status: 'incoming' | 'preparing' | 'ready';
  elapsed: number;
}

const INITIAL: Ticket[] = [
  {
    id: 'SVR-0093', table: 'T-05', type: 'Dine In', status: 'incoming', elapsed: 30,
    items: [
      { name: 'Saffron Risotto',   qty: 2, done: false },
      { name: 'Truffle Arancini',  qty: 1, note: 'Extra truffle', done: false },
    ],
  },
  {
    id: 'SVR-0091', table: 'T-03', type: 'Dine In', status: 'incoming', elapsed: 220,
    items: [
      { name: 'Pan-Seared Duck',   qty: 2, note: 'No mushrooms', done: false },
      { name: 'Burrata Caprese',   qty: 1, done: false },
    ],
  },
  {
    id: 'SVR-0090', table: 'T-07', type: 'Dine In', status: 'preparing', elapsed: 720,
    items: [
      { name: 'Truffle Arancini',  qty: 2, done: true },
      { name: 'Grilled Sea Bass',  qty: 1, done: false },
      { name: 'Chocolate Fondant', qty: 2, done: false },
    ],
  },
  {
    id: 'SVR-0088', table: 'T-01', type: 'Dine In', status: 'preparing', elapsed: 1020,
    items: [
      { name: 'Saffron Risotto',   qty: 1, done: true },
      { name: 'Panna Cotta',       qty: 1, done: false },
    ],
  },
  {
    id: 'SVR-0087', table: '—',    type: 'Delivery', status: 'ready', elapsed: 1380,
    items: [
      { name: 'Elderflower Spritz', qty: 2, done: true },
      { name: 'Truffle Fries',      qty: 1, done: true },
    ],
  },
];

// ─── Urgency helpers ───────────────────────────────────────────
function urgency(s: number): { color: string; bg: string; border: string; label: string } {
  if (s < 600)  return { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'On time'   };
  if (s < 1200) return { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Watch'     };
  return              { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: 'Overdue'   };
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ─── Web Audio beep ────────────────────────────────────────────
function playBeep() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

// ─── Column config ─────────────────────────────────────────────
const COLS: { key: Ticket['status']; label: string; dot: string }[] = [
  { key: 'incoming',  label: 'Incoming',  dot: '#f59e0b' },
  { key: 'preparing', label: 'Preparing', dot: '#3b82f6' },
  { key: 'ready',     label: 'Ready',     dot: '#22c55e' },
];

// ─── Ticket card ───────────────────────────────────────────────
function TicketCard({
  ticket, onAdvance, onToggleItem,
}: {
  ticket: Ticket;
  onAdvance: (id: string) => void;
  onToggleItem: (ticketId: string, itemIdx: number) => void;
}) {
  const urg = urgency(ticket.elapsed);
  const allDone = ticket.items.every(i => i.done);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden border"
      style={{
        backgroundColor: '#1e1e1e',
        borderColor: urg.border + '40',
        boxShadow: `0 2px 16px rgba(0,0,0,0.4), 0 0 0 1px ${urg.border}20`,
      }}
    >
      {/* Top urgency bar */}
      <div className="h-0.5" style={{ backgroundColor: urg.color }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span className="font-body text-sm font-bold text-white/90">{ticket.table}</span>
            <span className="font-mono text-2xs text-white/30">{ticket.id}</span>
          </div>
          <span className="font-body text-2xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            {ticket.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-sm font-semibold"
            style={{ color: urg.color }}>
            {ticket.elapsed >= 1200 ? <AlertTriangle size={13} /> : <Clock size={13} />}
            {fmtTime(ticket.elapsed)}
          </div>
        </div>
      </div>

      {/* Items checklist */}
      <div className="px-4 py-3 space-y-2">
        {ticket.items.map((item, i) => (
          <div key={i}
            className="flex items-start gap-2.5 cursor-pointer group"
            onClick={() => onToggleItem(ticket.id, i)}>
            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150 border
              ${item.done
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-white/20 group-hover:border-white/40'
              }`}>
              {item.done && <CheckCircle2 size={10} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className={`font-body text-sm transition-colors duration-150
                ${item.done ? 'text-white/30 line-through' : 'text-white/80'}`}>
                <span className="font-semibold">{item.qty}×</span> {item.name}
              </p>
              {item.note && (
                <p className="font-body text-xs text-amber-400 mt-0.5">⚠ {item.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="px-4 pb-3.5">
        {ticket.status === 'ready' ? (
          <div className="flex items-center gap-2 text-emerald-400 font-body text-xs font-medium">
            <CheckCircle2 size={14} /> Ready to serve
          </div>
        ) : (
          <button
            onClick={() => onAdvance(ticket.id)}
            disabled={!allDone && ticket.status === 'preparing'}
            className="w-full font-body text-xs font-semibold py-2 rounded-xl transition-all duration-150 active:scale-[0.97]"
            style={{
              backgroundColor: allDone || ticket.status === 'incoming' ? urg.color : 'rgba(255,255,255,0.06)',
              color: allDone || ticket.status === 'incoming' ? '#fff' : 'rgba(255,255,255,0.25)',
              cursor: allDone || ticket.status === 'incoming' ? 'pointer' : 'not-allowed',
            }}
          >
            {ticket.status === 'incoming' ? '→ Start Preparing' : allDone ? '→ Mark Ready' : 'Complete items first'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function orderTypeLabel(type: string): Ticket['type'] {
  if (type === 'takeaway') return 'Takeaway';
  if (type === 'delivery') return 'Delivery';
  return 'Dine In';
}

// ─── Kitchen page ──────────────────────────────────────────────
export function Kitchen() {
  const { activeRestaurant } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL);
  const [muted, setMuted]     = useState(false);
  const socketRef             = useRef(connectSocket());
  const mutedRef              = useRef(muted);
  mutedRef.current = muted;

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setTickets(t => t.map(tk => ({ ...tk, elapsed: tk.elapsed + 1 })));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Socket: join kitchen room + listen for events
  useEffect(() => {
    const socket = socketRef.current;

    const handleConnect = () => joinKitchen(activeRestaurant);

    const handleHydrate = (orders: any[]) => {
      const mapped: Ticket[] = orders.map(o => ({
        id:      o.orderNumber ?? o._id,
        table:   o.tableId?.tableNumber ?? '—',
        type:    orderTypeLabel(o.type),
        status:  o.status === 'pending' ? 'incoming'
               : o.status === 'ready'   ? 'ready'
               : 'preparing',
        elapsed: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000),
        items:   (o.items ?? []).map((i: any) => ({
          name: i.name,
          qty:  i.quantity,
          note: i.specialInstructions,
          done: ['ready', 'served'].includes(i.status),
        })),
      }));
      setTickets(mapped);
    };

    const handleNewOrder = (payload: any) => {
      const ticket: Ticket = {
        id:      payload.orderNumber ?? payload.orderId,
        table:   payload.tableId ? `T-${payload.tableId.slice(-2)}` : '—',
        type:    orderTypeLabel(payload.type),
        status:  'incoming',
        elapsed: 0,
        items:   (payload.items ?? []).map((i: any) => ({
          name: i.name,
          qty:  i.quantity,
          note: i.specialInstructions,
          done: false,
        })),
      };
      setTickets(t => [ticket, ...t]);
      if (!mutedRef.current) playBeep();
    };

    const handleStatusUpdated = (payload: any) => {
      setTickets(t => t.map(tk =>
        tk.id === payload.orderNumber || tk.id === payload.orderId
          ? {
              ...tk,
              status: payload.status === 'pending'  ? 'incoming'
                    : payload.status === 'ready'    ? 'ready'
                    : 'preparing',
            }
          : tk
      ));
    };

    const handleItemReady = (payload: any) => {
      setTickets(t => t.map(tk => {
        if (tk.id !== payload.orderNumber && tk.id !== payload.orderId) return tk;
        return {
          ...tk,
          items: tk.items.map(item =>
            item.name === payload.itemName ? { ...item, done: true } : item
          ),
        };
      }));
    };

    socket.on('connect',              handleConnect);
    socket.on('kitchen:hydrate',      handleHydrate);
    socket.on('new_order',            handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdated);
    socket.on('order_item_ready',     handleItemReady);

    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect',              handleConnect);
      socket.off('kitchen:hydrate',      handleHydrate);
      socket.off('new_order',            handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdated);
      socket.off('order_item_ready',     handleItemReady);
    };
  }, [activeRestaurant]);

  const advance = useCallback((id: string) => {
    setTickets(t => {
      const ticket = t.find(tk => tk.id === id);
      if (!ticket) return t;

      const newStatus = ticket.status === 'incoming' ? 'preparing' : 'ready';
      socketRef.current.emit('kitchen_update_status', {
        orderId:      id,
        restaurantId: activeRestaurant,
        status:       newStatus === 'preparing' ? 'confirmed' : 'ready',
      });
      return t.map(tk =>
        tk.id === id ? { ...tk, status: newStatus } : tk
      );
    });
  }, [activeRestaurant]);

  const toggleItem = useCallback((ticketId: string, idx: number) => {
    setTickets(t => {
      const ticket = t.find(tk => tk.id === ticketId);
      if (!ticket) return t;
      const item = ticket.items[idx];
      if (!item) return t;

      const newDone = !item.done;
      if (newDone) {
        socketRef.current.emit('kitchen_update_status', {
          orderId:      ticketId,
          restaurantId: activeRestaurant,
          itemId:       idx.toString(),
          status:       'ready',
        });
      }
      return t.map(tk =>
        tk.id === ticketId
          ? { ...tk, items: tk.items.map((it, i) => i === idx ? { ...it, done: newDone } : it) }
          : tk
      );
    });
  }, [activeRestaurant]);

  const byStatus = (s: Ticket['status']) => tickets.filter(t => t.status === s);
  const active   = tickets.filter(t => t.status !== 'ready').length;

  return (
    <div className="h-full overflow-y-auto no-scrollbar" style={{ backgroundColor: '#111111' }}>
      <div className="p-5 max-w-[1600px] space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white">Kitchen Display</h1>
            <p className="font-body text-xs text-white/35 mt-0.5">
              {active} active · {tickets.filter(t => t.status === 'ready').length} ready to serve
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Urgency legend */}
            <div className="hidden md:flex items-center gap-4 font-body text-xs text-white/40">
              {[
                { color: '#16a34a', label: '< 10 min' },
                { color: '#d97706', label: '10–20 min' },
                { color: '#dc2626', label: '> 20 min' },
              ].map(u => (
                <div key={u.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }} />
                  {u.label}
                </div>
              ))}
            </div>
            <button onClick={() => setMuted(m => !m)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150"
              style={{
                backgroundColor: muted ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
                color: muted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)',
              }}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <div className="flex items-center gap-2 text-emerald-400 font-body text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="grid lg:grid-cols-3 gap-4">
          {COLS.map(col => {
            const cards = byStatus(col.key);
            return (
              <div key={col.key}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
                  <span className="font-body text-sm font-semibold text-white/60">{col.label}</span>
                  <span className="font-body text-2xs px-1.5 py-0.5 rounded-full ml-auto"
                    style={{ backgroundColor: col.dot + '20', color: col.dot }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {cards.map(t => (
                      <TicketCard key={t.id} ticket={t} onAdvance={advance} onToggleItem={toggleItem} />
                    ))}
                  </AnimatePresence>
                  {cards.length === 0 && (
                    <div className="h-28 rounded-2xl border-2 border-dashed flex items-center justify-center"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <span className="font-body text-xs text-white/20">No tickets</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
