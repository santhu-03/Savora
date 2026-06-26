import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { MOCK_RESERVATIONS } from '../../src/lib/mock-data';

const STATUS_CFG = {
  pending:   { label: 'Pending Confirmation', bg: '#fef3c7', text: '#92400e', icon: 'time-outline' },
  confirmed: { label: 'Confirmed',            bg: '#d1fae5', text: '#065f46', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelled',            bg: '#fee2e2', text: '#991b1b', icon: 'close-circle' },
  completed: { label: 'Completed',            bg: '#d1fae5', text: '#065f46', icon: 'checkmark-done-circle' },
};

export default function ReservationDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const res      = MOCK_RESERVATIONS.find(r => r.id === id) ?? MOCK_RESERVATIONS[0];
  const cfg      = STATUS_CFG[res.status];

  const date     = new Date(`${res.date}T00:00:00`);
  const dateStr  = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleCancel = () => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel Reservation', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  return (
    <View style={S.root}>
      <SafeAreaView edges={['top']} style={S.header}>
        <View style={S.headerInner}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.charcoal} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Reservation</Text>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="share-outline" size={22} color={C.charcoal} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant hero */}
        <Image source={{ uri: res.restaurantImage }} style={S.heroImage} />

        {/* Status banner */}
        <View style={[S.statusBanner, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={18} color={cfg.text} />
          <Text style={[S.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>

        {/* Main info */}
        <View style={S.mainCard}>
          <Text style={S.restoName}>{res.restaurantName}</Text>
          <Text style={S.resId}>Ref: {res.id}</Text>

          <View style={S.divider} />

          {/* Details grid */}
          <View style={S.detailsGrid}>
            {[
              { icon: 'calendar',    label: 'Date',   value: dateStr },
              { icon: 'time',        label: 'Time',   value: res.time },
              { icon: 'people',      label: 'Guests', value: `${res.guests} ${res.guests === 1 ? 'Guest' : 'Guests'}` },
              { icon: 'grid',        label: 'Table',  value: res.tableNumber ? `Table ${res.tableNumber}` : 'To be assigned' },
            ].map(d => (
              <View key={d.label} style={S.detailItem}>
                <View style={S.detailIcon}>
                  <Ionicons name={d.icon as any} size={16} color={C.gold} />
                </View>
                <View>
                  <Text style={S.detailLabel}>{d.label}</Text>
                  <Text style={S.detailValue}>{d.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Occasion */}
          {res.occasion && (
            <>
              <View style={S.divider} />
              <View style={S.occasionRow}>
                <Text style={S.occasionEmoji}>🎉</Text>
                <View>
                  <Text style={S.occasionLabel}>Occasion</Text>
                  <Text style={S.occasionValue}>{res.occasion}</Text>
                </View>
              </View>
            </>
          )}

          {/* Special requests */}
          {res.specialRequest && (
            <>
              <View style={S.divider} />
              <View style={S.reqWrap}>
                <Text style={S.reqLabel}>Special Requests</Text>
                <Text style={S.reqText}>{res.specialRequest}</Text>
              </View>
            </>
          )}
        </View>

        {/* What to expect */}
        <View style={[S.expectCard, SHADOW.sm]}>
          <Text style={S.expectTitle}>What to Expect</Text>
          {[
            { icon: '🎩', text: 'Smart casual dress code. Business casual or above preferred.' },
            { icon: '🕐', text: 'We hold tables for 15 minutes past reservation time.' },
            { icon: '📱', text: 'Show this confirmation at the host desk upon arrival.' },
          ].map(item => (
            <View key={item.text} style={S.expectItem}>
              <Text style={S.expectEmoji}>{item.icon}</Text>
              <Text style={S.expectText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA buttons */}
        {res.status !== 'cancelled' && res.status !== 'completed' && (
          <View style={S.actions}>
            <TouchableOpacity style={[S.modifyBtn, SHADOW.sm]} onPress={() => {}}>
              <Ionicons name="create-outline" size={18} color={C.gold} />
              <Text style={S.modifyBtnText}>Modify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.cancelBtn, SHADOW.sm]} onPress={handleCancel}>
              <Ionicons name="close-outline" size={18} color="#ef4444" />
              <Text style={S.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Directions */}
        <TouchableOpacity style={[S.directionsBtn, SHADOW.sm]} onPress={() => {}}>
          <Ionicons name="navigate-outline" size={20} color={C.gold} />
          <Text style={S.directionsBtnText}>Get Directions</Text>
          <Ionicons name="chevron-forward" size={16} color={C.subtle} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.charcoal },

  scroll:    { flex: 1 },
  heroImage: { width: '100%', height: 200, resizeMode: 'cover' },

  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  statusText:   { fontSize: 14, fontWeight: '600' },

  mainCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 0, borderRadius: 20, padding: 20, marginBottom: 12, ...SHADOW.sm },
  restoName:{ fontSize: 22, fontWeight: '700', color: C.charcoal, letterSpacing: -0.5 },
  resId:    { fontSize: 12, color: C.muted, marginTop: 2 },
  divider:  { height: 1, backgroundColor: C.border, marginVertical: 16 },

  detailsGrid: { gap: 14 },
  detailItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailIcon:  { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(191,139,94,0.1)', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 11, color: C.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontWeight: '600', color: C.charcoal, marginTop: 1 },

  occasionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  occasionEmoji: { fontSize: 28 },
  occasionLabel: { fontSize: 11, color: C.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  occasionValue: { fontSize: 15, fontWeight: '600', color: C.charcoal, marginTop: 1 },

  reqWrap:  {},
  reqLabel: { fontSize: 12, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  reqText:  { fontSize: 14, color: C.charcoal, lineHeight: 22 },

  expectCard:  { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 12 },
  expectTitle: { fontSize: 15, fontWeight: '700', color: C.charcoal, marginBottom: 14 },
  expectItem:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  expectEmoji: { fontSize: 18, marginTop: 1 },
  expectText:  { fontSize: 13, color: C.muted, lineHeight: 20, flex: 1 },

  actions:     { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  modifyBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: 'rgba(191,139,94,0.25)' },
  modifyBtnText: { fontSize: 14, color: C.gold, fontWeight: '600' },
  cancelBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.2)' },
  cancelBtnText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },

  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  directionsBtnText: { flex: 1, fontSize: 14, color: C.charcoal, fontWeight: '600' },
});
