import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { C, SHADOW } from '../lib/colors';
import type { Restaurant } from '../types';

interface Props {
  restaurant: Restaurant;
  horizontal?: boolean;
}

export function RestaurantCard({ restaurant, horizontal = false }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[S.card, horizontal ? S.cardH : S.cardV, SHADOW.md]}
      onPress={() => router.push(`/restaurant/${restaurant.slug}`)}
    >
      <View style={horizontal ? S.imageWrapH : S.imageWrapV}>
        <Image source={{ uri: restaurant.image }} style={S.image} />
        {!restaurant.isOpen && (
          <View style={S.closedBadge}>
            <Text style={S.closedText}>Closed</Text>
          </View>
        )}
        {restaurant.isFavorite && (
          <View style={S.favDot} />
        )}
      </View>

      <View style={S.info}>
        <Text style={S.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={S.cuisine} numberOfLines={1}>{restaurant.cuisine}</Text>

        <View style={S.meta}>
          <View style={S.ratingRow}>
            <Text style={S.star}>★</Text>
            <Text style={S.ratingNum}>{restaurant.rating}</Text>
            <Text style={S.reviews}>({restaurant.reviewCount})</Text>
          </View>
          <Text style={S.dot}>·</Text>
          <Text style={S.metaText}>{restaurant.priceRange}</Text>
          <Text style={S.dot}>·</Text>
          <Text style={S.metaText}>{restaurant.distance}</Text>
        </View>

        <View style={S.tags}>
          {restaurant.tags.slice(0, 2).map(tag => (
            <View key={tag} style={S.tag}>
              <Text style={S.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  card:  { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  cardV: { width: 220, marginRight: 12 },
  cardH: { flexDirection: 'row', marginBottom: 12, width: '100%' },

  imageWrapV: { height: 130, width: '100%', position: 'relative' },
  imageWrapH: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', margin: 12, flexShrink: 0 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },

  closedBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  closedText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  favDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold,
  },

  info: { padding: 12, flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: C.charcoal, letterSpacing: -0.3 },
  cuisine: { fontSize: 12, color: C.muted, marginTop: 1 },

  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { color: '#f59e0b', fontSize: 11 },
  ratingNum: { fontSize: 12, fontWeight: '600', color: C.charcoal },
  reviews: { fontSize: 11, color: C.muted },
  dot: { color: C.subtle, fontSize: 11 },
  metaText: { fontSize: 12, color: C.muted },

  tags: { flexDirection: 'row', gap: 4, marginTop: 8 },
  tag: {
    backgroundColor: 'rgba(191,139,94,0.08)',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  tagText: { fontSize: 10, color: C.goldDark, fontWeight: '500' },
});
