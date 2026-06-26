import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal,
  ScrollView, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { MOCK_RESERVATIONS } from '../../src/lib/mock-data';
import type { Reservation } from '../../src/types';

const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: 'rgba(245,158,11,0.1)', text: '#b45309' },
  confirmed: { label: 'Confirmed', bg: 'rgba(22,163,74,0.1)', text: '#15803d' },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.1)', text: '#b91c1c' },
  completed: { label: 'Completed', bg: 'rgba(16,185,129,0.1)', text: '#047857' },
};

const OCCASIONS = ['Birthday', 'Anniversary', 'Business Dinner', 'Date Night', 'Family Gathering', 'Other'];
const TIME_SLOTS = ['12:00', '13:00', '14:00', '18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

function ReservationCard({ res }: { res: Reservation }) {
  const router = useRouter();
  const cfg    = STATUS_CFG[res.status];
  const date   = new Date(`${res.date}T00:00:00`);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <TouchableOpacity
      style={[S.card, SHADOW.sm]}
      activeOpacity={0.88}
      onPress={() => router.push(`/reservation/${res.id}`)}
    >
      <Image source={{ uri: res.restaurantImage }} style={S.restoImg} />
      <View style={S.cardContent}>
        <View style={S.cardTop}>
          <Text style={S.restoName}>{res.restaurantName}</Text>
          <View style={[S.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[S.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={S.detailsRow}>
          <View style={S.detail}>
            <Ionicons name="calendar-outline" size={13} color={C.muted} />
            <Text style={S.detailText}>{dateStr}</Text>
          </View>
          <View style={S.detail}>
            <Ionicons name="time-outline" size={13} color={C.muted} />
            <Text style={S.detailText}>{res.time}</Text>
          </View>
          <View style={S.detail}>
            <Ionicons name="people-outline" size={13} color={C.muted} />
            <Text style={S.detailText}>{res.guests} guests</Text>
          </View>
        </View>
        {res.occasion && (
          <Text style={S.occasion}>🎉 {res.occasion}</Text>
        )}
        {res.tableNumber && (
          <Text style={S.tableNum}>Table {res.tableNumber}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function NewReservationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step,     setStep]    = useState(1);
  const [date,     setDate]    = useState('');
  const [time,     setTime]    = useState('');
  const [guests,   setGuests]  = useState(2);
  const [occasion, setOccasion]= useState('');
  const [notes,    setNotes]   = useState('');

  const canNext = step === 1 ? date && time : true;

  const handleSubmit = () => {
    // Submit to API
    onClose();
    setStep(1); setDate(''); setTime(''); setGuests(2); setOccasion(''); setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={S.modal} edges={['top']}>
        <View style={S.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={C.charcoal} />
          </TouchableOpacity>
          <Text style={S.modalTitle}>New Reservation</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={S.modalScroll} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={S.modalStep}>
              <Text style={S.stepTitle}>When would you like to dine?</Text>
              <Text style={S.stepLabel}>Date</Text>
              <TextInput
                style={S.dateInput}
                placeholder="YYYY-MM-DD (e.g. 2024-07-15)"
                placeholderTextColor={C.subtle}
                value={date}
                onChangeText={setDate}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
              />
              <Text style={S.stepLabel}>Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={S.timeSlots}>
                  {TIME_SLOTS.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[S.timeChip, time === t && S.timeChipActive]}
                      onPress={() => setTime(t)}
                    >
                      <Text style={[S.timeChipText, time === t && S.timeChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={S.stepLabel}>Guests</Text>
              <View style={S.guestStepper}>
                <TouchableOpacity
                  style={S.stepperBtn}
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                >
                  <Text style={S.stepperIcon}>−</Text>
                </TouchableOpacity>
                <Text style={S.stepperVal}>{guests}</Text>
                <TouchableOpacity
                  style={S.stepperBtn}
                  onPress={() => setGuests(Math.min(12, guests + 1))}
                >
                  <Text style={S.stepperIcon}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={S.modalStep}>
              <Text style={S.stepTitle}>Any special occasion?</Text>
              <View style={S.occasionGrid}>
                {OCCASIONS.map(o => (
                  <TouchableOpacity
                    key={o}
                    style={[S.occasionChip, occasion === o && S.occasionChipActive]}
                    onPress={() => setOccasion(occasion === o ? '' : o)}
                  >
                    <Text style={[S.occasionText, occasion === o && S.occasionTextActive]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={S.stepLabel}>Special Requests</Text>
              <TextInput
                style={S.notesInput}
                placeholder="Dietary requirements, seating preference…"
                placeholderTextColor={C.subtle}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </ScrollView>

        <View style={S.modalFooter}>
          {step === 2 && (
            <TouchableOpacity style={S.backBtn} onPress={() => setStep(1)}>
              <Text style={S.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[S.nextBtn, !canNext && S.nextBtnDisabled]}
            disabled={!canNext}
            onPress={() => step === 1 ? setStep(2) : handleSubmit()}
          >
            <Text style={S.nextBtnText}>{step === 1 ? 'Continue' : 'Confirm Reservation'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function ReservationsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const upcoming = MOCK_RESERVATIONS.filter(r => r.status !== 'cancelled' && r.status !== 'completed');
  const past     = MOCK_RESERVATIONS.filter(r => r.status === 'cancelled' || r.status === 'completed');

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <View>
          <Text style={S.title}>Reservations</Text>
          <Text style={S.subtitle}>{upcoming.length} upcoming</Text>
        </View>
        <TouchableOpacity style={S.newBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={S.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[
          { type: 'section', label: `Upcoming (${upcoming.length})`, id: 'h1' },
          ...upcoming.map(r => ({ type: 'res', data: r, id: r.id })),
          { type: 'section', label: `Past (${past.length})`, id: 'h2' },
          ...past.map(r => ({ type: 'res', data: r, id: r.id })),
        ]}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return <Text style={S.sectionLabel}>{(item as any).label}</Text>;
          }
          return <ReservationCard res={(item as any).data} />;
        }}
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <NewReservationModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.cream },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  title:   { fontSize: 28, fontWeight: '700', color: C.charcoal, letterSpacing: -0.5 },
  subtitle:{ fontSize: 13, color: C.muted },
  newBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  list:        { paddingHorizontal: 20 },
  sectionLabel:{ fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  restoImg:    { width: '100%', height: 110, resizeMode: 'cover' },
  cardContent: { padding: 14 },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  restoName:   { fontSize: 16, fontWeight: '700', color: C.charcoal, flex: 1 },
  badge:       { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText:   { fontSize: 11, fontWeight: '600' },
  detailsRow:  { gap: 6 },
  detail:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText:  { fontSize: 13, color: C.muted },
  occasion:    { fontSize: 12, color: C.gold, fontWeight: '600', marginTop: 6 },
  tableNum:    { fontSize: 12, color: C.muted, marginTop: 2 },

  // Modal
  modal:       { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle:  { fontSize: 17, fontWeight: '700', color: C.charcoal },
  modalScroll: { flex: 1 },
  modalStep:   { padding: 24, gap: 8 },
  stepTitle:   { fontSize: 20, fontWeight: '700', color: C.charcoal, marginBottom: 8 },
  stepLabel:   { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 12 },
  dateInput:   { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 13, fontSize: 15, color: C.charcoal, marginTop: 4 },
  timeSlots:   { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  timeChip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff' },
  timeChipActive:    { backgroundColor: C.primary, borderColor: C.primary },
  timeChipText:      { fontSize: 13, color: C.muted, fontWeight: '500' },
  timeChipTextActive:{ color: '#fff', fontWeight: '600' },
  guestStepper:{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  stepperBtn:  { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepperIcon: { fontSize: 20, color: C.charcoal, lineHeight: 24 },
  stepperVal:  { fontSize: 22, fontWeight: '700', color: C.charcoal, minWidth: 32, textAlign: 'center' },
  occasionGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  occasionChip:{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border },
  occasionChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  occasionText:       { fontSize: 13, color: C.muted },
  occasionTextActive: { color: '#fff', fontWeight: '600' },
  notesInput:  {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    padding: 13, fontSize: 14, color: C.charcoal, minHeight: 90,
    textAlignVertical: 'top', marginTop: 4,
  },
  modalFooter: { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: C.border },
  backBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  backBtnText: { color: C.charcoal, fontSize: 15, fontWeight: '600' },
  nextBtn:     { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: C.gold, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
