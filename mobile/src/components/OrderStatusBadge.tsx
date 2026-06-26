import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Order } from '../types';

const CONFIG: Record<Order['status'], { label: string; bg: string; text: string; dot: string }> = {
  pending:          { label: 'Pending',         bg: 'rgba(245,158,11,0.1)',  text: '#b45309', dot: '#f59e0b' },
  confirmed:        { label: 'Confirmed',        bg: 'rgba(59,130,246,0.1)',  text: '#1d4ed8', dot: '#3b82f6' },
  preparing:        { label: 'Preparing',        bg: 'rgba(234,88,12,0.1)',   text: '#c2410c', dot: '#ea580c' },
  ready:            { label: 'Ready',            bg: 'rgba(22,163,74,0.1)',   text: '#15803d', dot: '#16a34a' },
  out_for_delivery: { label: 'On the Way',       bg: 'rgba(99,102,241,0.1)',  text: '#4338ca', dot: '#6366f1' },
  delivered:        { label: 'Delivered',        bg: 'rgba(16,185,129,0.1)',  text: '#047857', dot: '#10b981' },
  cancelled:        { label: 'Cancelled',        bg: 'rgba(239,68,68,0.1)',   text: '#b91c1c', dot: '#ef4444' },
};

export function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const cfg = CONFIG[status];
  return (
    <View style={[S.badge, { backgroundColor: cfg.bg }]}>
      <View style={[S.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[S.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '600' },
});
