import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Download, Users, Plus, X, Check, Loader2,
  FileText, Printer, RefreshCw, ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// ─── Animations ─────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

// ─── Constants ──────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
const QR_BASE = 'https://savora.app/menu';

type TableStatus = 'occupied' | 'reserved' | 'available' | 'maintenance';
type PrintTemplate = 'card' | 'tent' | 'sticker';

interface Table {
  id: string;
  mongoId?: string;
  seats: number;
  status: TableStatus;
  section: string;
  currentGuest: string | null;
  qrGenerated: boolean;
  qrCodeUrl?: string;
}

const INITIAL_TABLES: Table[] = [
  { id: 'T-01', seats: 2,  status: 'occupied',  section: 'Main',    qrGenerated: true,  currentGuest: 'Arjun M.' },
  { id: 'T-02', seats: 2,  status: 'reserved',  section: 'Main',    qrGenerated: true,  currentGuest: null },
  { id: 'T-03', seats: 4,  status: 'occupied',  section: 'Main',    qrGenerated: true,  currentGuest: 'Priya S.' },
  { id: 'T-04', seats: 2,  status: 'available', section: 'Main',    qrGenerated: true,  currentGuest: null },
  { id: 'T-05', seats: 4,  status: 'available', section: 'Main',    qrGenerated: true,  currentGuest: null },
  { id: 'T-06', seats: 4,  status: 'reserved',  section: 'Patio',   qrGenerated: true,  currentGuest: null },
  { id: 'T-07', seats: 6,  status: 'occupied',  section: 'Patio',   qrGenerated: true,  currentGuest: 'Kavya N.' },
  { id: 'T-08', seats: 4,  status: 'reserved',  section: 'Patio',   qrGenerated: true,  currentGuest: null },
  { id: 'T-09', seats: 6,  status: 'occupied',  section: 'Patio',   qrGenerated: false, currentGuest: 'Rohit K.' },
  { id: 'T-10', seats: 8,  status: 'available', section: 'Private', qrGenerated: true,  currentGuest: null },
  { id: 'T-11', seats: 6,  status: 'reserved',  section: 'Private', qrGenerated: true,  currentGuest: null },
  { id: 'T-12', seats: 4,  status: 'occupied',  section: 'Private', qrGenerated: true,  currentGuest: 'Meera V.' },
  { id: 'T-13', seats: 2,  status: 'available', section: 'Bar',     qrGenerated: false, currentGuest: null },
  { id: 'T-14', seats: 8,  status: 'reserved',  section: 'Bar',     qrGenerated: true,  currentGuest: null },
];

const STATUS_CFG: Record<TableStatus, { bg: string; border: string; dot: string; text: string; label: string }> = {
  occupied:    { bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444', text: '#991b1b', label: 'Occupied'    },
  reserved:    { bg: '#eff6ff', border: '#93c5fd', dot: '#3b82f6', text: '#1e40af', label: 'Reserved'    },
  available:   { bg: '#f0fdf4', border: '#86efac', dot: '#22c55e', text: '#166534', label: 'Available'   },
  maintenance: { bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b', text: '#92400e', label: 'Maintenance' },
};

const SECTIONS = ['All', 'Main', 'Patio', 'Private', 'Bar'];

const TEMPLATE_CFG: Record<PrintTemplate, { label: string; size: string; desc: string }> = {
  card:    { label: 'Table Card',  size: '85 × 55 mm',   desc: 'Standard business card size' },
  tent:    { label: 'Tent Card',   size: '148 × 210 mm', desc: 'A5 folded, stands on table'  },
  sticker: { label: 'Sticker',     size: '60 × 60 mm',   desc: 'Square sticker for surfaces'  },
};

// ─── Generate QR as data URL (client-side preview) ────────────────
async function generateQRDataUrl(tableId: string): Promise<string> {
  const url = `${QR_BASE}/${tableId}`;
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#260B10', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });
}

// ─── Download a PNG from dataURL ──────────────────────────────────
function downloadPng(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// ─── Auth token helper ────────────────────────────────────────────
function getToken(): string {
  try {
    const raw = localStorage.getItem('savora_admin_auth');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? parsed?.token ?? '';
  } catch {
    return '';
  }
}

// ─── QR Preview Modal ─────────────────────────────────────────────
function QRPreviewModal({
  table,
  restaurantName,
  onClose,
  onGenerate,
  generating,
}: {
  table: Table;
  restaurantName: string;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  generating: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [template, setTemplate]   = useState<PrintTemplate>('card');
  const [loading, setLoading]     = useState(true);
  const menuUrl = `${QR_BASE}/${table.mongoId ?? table.id}`;

  // Generate preview on mount
  useState(() => {
    generateQRDataUrl(table.mongoId ?? table.id)
      .then(url => { setQrDataUrl(url); setLoading(false); })
      .catch(() => setLoading(false));
  });

  const downloadQR = () => {
    if (qrDataUrl) downloadPng(qrDataUrl, `QR-${table.id}.png`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Card preview */}
        <div className="flex flex-col items-center p-8" style={{ backgroundColor: '#260B10' }}>
          {/* Gold border frame */}
          <div
            className="w-full rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{ border: '1px solid rgba(191,139,94,0.4)' }}
          >
            <p className="font-body text-xs tracking-widest" style={{ color: '#BF8B5E' }}>
              {restaurantName.toUpperCase()}
            </p>
            <p className="font-display text-2xl font-bold text-white">Table {table.id}</p>
            {table.section !== 'Main' && (
              <p className="font-body text-xs tracking-wider" style={{ color: 'rgba(191,139,94,0.6)' }}>
                {table.section.toUpperCase()}
              </p>
            )}

            {/* QR code */}
            <div className="w-36 h-36 bg-white rounded-xl flex items-center justify-center p-2">
              {loading ? (
                <Loader2 size={24} className="animate-spin text-charcoal/30" />
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode size={48} className="text-charcoal/20" />
              )}
            </div>

            <p className="font-body text-xs tracking-wider" style={{ color: '#BF8B5E' }}>
              SCAN TO VIEW OUR MENU
            </p>
            <p className="font-body text-[10px]" style={{ color: 'rgba(191,139,94,0.45)' }}>
              {table.seats} guests
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4">
          {/* Template selector */}
          <div>
            <p className="font-body text-xs text-charcoal/40 mb-2">Print template</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TEMPLATE_CFG) as [PrintTemplate, typeof TEMPLATE_CFG[PrintTemplate]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setTemplate(key)}
                  className="rounded-xl p-2.5 text-left transition-all duration-150 border"
                  style={{
                    backgroundColor: template === key ? '#260B10' : 'rgba(0,0,0,0.03)',
                    borderColor:     template === key ? '#260B10' : 'transparent',
                  }}
                >
                  <p className={`font-body text-xs font-semibold ${template === key ? 'text-white' : 'text-charcoal/70'}`}>
                    {cfg.label}
                  </p>
                  <p className={`font-body text-[10px] mt-0.5 ${template === key ? 'text-white/50' : 'text-charcoal/30'}`}>
                    {cfg.size}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Menu URL */}
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gold hover:text-gold-dark font-body text-xs transition-colors"
          >
            <ExternalLink size={12} />
            {menuUrl}
          </a>

          {/* Actions */}
          <div className="flex gap-2">
            {table.mongoId && (
              <button
                onClick={onGenerate}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-charcoal/10 font-body text-xs font-medium text-charcoal/60 hover:border-charcoal/20 hover:text-charcoal transition-all disabled:opacity-40"
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {generating ? 'Generating…' : 'Regenerate'}
              </button>
            )}
            <button
              onClick={downloadQR}
              disabled={!qrDataUrl}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-body text-xs font-semibold transition-all disabled:opacity-40 active:scale-[0.97]"
              style={{ backgroundColor: '#260B10', color: '#BF8B5E' }}
            >
              <Download size={12} /> Download PNG
            </button>
          </div>

          <button onClick={onClose} className="w-full text-center font-body text-xs text-charcoal/30 hover:text-charcoal/50 transition-colors pt-1">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Table Modal ──────────────────────────────────────────────
function AddTableModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (t: Omit<Table, 'currentGuest' | 'qrGenerated' | 'qrCodeUrl'>) => void;
}) {
  const [form, setForm] = useState({ id: '', seats: 4, section: 'Main', status: 'available' as TableStatus });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-card-hover w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-charcoal">Add Table</h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <div className="space-y-3.5">
          <div>
            <label className="section-label block mb-1.5">Table ID</label>
            <input value={form.id} onChange={e => set('id', e.target.value)}
              placeholder="e.g. T-15" className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-1.5">Capacity</label>
              <input type="number" min={1} max={20} value={form.seats}
                onChange={e => set('seats', parseInt(e.target.value))}
                className="input w-full" />
            </div>
            <div>
              <label className="section-label block mb-1.5">Section</label>
              <select value={form.section} onChange={e => set('section', e.target.value)} className="input w-full">
                {['Main', 'Patio', 'Private', 'Bar'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => { onSave({ ...form, status: form.status as TableStatus }); onClose(); }}
            disabled={!form.id}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            <Check size={14} /> Add Table
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Tables & QR Page ─────────────────────────────────────────────
export function Tables() {
  const { activeRestaurant, user } = useAuth();

  const [tables, setTables]       = useState<Table[]>(INITIAL_TABLES);
  const [section, setSection]     = useState('All');
  const [addOpen, setAddOpen]     = useState(false);
  const [previewTable, setPreview] = useState<Table | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const displayed = section === 'All' ? tables : tables.filter(t => t.section === section);
  const occupied  = tables.filter(t => t.status === 'occupied').length;
  const reserved  = tables.filter(t => t.status === 'reserved').length;
  const available = tables.filter(t => t.status === 'available').length;

  const addTable = (data: Omit<Table, 'currentGuest' | 'qrGenerated' | 'qrCodeUrl'>) => {
    setTables(prev => [...prev, { ...data, currentGuest: null, qrGenerated: false }]);
  };

  // ── Download individual QR PNG ──────────────────────────────────
  const downloadQR = useCallback(async (table: Table) => {
    const dataUrl = await generateQRDataUrl(table.mongoId ?? table.id);
    downloadPng(dataUrl, `QR-${table.id}.png`);
  }, []);

  // ── Generate QR via backend (saves to Cloudinary + DB) ─────────
  const generateQR = useCallback(async (table: Table) => {
    if (!table.mongoId) return;
    setGenerating(table.id);
    try {
      const res = await axios.post(
        `${API_URL}/restaurants/${user.restaurant}/tables/${table.mongoId}/generate-qr`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const { qrCodeUrl } = res.data.data;
      setTables(ts => ts.map(t => t.id === table.id ? { ...t, qrGenerated: true, qrCodeUrl } : t));
      if (previewTable?.id === table.id) {
        setPreview(t => t ? { ...t, qrGenerated: true, qrCodeUrl } : t);
      }
    } catch (err) {
      console.error('QR generation failed', err);
    } finally {
      setGenerating(null);
    }
  }, [user.restaurant, previewTable]);

  // ── Download all QRs as PDF via backend ────────────────────────
  const downloadAllPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/restaurants/${user.restaurant}/generate-all-qr`,
        {},
        {
          headers:      { Authorization: `Bearer ${getToken()}` },
          responseType: 'blob',
        }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${activeRestaurant.replace(/\s+/g, '-')}-QR-codes.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download PDF. Ensure the backend is running.');
    } finally {
      setPdfLoading(false);
    }
  }, [activeRestaurant, user.restaurant]);

  // ── Bulk individual download ─────────────────────────────────
  const bulkDownloadPng = useCallback(() => {
    displayed.forEach((t, i) => setTimeout(() => downloadQR(t), i * 250));
  }, [displayed, downloadQR]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between flex-wrap gap-3">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Tables & QR</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">
              {tables.length} tables · {occupied} occupied · {reserved} reserved · {available} available
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
            <button
              onClick={bulkDownloadPng}
              className="btn-ghost text-xs gap-1.5"
            >
              <Download size={13} /> Download PNGs
            </button>
            <button
              onClick={downloadAllPdf}
              disabled={pdfLoading}
              className="btn-ghost text-xs gap-1.5 disabled:opacity-50"
            >
              {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {pdfLoading ? 'Generating PDF…' : 'Download All QR PDF'}
            </button>
            <button onClick={() => setAddOpen(true)} className="btn-primary text-xs gap-1.5">
              <Plus size={13} /> Add Table
            </button>
          </motion.div>
        </motion.div>

        {/* KPI strip */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-3 gap-3">
          {[
            { label: 'Occupied',  value: occupied,  color: '#ef4444', pct: Math.round(occupied / tables.length * 100) },
            { label: 'Reserved',  value: reserved,  color: '#3b82f6', pct: Math.round(reserved / tables.length * 100) },
            { label: 'Available', value: available, color: '#22c55e', pct: Math.round(available / tables.length * 100) },
          ].map(({ label, value, color, pct }, i) => (
            <motion.div key={label} variants={fadeUp} custom={i * 0.05} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-body text-xs text-charcoal/30">{pct}%</span>
              </div>
              <p className="font-display text-3xl text-charcoal">{value}</p>
              <p className="font-body text-xs text-charcoal/40 mt-0.5">{label}</p>
              <div className="mt-3 h-1 bg-black/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full" style={{ backgroundColor: color }} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Floor plan */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card">

          {/* Section filter */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <p className="font-body text-sm font-medium text-charcoal/60 mr-2">Floor Plan</p>
            {SECTIONS.map(s => (
              <button key={s} onClick={() => setSection(s)}
                className="font-body text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  backgroundColor: section === s ? '#260B10' : 'rgba(0,0,0,0.04)',
                  color: section === s ? '#fff' : 'rgba(26,26,26,0.5)',
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* Table grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {displayed.map((t, i) => {
              const cfg = STATUS_CFG[t.status];
              const isGen = generating === t.id;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.025 }}
                  className="relative rounded-2xl p-3 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
                  onClick={() => setPreview(t)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body text-xs font-bold" style={{ color: cfg.text }}>{t.id}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <Users size={10} style={{ color: cfg.text + '80' }} />
                    <span className="font-body text-2xs" style={{ color: cfg.text + '80' }}>{t.seats}p</span>
                  </div>
                  {t.currentGuest && (
                    <p className="font-body text-2xs truncate" style={{ color: cfg.text + '90' }}>{t.currentGuest}</p>
                  )}
                  <p className="font-body text-2xs mt-1" style={{ color: cfg.text + '55' }}>{t.section}</p>

                  {/* QR action area */}
                  <div className="mt-2 flex items-center justify-between">
                    {isGen ? (
                      <Loader2 size={10} className="animate-spin" style={{ color: cfg.dot }} />
                    ) : (
                      <QrCode size={10} style={{ color: t.qrGenerated ? cfg.dot : '#d1d5db' }} />
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); downloadQR(t); }}
                      className="opacity-0 group-hover:opacity-100 font-body text-2xs transition-opacity px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: cfg.dot + '20', color: cfg.text }}
                      title="Download QR"
                    >
                      <Download size={9} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex items-center gap-4 flex-wrap pt-4 border-t border-black/[0.05]">
            {Object.entries(STATUS_CFG).map(([k, cfg]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                <span className="font-body text-xs text-charcoal/40">{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <Printer size={12} className="text-charcoal/25" />
              <span className="font-body text-xs text-charcoal/40">Click table to preview QR</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {addOpen && (
          <AddTableModal onClose={() => setAddOpen(false)} onSave={addTable} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewTable && (
          <QRPreviewModal
            table={previewTable}
            restaurantName={activeRestaurant}
            onClose={() => setPreview(null)}
            onGenerate={() => generateQR(previewTable)}
            generating={generating === previewTable.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
