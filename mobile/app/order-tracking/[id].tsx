import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { MOCK_ORDERS } from '../../src/lib/mock-data';
import type { Order } from '../../src/types';

const { width: W } = Dimensions.get('window');

type Status = Order['status'];

const STEPS: { status: Status; label: string; icon: string; desc: string }[] = [
  { status: 'pending',          label: 'Order Placed',    icon: 'receipt',          desc: 'Your order has been received' },
  { status: 'confirmed',        label: 'Confirmed',       icon: 'checkmark-circle', desc: 'Restaurant accepted your order' },
  { status: 'preparing',        label: 'Preparing',       icon: 'restaurant',       desc: 'Chef is preparing your meal' },
  { status: 'ready',            label: 'Ready',           icon: 'bag-check',        desc: 'Your order is ready!' },
  { status: 'out_for_delivery', label: 'On the Way',      icon: 'bicycle',          desc: 'Rider is heading your way' },
  { status: 'delivered',        label: 'Delivered',       icon: 'home',             desc: 'Enjoy your meal!' },
];

const ORDER_FLOW: Status[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

function usePulse() {
  const anim = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return anim;
}

// Lazy import for MapView
let MapView: any = null;
let Marker: any  = null;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
} catch {}

export default function OrderTrackingScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const pulse   = usePulse();

  const order   = MOCK_ORDERS.find(o => o.id === id) ?? MOCK_ORDERS[1];
  const [currentStatus, setCurrentStatus] = useState<Status>(order.status);

  const currentIdx = ORDER_FLOW.indexOf(currentStatus);
  const isDelivery = order.type === 'out_for_delivery' || order.type === 'delivery';
  const isDone     = currentStatus === 'delivered' || currentStatus === 'cancelled';

  // Simulate status progression for demo
  useEffect(() => {
    if (isDone) return;
    const id = setTimeout(() => {
      const nextIdx = ORDER_FLOW.indexOf(currentStatus) + 1;
      if (nextIdx < ORDER_FLOW.length) {
        setCurrentStatus(ORDER_FLOW[nextIdx]);
      }
    }, 8000);
    return () => clearTimeout(id);
  }, [currentStatus]);

  const activeStep = STEPS.find(s => s.status === currentStatus)!;

  return (
    <View style={S.root}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={S.header}>
        <View style={S.headerInner}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.charcoal} />
          </TouchableOpacity>
          <View>
            <Text style={S.headerTitle}>Order #{id?.slice(-6)}</Text>
            <Text style={S.headerRestaurant}>{order.restaurantName}</Text>
          </View>
          <TouchableOpacity style={S.helpBtn} onPress={() => {}}>
            <Ionicons name="help-circle-outline" size={22} color={C.charcoal} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Live status card */}
        <View style={[S.statusCard, SHADOW.md]}>
          <View style={S.statusTop}>
            <Animated.View style={[S.statusPulseOuter, { transform: [{ scale: pulse }] }]}>
              <View style={S.statusPulseInner} />
            </Animated.View>
            <View style={S.statusInfo}>
              <Text style={S.statusLabel}>LIVE STATUS</Text>
              <Text style={S.statusText}>{activeStep?.label}</Text>
              <Text style={S.statusDesc}>{activeStep?.desc}</Text>
            </View>
          </View>
          {order.estimatedTime && !isDone && (
            <View style={S.etaRow}>
              <Ionicons name="time-outline" size={16} color={C.gold} />
              <Text style={S.etaText}>Estimated time: <Text style={S.etaBold}>{order.estimatedTime}</Text></Text>
            </View>
          )}
          {isDone && currentStatus === 'delivered' && (
            <View style={S.doneRow}>
              <Text style={S.doneEmoji}>🎉</Text>
              <Text style={S.doneText}>Your meal has been delivered. Enjoy!</Text>
            </View>
          )}
        </View>

        {/* Map (delivery only) */}
        {isDelivery && MapView && (
          <View style={S.mapWrap}>
            <MapView
              style={S.map}
              initialRegion={{ latitude: 19.0596, longitude: 72.8295, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
            >
              {Marker && (
                <>
                  <Marker
                    coordinate={{ latitude: 19.0596, longitude: 72.8295 }}
                    title={order.restaurantName}
                    pinColor={C.gold}
                  />
                  <Marker
                    coordinate={{ latitude: 19.0650, longitude: 72.8340 }}
                    title="Delivery address"
                    pinColor={C.primary}
                  />
                </>
              )}
            </MapView>
          </View>
        )}

        {/* Timeline stepper */}
        <View style={[S.timelineCard, SHADOW.sm]}>
          <Text style={S.timelineTitle}>Order Timeline</Text>
          {STEPS.filter(s => s.status !== 'out_for_delivery' || isDelivery).map((step, i, arr) => {
            const stepIdx   = ORDER_FLOW.indexOf(step.status);
            const isActive  = step.status === currentStatus;
            const isDone    = stepIdx < currentIdx;
            const isFuture  = stepIdx > currentIdx;

            return (
              <View key={step.status} style={S.timelineItem}>
                {/* Connector line */}
                {i < arr.length - 1 && (
                  <View style={[S.connectorLine, !isFuture && S.connectorLineDone]} />
                )}
                {/* Dot */}
                <View style={[
                  S.timelineDot,
                  isDone   && S.timelineDotDone,
                  isActive && S.timelineDotActive,
                  isFuture && S.timelineDotFuture,
                ]}>
                  {isDone   && <Ionicons name="checkmark" size={12} color="#fff" />}
                  {isActive && <View style={S.timelineDotInner} />}
                </View>
                {/* Content */}
                <View style={S.timelineContent}>
                  <Text style={[S.timelineLabel, isFuture && S.timelineFutureText]}>{step.label}</Text>
                  <Text style={[S.timelineDesc, isFuture && S.timelineFutureText]}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Order details */}
        <View style={[S.detailsCard, SHADOW.sm]}>
          <Text style={S.detailsTitle}>Order Items</Text>
          {order.items.map(item => (
            <View key={item.id} style={S.detailsRow}>
              <Text style={S.detailsItem}>{item.qty}× {item.name}</Text>
              <Text style={S.detailsPrice}>₹{(item.price * item.qty).toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <View style={S.detailsDivider} />
          <View style={S.detailsRow}>
            <Text style={S.detailsTotal}>Total Paid</Text>
            <Text style={S.detailsTotalValue}>₹{order.total.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={S.contactRow}>
          <TouchableOpacity style={[S.contactBtn, SHADOW.sm]} onPress={() => {}}>
            <Ionicons name="call-outline" size={18} color={C.gold} />
            <Text style={S.contactBtnText}>Call Restaurant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.contactBtn, SHADOW.sm]} onPress={() => {}}>
            <Ionicons name="chatbubble-outline" size={18} color={C.gold} />
            <Text style={S.contactBtnText}>Live Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.charcoal, textAlign: 'center' },
  headerRestaurant: { fontSize: 12, color: C.muted, textAlign: 'center' },
  helpBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },

  statusCard: {
    backgroundColor: C.primary, margin: 20, borderRadius: 20, padding: 20,
  },
  statusTop:        { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 14 },
  statusPulseOuter: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(191,139,94,0.2)', alignItems: 'center', justifyContent: 'center' },
  statusPulseInner: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold },
  statusInfo:       { flex: 1 },
  statusLabel:      { fontSize: 10, color: 'rgba(253,248,243,0.5)', letterSpacing: 1.5, marginBottom: 4 },
  statusText:       { fontSize: 22, fontWeight: '700', color: C.cream, letterSpacing: -0.5 },
  statusDesc:       { fontSize: 13, color: 'rgba(253,248,243,0.6)', marginTop: 2 },
  etaRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(191,139,94,0.12)', borderRadius: 10, padding: 10 },
  etaText:          { fontSize: 13, color: C.goldLight },
  etaBold:          { fontWeight: '700', color: C.gold },
  doneRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 10, padding: 10 },
  doneEmoji:        { fontSize: 20 },
  doneText:         { fontSize: 13, color: '#6ee7b7', flex: 1 },

  mapWrap: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden', height: 160 },
  map:     { width: '100%', height: '100%' },

  timelineCard:  { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: C.charcoal, marginBottom: 20 },
  timelineItem:  { flexDirection: 'row', gap: 14, paddingBottom: 20, position: 'relative' },
  connectorLine: { position: 'absolute', left: 11, top: 24, width: 2, height: '100%', backgroundColor: C.border, zIndex: 0 },
  connectorLineDone: { backgroundColor: C.gold },

  timelineDot:       { width: 24, height: 24, borderRadius: 12, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  timelineDotDone:   { backgroundColor: C.gold },
  timelineDotActive: { backgroundColor: C.primary, borderWidth: 3, borderColor: C.gold },
  timelineDotFuture: { backgroundColor: 'rgba(0,0,0,0.06)' },
  timelineDotInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },

  timelineContent: { flex: 1 },
  timelineLabel:   { fontSize: 14, fontWeight: '600', color: C.charcoal },
  timelineDesc:    { fontSize: 12, color: C.muted, marginTop: 2 },
  timelineFutureText: { opacity: 0.4 },

  detailsCard:  { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  detailsTitle: { fontSize: 15, fontWeight: '700', color: C.charcoal, marginBottom: 12 },
  detailsRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailsItem:  { fontSize: 13, color: C.muted, flex: 1 },
  detailsPrice: { fontSize: 13, color: C.charcoal, fontWeight: '500' },
  detailsDivider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  detailsTotal: { fontSize: 15, fontWeight: '700', color: C.charcoal },
  detailsTotalValue: { fontSize: 16, fontWeight: '700', color: C.charcoal },

  contactRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 16 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.2)',
  },
  contactBtnText: { fontSize: 13, color: C.gold, fontWeight: '600' },
});
