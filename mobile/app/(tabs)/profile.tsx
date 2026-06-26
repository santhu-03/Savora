import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { useAuthStore } from '../../src/store/auth.store';
import { MOCK_ORDERS } from '../../src/lib/mock-data';

const { width: W } = Dimensions.get('window');

const TIER_CFG = {
  bronze:   { label: 'Bronze',   gradient: ['#cd7f32', '#a0522d'], icon: '🥉', next: 'Silver',   nextPts: 2500 },
  silver:   { label: 'Silver',   gradient: ['#c0c0c0', '#a9a9a9'], icon: '🥈', next: 'Gold',     nextPts: 5000 },
  gold:     { label: 'Gold',     gradient: ['#BF8B5E', '#a67748'], icon: '🥇', next: 'Platinum', nextPts: 10000 },
  platinum: { label: 'Platinum', gradient: ['#4a0d0d', '#260B10'], icon: '💎', next: null,        nextPts: null },
};

const MENU_ITEMS = [
  { icon: 'receipt-outline',       label: 'Order History',     route: '/(tabs)/orders' },
  { icon: 'calendar-outline',      label: 'My Reservations',   route: '/(tabs)/reservations' },
  { icon: 'location-outline',      label: 'Saved Addresses',   route: null },
  { icon: 'notifications-outline', label: 'Notifications',     route: null },
  { icon: 'heart-outline',         label: 'Favourites',        route: '/(tabs)/explore' },
  { icon: 'help-circle-outline',   label: 'Help & Support',    route: null },
  { icon: 'shield-checkmark-outline', label: 'Privacy Policy', route: null },
];

function LoyaltyCard({ points, tier }: { points: number; tier: keyof typeof TIER_CFG }) {
  const cfg  = TIER_CFG[tier];
  const prog = cfg.nextPts ? Math.min((points / cfg.nextPts) * 100, 100) : 100;

  return (
    <View style={[S.loyaltyCard, { backgroundColor: cfg.gradient[0] }]}>
      {/* Background accent */}
      <View style={S.loyaltyBg} />

      <View style={S.loyaltyTop}>
        <View>
          <Text style={S.loyaltyTierLabel}>LOYALTY TIER</Text>
          <Text style={S.loyaltyTierName}>{cfg.icon} {cfg.label}</Text>
        </View>
        <View style={S.loyaltyLogo}>
          <Text style={S.loyaltyLogoText}>S</Text>
        </View>
      </View>

      <View style={S.loyaltyPoints}>
        <Text style={S.loyaltyPtsNum}>{points.toLocaleString('en-IN')}</Text>
        <Text style={S.loyaltyPtsLabel}>points</Text>
      </View>

      {cfg.nextPts && (
        <View style={S.loyaltyProgress}>
          <View style={S.loyaltyBarBg}>
            <View style={[S.loyaltyBarFill, { width: `${prog}%` }]} />
          </View>
          <Text style={S.loyaltyProgressText}>
            {(cfg.nextPts - points).toLocaleString('en-IN')} pts to {cfg.next}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router    = useRouter();
  const user      = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);

  const orderCount = MOCK_ORDERS.filter(o => o.status === 'delivered').length;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await clearAuth(); } },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Profile</Text>
          <TouchableOpacity style={S.settingsBtn} onPress={() => {}}>
            <Ionicons name="settings-outline" size={22} color={C.charcoal} />
          </TouchableOpacity>
        </View>

        {/* User info */}
        <View style={S.userCard}>
          <View style={S.avatarWrap}>
            <View style={S.avatar}>
              <Text style={S.avatarText}>
                {user.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <TouchableOpacity style={S.editAvatarBtn}>
              <Ionicons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={S.userInfo}>
            <Text style={S.userName}>{user.name}</Text>
            <Text style={S.userEmail}>{user.email}</Text>
            <Text style={S.userPhone}>{user.phone}</Text>
          </View>
          <TouchableOpacity style={S.editBtn} onPress={() => {}}>
            <Text style={S.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={[S.statsRow, SHADOW.sm]}>
          {[
            { label: 'Orders',       value: orderCount },
            { label: 'Saved',        value: 2 },
            { label: 'Points',       value: user.loyaltyPoints.toLocaleString('en-IN') },
          ].map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={S.statDivider} />}
              <View style={S.stat}>
                <Text style={S.statVal}>{stat.value}</Text>
                <Text style={S.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Loyalty card */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Loyalty Rewards</Text>
        </View>
        <View style={S.cardPad}>
          <LoyaltyCard points={user.loyaltyPoints} tier={user.loyaltyTier} />
        </View>

        {/* Points history banner */}
        <View style={[S.pointsBanner, SHADOW.sm]}>
          <Ionicons name="star" size={18} color={C.gold} />
          <View style={S.pointsBannerInfo}>
            <Text style={S.pointsBannerTitle}>+150 pts from last order</Text>
            <Text style={S.pointsBannerSub}>Savora Colaba · 2 days ago</Text>
          </View>
          <TouchableOpacity>
            <Text style={S.pointsBannerLink}>History →</Text>
          </TouchableOpacity>
        </View>

        {/* Menu list */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Account</Text>
        </View>
        <View style={[S.menuCard, SHADOW.sm]}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[S.menuItem, i < MENU_ITEMS.length - 1 && S.menuItemBorder]}
              onPress={() => item.route ? router.push(item.route as any) : null}
            >
              <View style={S.menuIconWrap}>
                <Ionicons name={item.icon as any} size={18} color={C.gold} />
              </View>
              <Text style={S.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={15} color={C.subtle} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={S.logoutWrap}>
          <TouchableOpacity style={S.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={S.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.cream },

  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  title:       { fontSize: 28, fontWeight: '700', color: C.charcoal, letterSpacing: -0.5 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20, marginBottom: 16,
    padding: 16, ...SHADOW.sm,
  },
  avatarWrap: { position: 'relative' },
  avatar:     { width: 60, height: 60, borderRadius: 18, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  editAvatarBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  userInfo:  { flex: 1 },
  userName:  { fontSize: 16, fontWeight: '700', color: C.charcoal },
  userEmail: { fontSize: 12, color: C.muted, marginTop: 1 },
  userPhone: { fontSize: 12, color: C.muted },
  editBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: C.border },
  editBtnText: { fontSize: 13, color: C.charcoal, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    marginHorizontal: 20, marginBottom: 16, padding: 16,
  },
  stat:      { flex: 1, alignItems: 'center' },
  statVal:   { fontSize: 22, fontWeight: '700', color: C.charcoal },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },

  section:     { paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle:{ fontSize: 18, fontWeight: '700', color: C.charcoal, letterSpacing: -0.3 },

  cardPad: { paddingHorizontal: 20, marginBottom: 16 },

  loyaltyCard: { borderRadius: 20, padding: 22, overflow: 'hidden' },
  loyaltyBg:   {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  loyaltyTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  loyaltyTierLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 2 },
  loyaltyTierName:  { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  loyaltyLogo:      { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  loyaltyLogoText:  { color: '#fff', fontSize: 22, fontWeight: '700' },
  loyaltyPoints:    { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16 },
  loyaltyPtsNum:    { fontSize: 36, fontWeight: '700', color: '#fff' },
  loyaltyPtsLabel:  { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  loyaltyProgress:  { gap: 6 },
  loyaltyBarBg:     { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  loyaltyBarFill:   { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  loyaltyProgressText: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },

  pointsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 20, marginBottom: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.15)',
  },
  pointsBannerInfo:  { flex: 1 },
  pointsBannerTitle: { fontSize: 14, fontWeight: '600', color: C.charcoal },
  pointsBannerSub:   { fontSize: 12, color: C.muted, marginTop: 1 },
  pointsBannerLink:  { fontSize: 13, color: C.gold, fontWeight: '600' },

  menuCard: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginBottom: 16, overflow: 'hidden' },
  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIconWrap:   { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(191,139,94,0.1)', alignItems: 'center', justifyContent: 'center' },
  menuLabel:      { flex: 1, fontSize: 15, color: C.charcoal, fontWeight: '500' },

  logoutWrap: { paddingHorizontal: 20, marginBottom: 8 },
  logoutBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
