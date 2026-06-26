import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { RestaurantCard } from '../../src/components/RestaurantCard';
import { RESTAURANTS } from '../../src/lib/mock-data';

const FILTERS = ['All', 'Fine Dining', 'Casual', 'Brunch', 'Bar', 'Open Now'];

export default function ExploreScreen() {
  const [query,    setQuery]  = useState('');
  const [active,   setActive] = useState('All');

  const filtered = useMemo(() => {
    return RESTAURANTS.filter(r => {
      const matchQ = !query || r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(query.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));
      const matchF = active === 'All'
        ? true
        : active === 'Open Now'
          ? r.isOpen
          : r.tags.some(t => t.toLowerCase() === active.toLowerCase());
      return matchQ && matchF;
    });
  }, [query, active]);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.title}>Explore</Text>
        <Text style={S.subtitle}>{filtered.length} restaurants near you</Text>
      </View>

      {/* Search */}
      <View style={[S.searchWrap, SHADOW.sm]}>
        <Ionicons name="search" size={18} color={C.subtle} style={S.searchIcon} />
        <TextInput
          style={S.searchInput}
          placeholder="Restaurants, cuisines, dishes…"
          placeholderTextColor={C.subtle}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={C.subtle} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={S.filtersScroll}
        contentContainerStyle={S.filtersContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[S.chip, active === f && S.chipActive]}
            onPress={() => setActive(f)}
          >
            <Text style={[S.chipText, active === f && S.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={S.list} showsVerticalScrollIndicator={false} contentContainerStyle={S.listContent}>
        {filtered.length === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyEmoji}>🔍</Text>
            <Text style={S.emptyTitle}>No results found</Text>
            <Text style={S.emptyDesc}>Try a different search or filter</Text>
          </View>
        ) : (
          filtered.map(r => <RestaurantCard key={r.id} restaurant={r} horizontal />)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.cream },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title:  { fontSize: 28, fontWeight: '700', color: C.charcoal, letterSpacing: -0.5 },
  subtitle:{ fontSize: 13, color: C.muted, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 20, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: C.charcoal },

  filtersScroll:   { flexGrow: 0 },
  filtersContent:  { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText:       { fontSize: 13, color: C.muted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  list:        { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 4 },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.charcoal },
  emptyDesc:  { fontSize: 14, color: C.muted, marginTop: 4 },
});
