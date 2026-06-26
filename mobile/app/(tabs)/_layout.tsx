import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from '../../src/lib/colors';
import { useCartStore } from '../../src/store/cart.store';

type TabName = 'index' | 'explore' | 'scan' | 'orders' | 'profile';

const TABS: { name: TabName; label: string; icon: string; iconFocused: string }[] = [
  { name: 'index',      label: 'Home',      icon: 'home-outline',     iconFocused: 'home' },
  { name: 'explore',    label: 'Explore',   icon: 'search-outline',   iconFocused: 'search' },
  { name: 'scan',       label: 'Scan',      icon: 'scan-outline',     iconFocused: 'scan' },
  { name: 'orders',     label: 'Orders',    icon: 'receipt-outline',  iconFocused: 'receipt' },
  { name: 'profile',    label: 'Profile',   icon: 'person-outline',   iconFocused: 'person' },
];

function TabBar({ state, descriptors, navigation }: any) {
  const cartCount = useCartStore(s => s.itemCount());

  return (
    <View style={[S.bar, SHADOW.md]}>
      {state.routes.map((route: any, i: number) => {
        const { options } = descriptors[route.key];
        const focused = state.index === i;
        const tab = TABS.find(t => t.name === route.name)!;
        const isScan = route.name === 'scan';

        return (
          <View key={route.key} style={isScan ? S.scanWrap : S.tab}>
            {isScan ? (
              <View style={[S.scanBtn, focused && S.scanBtnActive]}
                onTouchEnd={() => navigation.navigate(route.name)}>
                <Ionicons name="scan" size={22} color="#fff" />
              </View>
            ) : (
              <View
                style={S.tabInner}
                onTouchEnd={() => navigation.navigate(route.name)}
              >
                <View style={S.iconWrap}>
                  <Ionicons
                    name={(focused ? tab.iconFocused : tab.icon) as any}
                    size={22}
                    color={focused ? C.gold : C.subtle}
                  />
                  {route.name === 'orders' && cartCount > 0 && (
                    <View style={S.badge}>
                      <Text style={S.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[S.tabLabel, focused && S.tabLabelActive]}>
                  {tab.label}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="scan"    options={{ title: 'Scan' }} />
      <Tabs.Screen name="orders"  options={{ title: 'Orders' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const S = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },

  tab:      { flex: 1 },
  tabInner: { alignItems: 'center', gap: 3 },
  scanWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },

  scanBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: -6,
    ...Platform.select({
      ios: { shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  scanBtnActive: { backgroundColor: C.goldDark },

  iconWrap: { position: 'relative', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },

  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: C.gold, borderRadius: 10,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  tabLabel:       { fontSize: 10, color: C.subtle, fontWeight: '500' },
  tabLabelActive: { color: C.gold },
});
