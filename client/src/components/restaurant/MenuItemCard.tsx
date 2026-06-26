import { motion } from 'framer-motion';
import { Plus, Minus, Leaf, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import type { MenuItem } from '@/types';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
  compact?: boolean;
}

export function MenuItemCard({ item, restaurantId, compact = false }: MenuItemCardProps) {
  const items = useCart(state => state.items);
  const addItem = useCart(state => state.addItem);
  const updateQuantity = useCart(state => state.updateQuantity);
  const cartItem = items.find(i => i.menuItemId === item._id);
  const qty = cartItem?.quantity ?? 0;
  const price = item.discountedPrice ?? item.basePrice;

  const handleAdd = () => {
    addItem(restaurantId, {
      menuItemId: item._id,
      name: item.name,
      price,
      quantity: 1,
      image: item.images[0],
    });
  };

  const handleQtyChange = (delta: number) => {
    const next = qty + delta;
    if (next <= 0) {
      updateQuantity(item._id, 0);
    } else {
      updateQuantity(item._id, next);
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 py-3 border-b border-gold/8 last:border-0', !item.isAvailable && 'opacity-50')}>
        {item.images[0] && (
          <img src={item.images[0]} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" loading="lazy" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium text-primary truncate">{item.name}</p>
          <p className="font-body text-xs text-charcoal/50 truncate">{item.shortDescription || item.description}</p>
          <p className="font-body text-sm font-semibold text-gold mt-0.5">{formatCurrency(price)}</p>
        </div>
        {item.isAvailable && (
          qty > 0 ? (
            <div className="flex items-center gap-2">
              <button onClick={() => handleQtyChange(-1)} className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors">
                <Minus size={12} />
              </button>
              <span className="font-body text-sm font-semibold text-primary w-4 text-center">{qty}</span>
              <button onClick={() => handleQtyChange(1)} className="w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/20 transition-colors">
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button onClick={handleAdd} className="w-7 h-7 rounded-full border border-gold/40 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors">
              <Plus size={14} />
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white rounded-2xl border border-gold/10 overflow-hidden group hover:border-gold/25 hover:shadow-md transition-all duration-300',
        !item.isAvailable && 'opacity-60'
      )}
    >
      {/* Image */}
      {item.images[0] ? (
        <div className="relative aspect-[3/2] overflow-hidden">
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          {item.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge variant="gold" size="sm">Featured</Badge>
            </div>
          )}
          {item.discountedPrice && (
            <div className="absolute top-2 right-2">
              <Badge variant="green" size="sm">Sale</Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[3/2] bg-gradient-to-br from-primary/10 to-gold/5 flex items-center justify-center">
          <span className="font-heading text-4xl text-gold/20">{item.name.charAt(0)}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="font-body font-semibold text-primary text-sm leading-snug">{item.name}</h4>
          <div className="flex items-center gap-1 shrink-0">
            {item.isVegetarian && <Leaf size={13} className="text-green-600" />}
            {item.spiceLevel === 'hot' || item.spiceLevel === 'extra-hot' ? <Flame size={13} className="text-copper" /> : null}
          </div>
        </div>

        {item.description && (
          <p className="font-body text-xs text-charcoal/50 line-clamp-2 mb-3 leading-relaxed">
            {item.shortDescription || item.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-body font-bold text-primary">{formatCurrency(price)}</span>
            {item.discountedPrice && (
              <span className="font-body text-xs text-charcoal/40 line-through ml-1.5">{formatCurrency(item.basePrice)}</span>
            )}
          </div>

          {item.isAvailable ? (
            qty > 0 ? (
              <div className="flex items-center gap-2">
                <button onClick={() => handleQtyChange(-1)} className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors">
                  <Minus size={12} />
                </button>
                <span className="font-body text-sm font-bold text-primary w-4 text-center">{qty}</span>
                <button onClick={() => handleQtyChange(1)} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-cream hover:bg-primary-light transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button onClick={handleAdd} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-cream hover:bg-primary-light transition-colors">
                <Plus size={14} />
              </button>
            )
          ) : (
            <span className="font-body text-xs text-charcoal/40 bg-charcoal/5 px-2.5 py-1 rounded-full">Unavailable</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
