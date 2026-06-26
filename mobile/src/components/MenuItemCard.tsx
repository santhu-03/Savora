import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, SHADOW } from '../lib/colors';
import { useCartStore } from '../store/cart.store';
import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
}

export function MenuItemCard({ item, restaurantId, restaurantName }: Props) {
  const { items, addItem, updateQty } = useCartStore();
  const cartEntry = items.find(i => i.id === item.id);
  const qty = cartEntry?.quantity ?? 0;

  const handleAdd = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(item, restaurantId, restaurantName);
  };

  const handleInc = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQty(item.id, 1);
  };

  const handleDec = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQty(item.id, -1);
  };

  return (
    <View style={[S.card, SHADOW.sm]}>
      <View style={S.left}>
        <View style={S.badges}>
          <View style={[S.vegDot, item.isVeg ? S.vegGreen : S.vegRed]} />
          {item.isBestSeller && (
            <View style={S.bestBadge}>
              <Text style={S.bestText}>Best Seller</Text>
            </View>
          )}
        </View>
        <Text style={S.name}>{item.name}</Text>
        <Text style={S.desc} numberOfLines={2}>{item.description}</Text>
        <View style={S.footer}>
          <Text style={S.price}>₹{item.price.toLocaleString('en-IN')}</Text>
          {item.calories && (
            <Text style={S.cals}>{item.calories} kcal</Text>
          )}
        </View>
      </View>

      <View style={S.right}>
        <Image source={{ uri: item.image }} style={S.image} />
        {qty === 0 ? (
          <TouchableOpacity style={S.addBtn} onPress={handleAdd} activeOpacity={0.8}>
            <Text style={S.addText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={S.stepper}>
            <TouchableOpacity style={S.stepBtn} onPress={handleDec}>
              <Text style={S.stepIcon}>−</Text>
            </TouchableOpacity>
            <Text style={S.qty}>{qty}</Text>
            <TouchableOpacity style={S.stepBtn} onPress={handleInc}>
              <Text style={S.stepIcon}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 12, marginBottom: 8, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  left: { flex: 1, paddingRight: 12 },
  right: { width: 100, alignItems: 'center' },

  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  vegDot:  { width: 12, height: 12, borderRadius: 2, borderWidth: 1.5 },
  vegGreen: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  vegRed:   { backgroundColor: '#dc2626', borderColor: '#dc2626' },

  bestBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  bestText: { fontSize: 10, color: '#b45309', fontWeight: '600' },

  name:   { fontSize: 15, fontWeight: '700', color: C.charcoal, letterSpacing: -0.2 },
  desc:   { fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  price:  { fontSize: 15, fontWeight: '700', color: C.charcoal },
  cals:   { fontSize: 11, color: C.subtle },

  image: {
    width: 90, height: 80, borderRadius: 10, resizeMode: 'cover', marginBottom: 8,
  },
  addBtn: {
    width: 70, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.gold, alignItems: 'center',
  },
  addText: { color: C.gold, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.gold, borderRadius: 8, overflow: 'hidden',
  },
  stepBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  stepIcon:{ color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 20 },
  qty:     { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },
});
