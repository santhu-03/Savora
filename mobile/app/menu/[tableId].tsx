import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { MenuItemCard } from '../../src/components/MenuItemCard';
import { RESTAURANTS, MENU_ITEMS, MENU_CATEGORIES } from '../../src/lib/mock-data';
import { useCartStore } from '../../src/store/cart.store';

export default function TableMenuScreen() {
  const { tableId } = useLocalSearchParams<{ tableId: string }>();
  const router      = useRouter();
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].id);

  // Always use Savora Bandra for the table menu
  const restaurant = RESTAURANTS[0];
  const cartCount  = useCartStore(s => s.itemCount());
  const cartTotal  = useCartStore(s => s.subtotal());
  const setTableId = useCartStore(s => s.setTableId);

  // Set the table ID in cart
  React.useEffect(() => {
    if (tableId) setTableId(tableId);
  }, [tableId]);

  const itemsByCategory = MENU_CATEGORIES.map(cat => ({
    ...cat,
    items: MENU_ITEMS.filter(i => i.category === cat.id),
  })).filter(c => c.items.length > 0);

  return (
    <View style={S.root}>
      <StatusBar style="dark" />

      {/* Table banner */}
      <SafeAreaView edges={['top']} style={S.bannerWrap}>
        <View style={S.banner}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.cream} />
          </TouchableOpacity>
          <View style={S.bannerCenter}>
            <Text style={S.bannerRestaurant}>{restaurant.name}</Text>
            <View style={S.tablePill}>
              <Ionicons name="qr-code-outline" size={12} color={C.gold} />
              <Text style={S.tableText}>Table {tableId}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={S.callBtn}
            onPress={() => router.push(`/(tabs)/scan`)}
          >
            <Ionicons name="scan" size={20} color={C.gold} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Category tabs */}
      <View style={S.catBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.catContent}>
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

      {/* Menu */}
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        {itemsByCategory.map(cat => (
          <View key={cat.id} style={S.section}>
            <Text style={S.sectionTitle}>{cat.emoji} {cat.name}</Text>
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
      </ScrollView>

      {/* Cart CTA */}
      {cartCount > 0 && (
        <View style={S.cartWrap}>
          <TouchableOpacity
            style={[S.cartBtn, SHADOW.lg]}
            activeOpacity={0.9}
            onPress={() => router.push('/cart')}
          >
            <View style={S.cartBadge}>
              <Text style={S.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={S.cartBtnLabel}>View Cart · Table {tableId}</Text>
            <Text style={S.cartBtnPrice}>₹{cartTotal.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.cream },

  bannerWrap: { backgroundColor: C.primary },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  bannerCenter: { flex: 1, alignItems: 'center' },
  bannerRestaurant: { fontSize: 15, fontWeight: '700', color: C.cream },
  tablePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(191,139,94,0.2)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 2,
  },
  tableText: { fontSize: 11, color: C.gold, fontWeight: '600' },
  callBtn:   { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(191,139,94,0.15)', alignItems: 'center', justifyContent: 'center' },

  catBar:    { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  catContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catChip:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: C.border },
  catChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  catText:   { fontSize: 13, color: C.muted, fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: '600' },

  scroll:   { flex: 1 },
  section:  { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.charcoal, marginBottom: 10, letterSpacing: -0.3 },

  cartWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28, backgroundColor: 'transparent' },
  cartBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.primary, borderRadius: 18, padding: 16,
  },
  cartBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cartBtnLabel:  { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  cartBtnPrice:  { color: C.gold, fontSize: 16, fontWeight: '700' },
});
