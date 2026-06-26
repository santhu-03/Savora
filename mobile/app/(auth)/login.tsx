import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import { C } from '../../src/lib/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/auth.store';

interface FormData { email: string; password: string; }

export default function Login() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { email: 'arjun.mehta@gmail.com', password: 'password123' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Mock login — replace with: const res = await authApi.login(data.email, data.password)
      await new Promise(r => setTimeout(r, 800));
      await setAuth(
        {
          id: 'u1', name: 'Arjun Mehta', email: data.email,
          phone: '+91 98765 43210', loyaltyTier: 'gold', loyaltyPoints: 4250,
        },
        'mock_jwt_token',
      );
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={S.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={S.brand}>
          <Text style={S.eyebrow}>EST. 2024</Text>
          <Text style={S.logo}>Savora</Text>
          <Text style={S.tagline}>Where every meal is a memory</Text>
        </View>

        {/* Card */}
        <View style={S.card}>
          <Text style={S.title}>Welcome back</Text>
          <Text style={S.subtitle}>Sign in to continue your dining journey</Text>

          <View style={S.form}>
            <Controller
              control={control}
              name="email"
              rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } }}
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Email address"
                  dark
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Password"
                  dark
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                />
              )}
            />

            <TouchableOpacity style={S.forgotRow} onPress={() => {}}>
              <Text style={S.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            label="Sign In"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSubmit(onSubmit)}
          />

          <View style={S.dividerRow}>
            <View style={S.dividerLine} />
            <Text style={S.dividerText}>or continue with</Text>
            <View style={S.dividerLine} />
          </View>

          {/* Social buttons (stub) */}
          <View style={S.socialRow}>
            {['G', 'A'].map(label => (
              <TouchableOpacity key={label} style={S.socialBtn}>
                <Text style={S.socialIcon}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={S.registerRow}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={S.registerText}>New to Savora? </Text>
            <Text style={S.registerLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.primary },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },

  brand:    { alignItems: 'center', marginBottom: 40 },
  eyebrow:  { color: C.gold, fontSize: 10, letterSpacing: 5, opacity: 0.7, marginBottom: 8 },
  logo:     { fontSize: 56, color: C.gold, letterSpacing: -1, fontWeight: '700' },
  tagline:  { color: C.goldLight, fontSize: 14, fontStyle: 'italic', opacity: 0.7, marginTop: 4 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.15)',
  },
  title:    { fontSize: 24, fontWeight: '700', color: C.cream, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(253,248,243,0.5)', marginBottom: 24 },

  form: { gap: 14, marginBottom: 24 },

  forgotRow:  { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { color: C.gold, fontSize: 13 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(191,139,94,0.15)' },
  dividerText: { color: 'rgba(253,248,243,0.35)', fontSize: 12 },

  socialRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 24 },
  socialBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  socialIcon: { color: C.cream, fontSize: 18, fontWeight: '700' },

  registerRow: { flexDirection: 'row', justifyContent: 'center' },
  registerText:{ color: 'rgba(253,248,243,0.45)', fontSize: 14 },
  registerLink:{ color: C.gold, fontSize: 14, fontWeight: '600' },
});
