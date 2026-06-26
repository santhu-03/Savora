import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { OrderStatusBadge } from '../../src/components/OrderStatusBadge';
import { MOCK_ORDERS } from '../../src/lib/mock-data';
import type { Order } from '../../src/types';

type Tab = 'active' | 'past';

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const active = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
  const date   = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[S.card, SHADOW.sm]}
      activeOpacity={0.88}
      onPress={() => active
        ? router.push(`/order-tracking/${order.id}`)
        : null
      }
    >
      <View style={S.cardTop}>
        <Image source={{ uri: order.restaurantImage }} style={S.restoImg} />
        <View style={S.cardInfo}>
          <Text style={S.restoName}>{order.restaurantName}</Text>
          <Text style={S.orderMeta}>
            {order.type === 'dine-in' ? `Table ${order.tableNumber}` : order.type}
            {' · '}{date}
          </Text>
          <OrderStatusBadge status={order.status} />
        </View>
        {active && <Ionicons name="chevron-forward" size={16} color={C.subtle} />}
      </View>

      <View style={S.divider} />

      <View style={S.items}>
        {order.items.map((item, i) => (
          <Text key={i} style={S.itemText}>
            {item.qty}× {item.name}
          </Text>
        ))}
      </View>

      <View style={S.cardBottom}>
        <Text style={S.total}>₹{order.total.toLocaleString('en-IN')}</Text>
        {active ? (
          <TouchableOpacity
            style={S.trackBtn}
            onPress={() => router.push(`/order-tracking/${order.id}`)}
          >
            <Text style={S.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={S.reorderBtn} onPress={() => {}}>
            <Text style={S.reorderBtnText}>Reorder</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const [tab, setTab] = useState<Tab>('active');
  const active = MOCK_ORDERS.filter(o =>
    ['pending','confirmed','preparing','ready','out_for_delivery'].includes(o.status)
  );
  const past = MOCK_ORDERS.filter(o =>
    ['delivered','cancelled'].includes(o.status)
  );
  const shown = tab === 'active' ? active : past;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.title}>My Orders</Text>
      </View>

      {/* Tabs */}
      <View style={S.tabs}>
        {(['active', 'past'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[S.tabBtn, tab === t && S.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[S.tabText, tab === t && S.tabTextActive]}>
              {t === 'active' ? `Active (${active.length})` : `Past (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {shown.length === 0 ? (
        <View style={S.empty}>
          <Text style={S.emptyEmoji}>{tab === 'active' ? '🍽️' : '📋'}</Text>
          <Text style={S.emptyTitle}>No {tab} orders</Text>
          <Text style={S.emptyDesc}>
            {tab === 'active'
              ? 'Your active orders will appear here'
              : 'Your order history will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={o => o.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title:  { fontSize: 28, fontWeight: '700', color: C.charcoal, letterSpacing: -0.5 },

  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 4,
  },
  tabBtn:       { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff', ...SHADOW.sm },
  tabText:      { fontSize: 13, color: C.muted, fontWeight: '500' },
  tabTextActive:{ color: C.charcoal, fontWeight: '700' },

  list: { padding: 20, gap: 12, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  restoImg:  { width: 52, height: 52, borderRadius: 10, resizeMode: 'cover' },
  cardInfo:  { flex: 1, gap: 3 },
  restoName: { fontSize: 15, fontWeight: '700', color: C.charcoal },
  orderMeta: { fontSize: 12, color: C.muted },
  divider:   { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  items:     { paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  itemText:  { fontSize: 13, color: C.muted },
  cardBottom:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  total:     { fontSize: 17, fontWeight: '700', color: C.charcoal },
  trackBtn:  { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  trackBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  reorderBtn:   { borderWidth: 1.5, borderColor: C.gold, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7 },
  reorderBtnText:{ color: C.gold, fontSize: 13, fontWeight: '600' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.charcoal, marginBottom: 6 },
  emptyDesc:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
});
