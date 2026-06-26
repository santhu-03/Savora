import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  className?: string;
}

const priceLabel = ['', '₹', '₹₹', '₹₹₹', '₹₹₹₹'];

function CoverPlaceholder({ name }: { name: string }) {
  const hue = name.charCodeAt(0) % 60;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `hsl(${hue + 20}, 25%, 22%)` }}
    >
      <span className="font-heading text-5xl text-cream/20 select-none">
        {name.charAt(0)}
      </span>
    </div>
  );
}

export function RestaurantCard({ restaurant, className }: RestaurantCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('group', className)}
    >
      <Link to={`/restaurants/${restaurant._id}`} className="block">
        <div className="bg-white rounded-2xl overflow-hidden border border-gold/10 shadow-sm hover:shadow-md hover:border-gold/25 transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {restaurant.coverImage ? (
              <img
                src={restaurant.coverImage}
                alt={restaurant.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <CoverPlaceholder name={restaurant.name} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {restaurant.cuisine.slice(0, 2).map(c => (
                <Badge key={c} variant="gold" size="sm">{c}</Badge>
              ))}
            </div>

            {/* Price range */}
            <div className="absolute top-3 right-3">
              <span className="bg-black/50 backdrop-blur-sm text-cream/80 text-xs font-body px-2 py-0.5 rounded-full">
                {priceLabel[restaurant.priceRange]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-heading text-xl text-primary leading-tight group-hover:text-gold transition-colors duration-200">
                {restaurant.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                <Star size={13} className="fill-gold text-gold" />
                <span className="font-body text-sm font-semibold text-charcoal">
                  {restaurant.averageRating.toFixed(1)}
                </span>
                <span className="font-body text-xs text-charcoal/40">
                  ({restaurant.totalReviews})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-body text-charcoal/50 mb-3">
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {restaurant.address.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                20–35 min
              </span>
            </div>

            <div className="flex items-center justify-between">
              {restaurant.settings.allowDelivery && restaurant.settings.deliveryFee === 0 ? (
                <span className="text-xs font-body text-green-600 font-medium">Free delivery</span>
              ) : restaurant.settings.allowDelivery ? (
                <span className="text-xs font-body text-charcoal/40">
                  ₹{restaurant.settings.deliveryFee} delivery
                </span>
              ) : (
                <span className="text-xs font-body text-charcoal/40">Dine-in only</span>
              )}
              <span className="flex items-center gap-0.5 text-xs font-body text-gold font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Order now <ChevronRight size={12} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
