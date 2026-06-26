import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { C } from '../../src/lib/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/auth.store';

interface FormData { name: string; email: string; phone: string; password: string; }

export default function Register() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      await setAuth(
        {
          id: 'u_new', name: data.name, email: data.email,
          phone: data.phone, loyaltyTier: 'bronze', loyaltyPoints: 100,
        },
        'mock_jwt_token_new',
      );
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
        <TouchableOpacity style={S.back} onPress={() => router.back()}>
          <Text style={S.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={S.header}>
          <Text style={S.logo}>Savora</Text>
          <Text style={S.title}>Create your account</Text>
          <Text style={S.subtitle}>Join thousands of guests and earn loyalty rewards</Text>
        </View>

        {/* Welcome bonus banner */}
        <View style={S.bonusBanner}>
          <Text style={S.bonusEmoji}>🎁</Text>
          <View>
            <Text style={S.bonusTitle}>Welcome Bonus</Text>
            <Text style={S.bonusDesc}>100 points credited on first order</Text>
          </View>
        </View>

        <View style={S.form}>
          {[
            { name: 'name'     as const, label: 'Full name',       placeholder: 'Arjun Mehta',         rules: { required: 'Name is required' }, keyboard: 'default' },
            { name: 'email'    as const, label: 'Email address',   placeholder: 'arjun@example.com',   rules: { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } }, keyboard: 'email-address' },
            { name: 'phone'    as const, label: 'Mobile number',   placeholder: '+91 98765 43210',      rules: { required: 'Phone is required' }, keyboard: 'phone-pad' },
            { name: 'password' as const, label: 'Create password', placeholder: 'Min. 8 characters',   rules: { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } }, keyboard: 'default', secure: true },
          ].map(f => (
            <Controller
              key={f.name}
              control={control}
              name={f.name}
              rules={f.rules as any}
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label={f.label}
                  dark
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType={f.keyboard as any}
                  placeholder={f.placeholder}
                  autoCapitalize={f.name === 'name' ? 'words' : 'none'}
                  secureTextEntry={f.secure}
                  error={(errors as any)[f.name]?.message}
                />
              )}
            />
          ))}
        </View>

        <Text style={S.terms}>
          By creating an account you agree to our{' '}
          <Text style={S.termsLink}>Terms of Service</Text> and{' '}
          <Text style={S.termsLink}>Privacy Policy</Text>
        </Text>

        <Button
          label="Create Account"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity style={S.loginRow} onPress={() => router.back()}>
          <Text style={S.loginText}>Already have an account? </Text>
          <Text style={S.loginLink}>Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.primary },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  back:     { marginBottom: 20 },
  backText: { color: C.gold, fontSize: 15 },

  header:   { marginBottom: 24 },
  logo:     { fontSize: 36, color: C.gold, letterSpacing: -0.5, fontWeight: '700', marginBottom: 8 },
  title:    { fontSize: 26, fontWeight: '700', color: C.cream, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(253,248,243,0.5)', marginTop: 4 },

  bonusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(191,139,94,0.12)',
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.2)',
    borderRadius: 14, padding: 14, marginBottom: 24,
  },
  bonusEmoji: { fontSize: 28 },
  bonusTitle: { color: C.gold, fontSize: 14, fontWeight: '700' },
  bonusDesc:  { color: 'rgba(253,248,243,0.5)', fontSize: 12, marginTop: 1 },

  form: { gap: 14, marginBottom: 16 },

  terms:     { color: 'rgba(253,248,243,0.35)', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: C.gold },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText:{ color: 'rgba(253,248,243,0.45)', fontSize: 14 },
  loginLink:{ color: C.gold, fontSize: 14, fontWeight: '600' },
});
