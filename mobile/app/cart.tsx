import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, SHADOW } from '../src/lib/colors';
import { useCartStore } from '../src/store/cart.store';

type OrderType = 'dine-in' | 'takeaway' | 'delivery';

const TYPE_OPTS: { key: OrderType; label: string; icon: string }[] = [
  { key: 'dine-in',   label: 'Dine In',   icon: 'restaurant-outline' },
  { key: 'takeaway',  label: 'Takeaway',   icon: 'bag-handle-outline' },
  { key: 'delivery',  label: 'Delivery',   icon: 'bicycle-outline'    },
];

export default function CartScreen() {
  const router      = useRouter();
  const {
    items, orderType, notes, restaurantName,
    updateQty, clearCart, setOrderType, setNotes,
    subtotal, tax, serviceCharge, total,
  } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView style={S.safe} edges={['top', 'bottom']}>
        <View style={S.emptyWrap}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.charcoal} />
          </TouchableOpacity>
          <View style={S.empty}>
            <Text style={S.emptyEmoji}>🛒</Text>
            <Text style={S.emptyTitle}>Your cart is empty</Text>
            <Text style={S.emptyDesc}>Add items from a restaurant menu to get started</Text>
            <TouchableOpacity style={S.browsBtn} onPress={() => router.push('/(tabs)/explore')}>
              <Text style={S.browsBtnText}>Browse Restaurants</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={S.root}>
      <SafeAreaView edges={['top']} style={S.header}>
        <View style={S.headerInner}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.charcoal} />
          </TouchableOpacity>
          <View>
            <Text style={S.headerTitle}>Your Order</Text>
            {restaurantName && <Text style={S.headerRestaurant}>{restaurantName}</Text>}
          </View>
          <TouchableOpacity onPress={() => { clearCart(); router.back(); }}>
            <Text style={S.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Order type toggle */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Order Type</Text>
          <View style={S.typeRow}>
            {TYPE_OPTS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[S.typeBtn, orderType === t.key && S.typeBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setOrderType(t.key);
                }}
              >
                <Ionicons name={t.icon as any} size={16} color={orderType === t.key ? '#fff' : C.muted} />
                <Text style={[S.typeText, orderType === t.key && S.typeTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Items ({items.reduce((s, i) => s + i.quantity, 0)})</Text>
          <View style={[S.itemsCard, SHADOW.sm]}>
            {items.map((item, idx) => (
              <View key={item.id} style={[S.cartItem, idx < items.length - 1 && S.cartItemBorder]}>
                <View style={S.cartItemLeft}>
                  <View style={[S.vegDot, item.isVeg ? S.vegGreen : S.vegRed]} />
                  <View style={S.cartItemInfo}>
                    <Text style={S.cartItemName}>{item.name}</Text>
                    <Text style={S.cartItemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                <View style={S.stepper}>
                  <TouchableOpacity
                    style={S.stepBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateQty(item.id, -1);
                    }}
                  >
                    <Text style={S.stepIcon}>{item.quantity === 1 ? '🗑' : '−'}</Text>
                  </TouchableOpacity>
                  <Text style={S.qty}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={S.stepBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateQty(item.id, 1);
                    }}
                  >
                    <Text style={S.stepIcon}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Special Instructions</Text>
          <TextInput
            style={S.notesInput}
            placeholder="Allergy info, cooking preferences…"
            placeholderTextColor={C.subtle}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Bill summary */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Bill Summary</Text>
          <View style={[S.billCard, SHADOW.sm]}>
            {[
              { label: 'Subtotal',       value: subtotal() },
              { label: 'GST (5%)',       value: tax() },
              { label: 'Service (10%)',  value: serviceCharge() },
            ].map(row => (
              <View key={row.label} style={S.billRow}>
                <Text style={S.billLabel}>{row.label}</Text>
                <Text style={S.billValue}>₹{row.value.toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={S.billDivider} />
            <View style={S.billRow}>
              <Text style={S.billTotalLabel}>Total</Text>
              <Text style={S.billTotal}>₹{total().toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout CTA */}
      <SafeAreaView edges={['bottom']} style={S.footer}>
        <TouchableOpacity
          style={[S.checkoutBtn, SHADOW.lg]}
          activeOpacity={0.9}
          onPress={() => router.push('/checkout')}
        >
          <Text style={S.checkoutBtnText}>Proceed to Payment</Text>
          <Text style={S.checkoutBtnPrice}>₹{total().toLocaleString('en-IN')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.cream },
  safe:   { flex: 1, backgroundColor: C.cream },

  header:       { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  headerInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: C.charcoal, textAlign: 'center' },
  headerRestaurant: { fontSize: 12, color: C.muted, textAlign: 'center' },
  clearText:    { fontSize: 14, color: '#ef4444', fontWeight: '600' },

  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff',
  },
  typeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  typeText:      { fontSize: 12, color: C.muted, fontWeight: '500' },
  typeTextActive:{ color: '#fff', fontWeight: '600' },

  itemsCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  cartItem:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  cartItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  cartItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  vegDot:   { width: 10, height: 10, borderRadius: 2, borderWidth: 1.5 },
  vegGreen: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  vegRed:   { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: C.charcoal },
  cartItemPrice:{ fontSize: 13, color: C.muted, marginTop: 1 },

  stepper:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gold, borderRadius: 8, overflow: 'hidden' },
  stepBtn:  { paddingHorizontal: 10, paddingVertical: 7 },
  stepIcon: { color: '#fff', fontSize: 14, lineHeight: 18 },
  qty:      { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  notesInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    padding: 13, fontSize: 14, color: C.charcoal,
    minHeight: 80, textAlignVertical: 'top', backgroundColor: '#fff',
  },

  billCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  billRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: C.muted },
  billValue: { fontSize: 14, color: C.charcoal, fontWeight: '500' },
  billDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  billTotalLabel: { fontSize: 16, fontWeight: '700', color: C.charcoal },
  billTotal:      { fontSize: 18, fontWeight: '700', color: C.charcoal },

  footer:      { backgroundColor: C.cream, paddingHorizontal: 20, paddingTop: 12 },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.primary, borderRadius: 18, paddingHorizontal: 24, paddingVertical: 16,
  },
  checkoutBtnText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  checkoutBtnPrice: { color: C.gold, fontSize: 18, fontWeight: '700' },

  emptyWrap: { flex: 1 },
  backBtn:   { padding: 20 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji:{ fontSize: 56, marginBottom: 16 },
  emptyTitle:{ fontSize: 22, fontWeight: '700', color: C.charcoal, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  browsBtn:  { marginTop: 24, backgroundColor: C.gold, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  browsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
