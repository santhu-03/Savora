import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import type { Restaurant, PaginatedResponse } from '@/types';

const cuisines = ['Indian', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Thai', 'Continental', 'Mediterranean', 'Fast Food', 'Bakery'];
const sortOptions = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'deliveryTime', label: 'Fastest Delivery' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

interface Filters {
  cuisine: string[];
  minRating: number;
  priceRange: number[];
  isVeg: boolean;
  sort: string;
}

const defaultFilters: Filters = {
  cuisine: [],
  minRating: 0,
  priceRange: [],
  isVeg: false,
  sort: 'rating',
};

function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const toggleCuisine = (c: string) => {
    onChange({
      ...filters,
      cuisine: filters.cuisine.includes(c)
        ? filters.cuisine.filter(x => x !== c)
        : [...filters.cuisine, c],
    });
  };

  const togglePrice = (p: number) => {
    onChange({
      ...filters,
      priceRange: filters.priceRange.includes(p)
        ? filters.priceRange.filter(x => x !== p)
        : [...filters.priceRange, p],
    });
  };

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal/40 mb-3">Sort by</h3>
        <div className="flex flex-col gap-1">
          {sortOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, sort: value })}
              className={`text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                filters.sort === value
                  ? 'bg-primary text-cream'
                  : 'text-charcoal/60 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal/40 mb-3">Cuisine</h3>
        <div className="flex flex-wrap gap-2">
          {cuisines.map(c => (
            <button
              key={c}
              onClick={() => toggleCuisine(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${
                filters.cuisine.includes(c)
                  ? 'bg-primary border-primary text-cream'
                  : 'border-gold/20 text-charcoal/60 hover:border-gold/40 hover:text-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal/40 mb-3">Price range</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => togglePrice(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-body border transition-colors ${
                filters.priceRange.includes(p)
                  ? 'bg-primary border-primary text-cream'
                  : 'border-gold/20 text-charcoal/60 hover:border-gold/40'
              }`}
            >
              {'₹'.repeat(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-charcoal/40 mb-3">
          Minimum rating: {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
        </h3>
        <input
          type="range"
          min={0}
          max={4.5}
          step={0.5}
          value={filters.minRating}
          onChange={e => onChange({ ...filters, minRating: parseFloat(e.target.value) })}
          className="w-full accent-gold"
        />
        <div className="flex justify-between text-xs text-charcoal/40 font-body mt-1">
          <span>Any</span><span>4.5+</span>
        </div>
      </div>

      {/* Veg only */}
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-charcoal/70">Veg only</span>
        <button
          onClick={() => onChange({ ...filters, isVeg: !filters.isVeg })}
          className={`w-11 h-6 rounded-full transition-colors relative ${filters.isVeg ? 'bg-green-500' : 'bg-charcoal/20'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${filters.isVeg ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
}

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 400);

  const activeFilterCount = filters.cuisine.length + filters.priceRange.length
    + (filters.minRating > 0 ? 1 : 0) + (filters.isVeg ? 1 : 0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['restaurants', debouncedSearch, filters],
    queryFn: ({ pageParam }) =>
      api.get<PaginatedResponse<Restaurant>>('/restaurants', {
        params: {
          page: pageParam,
          limit: 12,
          search: debouncedSearch || undefined,
          cuisine: filters.cuisine.join(',') || undefined,
          minRating: filters.minRating || undefined,
          priceRange: filters.priceRange.join(',') || undefined,
          isVeg: filters.isVeg || undefined,
          sort: filters.sort,
        },
      }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: last =>
      last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
  });

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection]);

  useEffect(() => {
    if (debouncedSearch) setSearchParams({ q: debouncedSearch });
    else setSearchParams({});
  }, [debouncedSearch, setSearchParams]);

  const restaurants = data?.pages.flatMap(p => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total;

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <motion.div {...pageVariants}>
      <PageLayout>
        {/* Header */}
        <div className="bg-primary py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.p variants={fadeUp} className="font-body text-gold/70 text-xs uppercase tracking-widest mb-3">
                Find your next meal
              </motion.p>
              <motion.h1 variants={fadeUp} className="font-heading text-4xl md:text-5xl text-cream mb-6">
                Explore Restaurants
              </motion.h1>
              <motion.div variants={fadeUp} className="relative max-w-xl">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search cuisine, restaurant, or dish…"
                  className="w-full pl-11 pr-4 py-3.5 bg-cream/10 border border-cream/10 text-cream placeholder:text-cream/30 rounded-xl font-body text-sm focus:outline-none focus:border-gold/40 focus:bg-cream/15 transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream transition-colors">
                    <X size={15} />
                  </button>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-8">
            {/* Sidebar filters (desktop) */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter size={15} className="text-primary/60" />
                    <span className="font-body font-semibold text-sm text-primary">Filters</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="gold" size="sm">{activeFilterCount}</Badge>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="font-body text-xs text-copper hover:text-copper-dark transition-colors">Reset</button>
                  )}
                </div>
                <FilterPanel filters={filters} onChange={setFilters} />
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1 min-w-0">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6 gap-3">
                <p className="font-body text-sm text-charcoal/50">
                  {isLoading ? 'Loading…' : total !== undefined ? `${total} restaurants` : ''}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawerOpen(true)}
                  icon={<SlidersHorizontal size={14} />}
                  className="lg:hidden"
                >
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </div>

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {filters.cuisine.map(c => (
                    <button key={c} onClick={() => setFilters(f => ({ ...f, cuisine: f.cuisine.filter(x => x !== c) }))}
                      className="flex items-center gap-1.5 px-3 py-1 bg-primary/8 text-primary text-xs font-body rounded-full border border-primary/15 hover:bg-primary/15 transition-colors">
                      {c} <X size={10} />
                    </button>
                  ))}
                  {filters.isVeg && (
                    <button onClick={() => setFilters(f => ({ ...f, isVeg: false }))}
                      className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-body rounded-full border border-green-200">
                      Veg only <X size={10} />
                    </button>
                  )}
                </div>
              )}

              {/* Grid */}
              {isLoading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-20">
                  <UtensilsCrossedIcon />
                  <p className="font-heading text-2xl text-primary/40 mb-2">No restaurants found</p>
                  <p className="font-body text-sm text-charcoal/40">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {restaurants.map(r => (
                    <motion.div key={r._id} variants={fadeUp}>
                      <RestaurantCard restaurant={r} />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Load more sentinel */}
              <div ref={loadMoreRef} className="h-8 mt-8 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gold"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile filter drawer */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filter Restaurants"
          footer={
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => { resetFilters(); setDrawerOpen(false); }}>Reset</Button>
              <Button fullWidth onClick={() => setDrawerOpen(false)}>Apply filters</Button>
            </div>
          }
        >
          <FilterPanel filters={filters} onChange={setFilters} />
        </Drawer>
      </PageLayout>
    </motion.div>
  );
}

function UtensilsCrossedIcon() {
  return (
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/5 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary/30" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m6 2v4l3-3m0 0l-3-3m3 3H9" />
      </svg>
    </div>
  );
}
