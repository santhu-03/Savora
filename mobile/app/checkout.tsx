import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, SHADOW } from '../src/lib/colors';
import { useCartStore } from '../src/store/cart.store';

// Stripe hook — graceful fallback if not in native build
let useStripe: any = () => ({ initPaymentSheet: async () => ({}), presentPaymentSheet: async () => ({ error: null }) });
try { useStripe = require('@stripe/stripe-react-native').useStripe; } catch {}

export default function CheckoutScreen() {
  const router = useRouter();
  const {
    items, orderType, tableId, restaurantName, notes,
    subtotal, tax, serviceCharge, total, clearCart,
  } = useCartStore();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processing, setProcessing] = useState(false);
  const [address, setAddress]       = useState('14 Hill Road, Bandra West, Mumbai 400050');

  const handlePay = async () => {
    setProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // In production: fetch clientSecret from your backend
      // const { data } = await paymentApi.createIntent({ amount: total() * 100, orderId: 'NEW' });
      // await initPaymentSheet({ paymentIntentClientSecret: data.clientSecret });
      // const { error } = await presentPaymentSheet();
      // if (error) throw new Error(error.message);

      // Mock payment flow for demo
      await new Promise(r => setTimeout(r, 1200));

      const orderId = `ORD-${Date.now()}`;
      clearCart();
      router.replace(`/order-tracking/${orderId}`);
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={S.root}>
      <SafeAreaView edges={['top']} style={S.header}>
        <View style={S.headerInner}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.charcoal} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Checkout</Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Order Summary</Text>
          <View style={[S.summaryCard, SHADOW.sm]}>
            <View style={S.summaryTop}>
              <Text style={S.summaryRestaurant}>{restaurantName}</Text>
              <Text style={S.summaryType}>
                {orderType === 'dine-in' ? `Table ${tableId}` : orderType === 'takeaway' ? 'Takeaway' : 'Delivery'}
              </Text>
            </View>
            {items.map(item => (
              <View key={item.id} style={S.summaryItem}>
                <Text style={S.summaryItemName}>{item.quantity}× {item.name}</Text>
                <Text style={S.summaryItemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            {notes ? (
              <Text style={S.summaryNotes}>Note: {notes}</Text>
            ) : null}
          </View>
        </View>

        {/* Delivery address (only for delivery) */}
        {orderType === 'delivery' && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity style={[S.addressCard, SHADOW.sm]} onPress={() => {}}>
              <Ionicons name="location" size={18} color={C.gold} />
              <View style={S.addressInfo}>
                <Text style={S.addressLabel}>Home</Text>
                <Text style={S.addressText}>{address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.subtle} />
            </TouchableOpacity>
          </View>
        )}

        {/* Bill breakdown */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Payment Details</Text>
          <View style={[S.billCard, SHADOW.sm]}>
            {[
              { label: 'Subtotal',      value: `₹${subtotal().toLocaleString('en-IN')}` },
              { label: 'GST (5%)',      value: `₹${tax().toLocaleString('en-IN')}` },
              { label: 'Service Charge',value: `₹${serviceCharge().toLocaleString('en-IN')}` },
            ].map(r => (
              <View key={r.label} style={S.billRow}>
                <Text style={S.billLabel}>{r.label}</Text>
                <Text style={S.billValue}>{r.value}</Text>
              </View>
            ))}
            <View style={S.billDivider} />
            <View style={S.billRow}>
              <Text style={S.billTotalLabel}>Total Payable</Text>
              <Text style={S.billTotalValue}>₹{total().toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Payment methods */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Pay With</Text>
          <View style={[S.payCard, SHADOW.sm]}>
            {[
              { icon: '💳', label: 'Card / UPI / Net Banking', via: 'Stripe', primary: true },
              { icon: '💵', label: 'Cash on Delivery', via: null, primary: false },
            ].map(p => (
              <TouchableOpacity key={p.label} style={[S.payOption, p.primary && S.payOptionActive]}>
                <Text style={S.payIcon}>{p.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[S.payLabel, p.primary && S.payLabelActive]}>{p.label}</Text>
                  {p.via && <Text style={S.payVia}>via {p.via}</Text>}
                </View>
                {p.primary && <View style={S.paySelected} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loyalty points */}
        <View style={S.section}>
          <View style={S.loyaltyRow}>
            <Ionicons name="star" size={16} color={C.gold} />
            <Text style={S.loyaltyText}>You'll earn <Text style={S.loyaltyPts}>+{Math.round(subtotal() / 10)} pts</Text> from this order</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pay button */}
      <SafeAreaView edges={['bottom']} style={S.footer}>
        <TouchableOpacity
          style={[S.payBtn, processing && S.payBtnProcessing, SHADOW.lg]}
          onPress={handlePay}
          disabled={processing}
          activeOpacity={0.9}
        >
          {processing ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={S.payBtnText}>Processing…</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={S.payBtnText}>Pay ₹{total().toLocaleString('en-IN')}</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={S.secureNote}>🔒 Secured by Stripe · 256-bit SSL encryption</Text>
      </SafeAreaView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.charcoal },

  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.charcoal, marginBottom: 10 },

  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  summaryTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryRestaurant: { fontSize: 15, fontWeight: '700', color: C.charcoal },
  summaryType:       { fontSize: 12, color: C.muted, fontWeight: '500', marginTop: 1 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryItemName:  { fontSize: 13, color: C.muted },
  summaryItemPrice: { fontSize: 13, color: C.charcoal, fontWeight: '500' },
  summaryNotes: { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 8 },

  addressCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
  addressInfo: { flex: 1 },
  addressLabel:{ fontSize: 12, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  addressText: { fontSize: 14, color: C.charcoal, marginTop: 2 },

  billCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  billRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel:      { fontSize: 14, color: C.muted },
  billValue:      { fontSize: 14, color: C.charcoal, fontWeight: '500' },
  billDivider:    { height: 1, backgroundColor: C.border, marginVertical: 8 },
  billTotalLabel: { fontSize: 16, fontWeight: '700', color: C.charcoal },
  billTotalValue: { fontSize: 18, fontWeight: '700', color: C.charcoal },

  payCard:     { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  payOption:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  payOptionActive: { backgroundColor: 'rgba(191,139,94,0.04)' },
  payIcon:     { fontSize: 22 },
  payLabel:    { fontSize: 14, color: C.charcoal, fontWeight: '500' },
  payLabelActive: { fontWeight: '600' },
  payVia:      { fontSize: 11, color: C.muted, marginTop: 1 },
  paySelected: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.gold, borderWidth: 2, borderColor: C.goldLight },

  loyaltyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(191,139,94,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(191,139,94,0.15)' },
  loyaltyText:{ fontSize: 13, color: C.muted, flex: 1 },
  loyaltyPts: { color: C.gold, fontWeight: '700' },

  footer:   { paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.cream },
  payBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 18, paddingVertical: 17 },
  payBtnProcessing: { backgroundColor: C.goldDark },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secureNote: { textAlign: 'center', fontSize: 11, color: C.subtle, marginTop: 8 },
});
