import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  UtensilsCrossed, Plus, Search, ToggleLeft, ToggleRight,
  MoreHorizontal, GripVertical, X, Upload, Tag,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Types ─────────────────────────────────────────────────────
interface MenuItem {
  id: number; name: string; description: string; category: string;
  price: number; discountPrice?: number;
  dietary: string[]; allergens: string[];
  available: boolean; orders: number;
}

const INITIAL_CATS = ['Starters', 'Mains', 'Desserts', 'Drinks', 'Specials'];

const INITIAL_ITEMS: MenuItem[] = [
  { id: 1, name: 'Truffle Arancini',      description: 'Crispy risotto balls with black truffle',       category: 'Starters', price: 800,  dietary: ['veg'],         allergens: ['gluten','dairy'],   available: true,  orders: 22 },
  { id: 2, name: 'Burrata Caprese',        description: 'Fresh burrata with heirloom tomatoes',          category: 'Starters', price: 950,  dietary: ['veg', 'gf'],   allergens: ['dairy'],            available: true,  orders: 18 },
  { id: 3, name: 'Saffron Risotto',        description: 'Arborio rice, saffron, aged parmesan',         category: 'Mains',    price: 1240, dietary: ['veg', 'gf'],   allergens: ['dairy'],            available: true,  orders: 34 },
  { id: 4, name: 'Pan-Seared Duck',        description: 'Duck breast, cherry jus, root vegetables',     category: 'Mains',    price: 1680, dietary: [],              allergens: [],                   available: true,  orders: 28 },
  { id: 5, name: 'Grilled Sea Bass',       description: 'Atlantic sea bass, lemon beurre blanc',        category: 'Mains',    price: 1920, dietary: ['gf'],          allergens: ['fish'],             available: false, orders: 15 },
  { id: 6, name: 'Chocolate Fondant',      description: 'Warm chocolate cake, vanilla ice cream',       category: 'Desserts', price: 680,  dietary: ['veg'],         allergens: ['gluten','dairy','egg'], available: true, orders: 19 },
  { id: 7, name: 'Panna Cotta',            description: 'Vanilla panna cotta, berry coulis',            category: 'Desserts', price: 520,  dietary: ['veg', 'gf'],   allergens: ['dairy'],            available: true,  orders: 12 },
  { id: 8, name: 'Elderflower Spritz',     description: 'Elderflower cordial, prosecco, mint',          category: 'Drinks',   price: 420,  dietary: ['veg', 'gf'],   allergens: [],                   available: true,  orders: 31 },
];

const DIETARY_META: Record<string, { label: string; color: string }> = {
  veg:   { label: 'Veg',   color: '#16a34a' },
  vegan: { label: 'Vegan', color: '#0891b2' },
  gf:    { label: 'GF',    color: '#9333ea' },
};

const ALL_ALLERGENS = ['gluten', 'dairy', 'egg', 'nuts', 'fish', 'shellfish', 'soy'];
const ALL_DIETARY   = ['veg', 'vegan', 'gf'];

// ─── Sortable category pill ─────────────────────────────────────
function SortableCat({ id, active, onClick }: { id: string; active: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center"
    >
      <div {...listeners} {...attributes} className="cursor-grab px-1 text-charcoal/20 hover:text-charcoal/40">
        <GripVertical size={12} />
      </div>
      <button
        onClick={onClick}
        className="font-body text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
        style={{
          backgroundColor: active ? '#260B10' : 'transparent',
          color: active ? '#fff' : 'rgba(26,26,26,0.5)',
        }}>
        {id}
      </button>
    </div>
  );
}

// ─── Add/Edit modal ─────────────────────────────────────────────
function ItemModal({
  item, categories, onClose, onSave,
}: {
  item: Partial<MenuItem> | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: Partial<MenuItem>) => void;
}) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState<Partial<MenuItem>>(item ?? {
    name: '', description: '', category: categories[0] ?? 'Starters',
    price: 0, dietary: [], allergens: [], available: true,
  });
  const [dragOver, setDragOver] = useState(false);

  const set = (k: keyof MenuItem, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleArr = (key: 'dietary' | 'allergens', val: string) => {
    const arr = form[key] as string[] ?? [];
    set(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-card-hover w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-charcoal">
            {isEdit ? 'Edit Item' : 'Add Menu Item'}
          </h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          {/* Image drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); }}
            className="h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
            style={{
              borderColor: dragOver ? '#BF8B5E' : 'rgba(0,0,0,0.1)',
              backgroundColor: dragOver ? 'rgba(191,139,94,0.05)' : 'rgba(0,0,0,0.02)',
            }}>
            <Upload size={18} className="text-charcoal/25" />
            <p className="font-body text-xs text-charcoal/35">Drop image or click to upload</p>
          </div>

          <div>
            <label className="section-label block mb-1.5">Item Name</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Truffle Arancini" className="input w-full" />
          </div>

          <div>
            <label className="section-label block mb-1.5">Description</label>
            <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Brief description…"
              className="input w-full resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="section-label block mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input w-full">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1.5">Price (₹)</label>
              <input type="number" value={form.price ?? ''} onChange={e => set('price', Number(e.target.value))}
                placeholder="0" className="input w-full" />
            </div>
            <div>
              <label className="section-label block mb-1.5">Offer Price</label>
              <input type="number" value={form.discountPrice ?? ''} onChange={e => set('discountPrice', Number(e.target.value))}
                placeholder="Optional" className="input w-full" />
            </div>
          </div>

          <div>
            <label className="section-label block mb-2 flex items-center gap-1.5">
              <Tag size={11} /> Dietary Tags
            </label>
            <div className="flex gap-2 flex-wrap">
              {ALL_DIETARY.map(d => {
                const meta = DIETARY_META[d];
                const active = (form.dietary ?? []).includes(d);
                return (
                  <button key={d} onClick={() => toggleArr('dietary', d)}
                    className="font-body text-xs px-3 py-1 rounded-lg border transition-all"
                    style={{
                      backgroundColor: active ? `${meta.color}15` : 'transparent',
                      borderColor: active ? meta.color : 'rgba(0,0,0,0.1)',
                      color: active ? meta.color : 'rgba(26,26,26,0.5)',
                    }}>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="section-label block mb-2">Allergens</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_ALLERGENS.map(a => {
                const active = (form.allergens ?? []).includes(a);
                return (
                  <button key={a} onClick={() => toggleArr('allergens', a)}
                    className="font-body text-xs px-3 py-1 rounded-lg border transition-all capitalize"
                    style={{
                      backgroundColor: active ? 'rgba(239,68,68,0.08)' : 'transparent',
                      borderColor: active ? '#ef4444' : 'rgba(0,0,0,0.1)',
                      color: active ? '#dc2626' : 'rgba(26,26,26,0.5)',
                    }}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="font-body text-sm text-charcoal/70">Available on menu</label>
            <button onClick={() => set('available', !form.available)}>
              {form.available
                ? <ToggleRight size={24} style={{ color: '#BF8B5E' }} />
                : <ToggleLeft size={24} className="text-charcoal/25" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            disabled={!form.name}
            className="btn-primary flex-1 disabled:opacity-40">
            {isEdit ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Menu Management page ───────────────────────────────────────
export function MenuManagement() {
  const [categories, setCategories] = useState(INITIAL_CATS);
  const [items, setItems]           = useState<MenuItem[]>(INITIAL_ITEMS);
  const [activeCategory, setActiveCat] = useState('All');
  const [search, setSearch]         = useState('');
  const [modalItem, setModalItem]   = useState<Partial<MenuItem> | null | undefined>(undefined);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setCategories(prev => {
        const from = prev.indexOf(active.id as string);
        const to   = prev.indexOf(over.id as string);
        return arrayMove(prev, from, to);
      });
    }
  };

  const toggle = (id: number) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, available: !it.available } : it));

  const saveItem = (data: Partial<MenuItem>) => {
    if (data.id) {
      setItems(prev => prev.map(it => it.id === data.id ? { ...it, ...data } as MenuItem : it));
    } else {
      const newItem: MenuItem = {
        id: Math.max(...items.map(i => i.id)) + 1,
        name: data.name ?? '',
        description: data.description ?? '',
        category: data.category ?? categories[0],
        price: data.price ?? 0,
        discountPrice: data.discountPrice,
        dietary: data.dietary ?? [],
        allergens: data.allergens ?? [],
        available: data.available ?? true,
        orders: 0,
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const filtered = items.filter(it => {
    const matchCat = activeCategory === 'All' || it.category === activeCategory;
    const matchS   = it.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchS;
  });

  const unavailable = items.filter(it => !it.available).length;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Menu Management</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">
              {items.length} items · {unavailable} unavailable
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex gap-2">
            <button className="btn-ghost text-xs">Import CSV</button>
            <button onClick={() => setModalItem(null)} className="btn-primary text-xs gap-1.5">
              <Plus size={13} /> Add Item
            </button>
          </motion.div>
        </motion.div>

        {/* Category tabs (drag-to-reorder) + search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 flex-wrap">

          <div className="flex items-center bg-black/[0.04] rounded-xl p-1">
            {/* All button (not sortable) */}
            <button
              onClick={() => setActiveCat('All')}
              className="font-body text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                backgroundColor: activeCategory === 'All' ? '#260B10' : 'transparent',
                color: activeCategory === 'All' ? '#fff' : 'rgba(26,26,26,0.5)',
              }}>
              All
            </button>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categories} strategy={verticalListSortingStrategy}>
                {categories.map(cat => (
                  <SortableCat key={cat} id={cat}
                    active={activeCategory === cat}
                    onClick={() => setActiveCat(cat)} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search menu…" className="input w-full pl-8 py-2 text-xs" />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card !p-0 overflow-hidden">
          <div className="table-container">
            <table className="premium">
              <thead>
                <tr>
                  <th className="w-8" />
                  <th>Item</th>
                  <th>Category</th>
                  <th>Dietary</th>
                  <th>Allergens</th>
                  <th>Orders (7d)</th>
                  <th className="text-right">Price</th>
                  <th>Available</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025 }}
                    className={!item.available ? 'opacity-50' : ''}>
                    <td className="w-8">
                      <GripVertical size={14} className="text-charcoal/20 cursor-grab" />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center flex-shrink-0">
                          <UtensilsCrossed size={13} className="text-charcoal/30" />
                        </div>
                        <div>
                          <p className="font-body text-sm font-medium text-charcoal/80">{item.name}</p>
                          <p className="font-body text-xs text-charcoal/35 max-w-[200px] truncate">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-body text-xs text-charcoal/50">{item.category}</span></td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.dietary.map(d => {
                          const m = DIETARY_META[d];
                          return m ? (
                            <span key={d} className="font-body text-2xs px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                              {m.label}
                            </span>
                          ) : null;
                        })}
                        {item.dietary.length === 0 && <span className="text-charcoal/20 text-xs">—</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.allergens.slice(0, 3).map(a => (
                          <span key={a} className="font-body text-2xs px-1.5 py-0.5 rounded-md capitalize"
                            style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                            {a}
                          </span>
                        ))}
                        {item.allergens.length > 3 && (
                          <span className="font-body text-2xs text-charcoal/35">+{item.allergens.length - 3}</span>
                        )}
                        {item.allergens.length === 0 && <span className="text-charcoal/20 text-xs">—</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{ width: `${(item.orders / 34) * 100}%`, backgroundColor: '#BF8B5E' }} />
                        </div>
                        <span className="font-body text-xs text-charcoal/50">{item.orders}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-body text-sm font-semibold text-charcoal/70">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        {item.discountPrice && (
                          <span className="font-body text-xs text-emerald-600">
                            ₹{item.discountPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button onClick={() => toggle(item.id)}>
                        {item.available
                          ? <ToggleRight size={22} style={{ color: '#BF8B5E' }} />
                          : <ToggleLeft size={22} className="text-charcoal/25" />}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => setModalItem(item)} className="btn-icon w-7 h-7">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>

      <AnimatePresence>
        {modalItem !== undefined && (
          <ItemModal
            item={modalItem}
            categories={categories}
            onClose={() => setModalItem(undefined)}
            onSave={saveItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
