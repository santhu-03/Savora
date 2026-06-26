import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Animated, Dimensions, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { MenuItemCard } from '../../src/components/MenuItemCard';
import { RESTAURANTS, MENU_ITEMS, MENU_CATEGORIES } from '../../src/lib/mock-data';
import { useCartStore } from '../../src/store/cart.store';

const { width: W, height: H } = Dimensions.get('window');
const HEADER_H = 280;
const STICKY_H = 96;

export default function RestaurantScreen() {
  const { slug }   = useLocalSearchParams<{ slug: string }>();
  const router     = useRouter();
  const scrollY    = useRef(new Animated.Value(0)).current;
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].id);
  const catScrollRef = useRef<ScrollView>(null);

  const restaurant = RESTAURANTS.find(r => r.slug === slug) ?? RESTAURANTS[0];
  const cartCount  = useCartStore(s => s.itemCount());
  const cartTotal  = useCartStore(s => s.subtotal());

  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_H - 60, HEADER_H],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const imageScale = scrollY.interpolate({
    inputRange: [-60, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const itemsByCategory = useMemo(() =>
    MENU_CATEGORIES.map(cat => ({
      ...cat,
      items: MENU_ITEMS.filter(item => item.category === cat.id),
    })).filter(c => c.items.length > 0),
  []);

  return (
    <View style={S.root}>
      <StatusBar style="light" />

      {/* Parallax header image */}
      <Animated.View style={[S.headerImage, { transform: [{ scale: imageScale }] }]}>
        <Image source={{ uri: restaurant.coverImage }} style={StyleSheet.absoluteFill} />
        <View style={S.imageOverlay} />
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        style={S.scroll}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header spacer */}
        <View style={{ height: HEADER_H - 32 }} />

        {/* Restaurant info card + sticky categories */}
        <View style={S.infoCard}>
          <View style={S.infoTop}>
            <View style={{ flex: 1 }}>
              <Text style={S.restoName}>{restaurant.name}</Text>
              <Text style={S.restoCuisine}>{restaurant.cuisine}</Text>
              <View style={S.ratingRow}>
                <Text style={S.star}>★</Text>
                <Text style={S.ratingNum}>{restaurant.rating}</Text>
                <Text style={S.ratingCount}>({restaurant.reviewCount} reviews)</Text>
                <Text style={S.metaDot}>·</Text>
                <Text style={S.metaText}>{restaurant.priceRange}</Text>
                <Text style={S.metaDot}>·</Text>
                <Text style={S.metaText}>{restaurant.distance}</Text>
              </View>
              <View style={S.tagsRow}>
                {restaurant.tags.map(tag => (
                  <View key={tag} style={S.tag}><Text style={S.tagText}>{tag}</Text></View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={S.favBtn} onPress={() => {}}>
              <Ionicons name={restaurant.isFavorite ? 'heart' : 'heart-outline'} size={20} color={C.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category tabs (sticky) */}
        <View style={S.categoryWrap}>
          <ScrollView
            ref={catScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.categoryContent}
          >
            {itemsByCategory.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[S.catChip, activeCategory === cat.id && S.catChipActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[S.catText, activeCategory === cat.id && S.catTextActive]}>
                  {cat.emoji} {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Menu items by category */}
        {itemsByCategory.map(cat => (
          <View key={cat.id} style={S.categorySection}>
            <Text style={S.catHeader}>{cat.emoji} {cat.name}</Text>
            {cat.items.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
              />
            ))}
          </View>
        ))}

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Sticky top nav (becomes opaque on scroll) */}
      <Animated.View style={[S.navBar, { backgroundColor: headerOpacity.interpolate({ inputRange: [0, 1], outputRange: ['transparent', '#fff'] }) }]}>
        <SafeAreaView edges={['top']}>
          <View style={S.navInner}>
            <TouchableOpacity style={S.navBackBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={C.charcoal} />
            </TouchableOpacity>
            <Animated.Text style={[S.navTitle, { opacity: headerOpacity }]}>
              {restaurant.name}
            </Animated.Text>
            <TouchableOpacity style={S.navShareBtn} onPress={() => {}}>
              <Ionicons name="share-outline" size={20} color={C.charcoal} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[S.cartBtn, SHADOW.lg]}
          activeOpacity={0.9}
          onPress={() => router.push('/cart')}
        >
          <View style={S.cartBadge}>
            <Text style={S.cartBadgeText}>{cartCount}</Text>
          </View>
          <Text style={S.cartBtnText}>View Cart</Text>
          <Text style={S.cartBtnPrice}>₹{cartTotal.toLocaleString('en-IN')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.cream },

  headerImage: {
    position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H,
    overflow: 'hidden',
  },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },

  scroll: { flex: 1 },

  infoCard: {
    backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 0,
  },
  infoTop:    { flexDirection: 'row', gap: 12 },
  restoName:  { fontSize: 24, fontWeight: '700', color: C.charcoal, letterSpacing: -0.5 },
  restoCuisine:{ fontSize: 14, color: C.muted, marginTop: 2 },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  star:       { color: '#f59e0b', fontSize: 13 },
  ratingNum:  { fontSize: 13, fontWeight: '700', color: C.charcoal },
  ratingCount:{ fontSize: 12, color: C.muted },
  metaDot:    { color: C.subtle },
  metaText:   { fontSize: 12, color: C.muted },
  tagsRow:    { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tag:        { backgroundColor: 'rgba(191,139,94,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tagText:    { fontSize: 11, color: C.goldDark, fontWeight: '500' },
  favBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(191,139,94,0.1)', alignItems: 'center', justifyContent: 'center' },

  categoryWrap: { backgroundColor: C.cream, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  catChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border },
  catChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  catText:     { fontSize: 13, color: C.muted, fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: '600' },

  categorySection: { paddingHorizontal: 20, paddingTop: 20 },
  catHeader:       { fontSize: 18, fontWeight: '700', color: C.charcoal, marginBottom: 12, letterSpacing: -0.3 },

  navBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  navInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navBackBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  navTitle:    { fontSize: 16, fontWeight: '700', color: C.charcoal, flex: 1, textAlign: 'center' },
  navShareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },

  cartBtn: {
    position: 'absolute', bottom: 28, left: 24, right: 24,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.primary, borderRadius: 18, padding: 16,
  },
  cartBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cartBtnText:   { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  cartBtnPrice:  { color: C.gold, fontSize: 16, fontWeight: '700' },
});
