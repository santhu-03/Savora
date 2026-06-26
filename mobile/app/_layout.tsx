import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAuthStore } from '../src/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const segments  = useSegments();
  const router    = useRouter();

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={STRIPE_KEY}>
          <AuthGuard>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="restaurant/[slug]" />
              <Stack.Screen name="menu/[tableId]" />
              <Stack.Screen
                name="cart"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="order-tracking/[id]" />
              <Stack.Screen name="reservation/[id]" />
            </Stack>
          </AuthGuard>
        </StripeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
