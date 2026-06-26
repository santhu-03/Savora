import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, FlatList, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { RestaurantCard } from '../../src/components/RestaurantCard';
import { useAuthStore } from '../../src/store/auth.store';
import { RESTAURANTS, PROMOTIONS, MOCK_ORDERS } from '../../src/lib/mock-data';

const { width: W } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function PromoCarousel() {
  const scrollX  = useRef(new Animated.Value(0)).current;
  const flatRef  = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const router   = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % PROMOTIONS.length;
      flatRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <View>
      <Animated.FlatList
        ref={flatRef as any}
        data={PROMOTIONS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[S.promoCard, { backgroundColor: item.bgColor }]}
            onPress={() => router.push(`/restaurant/${item.restaurantSlug}`)}
          >
            <Image source={{ uri: item.image }} style={S.promoBg} />
            <View style={S.promoOverlay} />
            <View style={S.promoContent}>
              <View style={S.promoDiscountBadge}>
                <Text style={S.promoDiscount}>{item.discount}</Text>
              </View>
              <Text style={S.promoTitle}>{item.title}</Text>
              <Text style={S.promoSub}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      {/* Dot indicators */}
      <View style={S.dotsRow}>
        {PROMOTIONS.map((_, i) => {
          const inputRange = [(i - 1) * W - 48, i * W - 48, (i + 1) * W - 48];
          const width = scrollX.interpolate({ inputRange, outputRange: [6, 18, 6], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
          return <Animated.View key={i} style={[S.dot, { width, opacity }]} />;
        })}
      </View>
    </View>
  );
}

function ActiveOrderBanner() {
  const router  = useRouter();
  const active  = MOCK_ORDERS.find(o => o.status === 'preparing' || o.status === 'confirmed');
  if (!active) return null;

  return (
    <TouchableOpacity
      style={[S.activeBanner, SHADOW.sm]}
      activeOpacity={0.9}
      onPress={() => router.push(`/order-tracking/${active.id}`)}
    >
      <View style={S.activePulse} />
      <View style={S.activeInfo}>
        <Text style={S.activeName}>{active.restaurantName}</Text>
        <Text style={S.activeStatus}>
          {active.status === 'preparing' ? '🍳 Your order is being prepared' : '✅ Order confirmed'}
          {active.estimatedTime ? ` · ${active.estimatedTime}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.gold} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();
  const favorites = RESTAURANTS.filter(r => r.isFavorite);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Topbar */}
        <View style={S.topbar}>
          <View>
            <Text style={S.greeting}>{getGreeting()}</Text>
            <Text style={S.userName}>{user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
          </View>
          <View style={S.topbarActions}>
            <TouchableOpacity style={S.iconBtn} onPress={() => {}}>
              <Ionicons name="notifications-outline" size={22} color={C.charcoal} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <View style={S.avatar}>
                <Text style={S.avatarText}>
                  {user?.name?.split(' ').map(p => p[0]).join('').slice(0, 2) ?? 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar (tap navigates to explore) */}
        <TouchableOpacity
          style={[S.searchBar, SHADOW.sm]}
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="search" size={18} color={C.subtle} />
          <Text style={S.searchPlaceholder}>Search restaurants, dishes…</Text>
        </TouchableOpacity>

        {/* Active order banner */}
        <ActiveOrderBanner />

        {/* Featured promotions */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Featured Offers</Text>
        </View>
        <PromoCarousel />

        {/* Nearby */}
        <View style={[S.section, { marginTop: 24 }]}>
          <Text style={S.sectionTitle}>Nearby Restaurants</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={S.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.hscroll} contentContainerStyle={{ paddingLeft: 20 }}>
          {RESTAURANTS.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
        </ScrollView>

        {/* Favourites */}
        {favorites.length > 0 && (
          <>
            <View style={[S.section, { marginTop: 24 }]}>
              <Text style={S.sectionTitle}>Your Favourites</Text>
            </View>
            {favorites.map(r => (
              <View key={r.id} style={S.favRow}>
                <RestaurantCard restaurant={r} horizontal />
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  greeting: { fontSize: 13, color: C.muted },
  userName: { fontSize: 22, fontWeight: '700', color: C.charcoal, letterSpacing: -0.5 },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 20, marginBottom: 16,
    paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 1, borderColor: C.border,
  },
  searchPlaceholder: { color: C.subtle, fontSize: 14 },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: 'rgba(191,139,94,0.08)',
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.2)',
    borderRadius: 14, padding: 14, gap: 10,
  },
  activePulse: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.success,
  },
  activeInfo: { flex: 1 },
  activeName: { fontSize: 14, fontWeight: '600', color: C.charcoal },
  activeStatus:{ fontSize: 12, color: C.muted, marginTop: 2 },

  section: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.charcoal, letterSpacing: -0.3 },
  seeAll:       { fontSize: 13, color: C.gold, fontWeight: '600' },

  hscroll: { paddingBottom: 8 },

  promoCard: {
    width: W - 48,
    marginHorizontal: 24,
    height: 160, borderRadius: 20, overflow: 'hidden',
  },
  promoBg:     { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  promoOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  promoContent:{ flex: 1, padding: 20, justifyContent: 'flex-end' },
  promoDiscountBadge: {
    alignSelf: 'flex-start', backgroundColor: C.gold,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
  },
  promoDiscount:{ color: '#fff', fontSize: 11, fontWeight: '700' },
  promoTitle:   { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  promoSub:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 10, marginBottom: 4 },
  dot: { height: 6, borderRadius: 3, backgroundColor: C.gold },

  favRow: { paddingHorizontal: 20 },
});
