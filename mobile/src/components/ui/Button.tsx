import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet,
  type TouchableOpacityProps, type ViewStyle, type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C } from '../../lib/colors';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface Props extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label, variant = 'primary', size = 'md',
  loading = false, fullWidth = false, icon,
  style, disabled, onPress, ...rest
}: Props) {
  const handlePress = async (e: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={handlePress}
      style={[
        S.base,
        S[`size_${size}`],
        S[`variant_${variant}`],
        fullWidth && S.fullWidth,
        (disabled || loading) && S.disabled,
        style as ViewStyle,
      ]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator size="small" color={variant === 'primary' ? C.cream : C.gold} />
        : <>
            {icon}
            <Text style={[S.label, S[`labelSize_${size}`], S[`labelVariant_${variant}`]]}>
              {label}
            </Text>
          </>
      }
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },

  size_sm:  { paddingHorizontal: 14, paddingVertical: 8  },
  size_md:  { paddingHorizontal: 20, paddingVertical: 12 },
  size_lg:  { paddingHorizontal: 28, paddingVertical: 16 },

  variant_primary: { backgroundColor: C.gold },
  variant_ghost:   { backgroundColor: 'transparent' },
  variant_outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.gold },
  variant_danger:  { backgroundColor: '#ef4444' },

  label: { fontWeight: '600', letterSpacing: 0.2 },
  labelSize_sm:  { fontSize: 13 },
  labelSize_md:  { fontSize: 15 },
  labelSize_lg:  { fontSize: 16 },

  labelVariant_primary: { color: C.white },
  labelVariant_ghost:   { color: C.gold },
  labelVariant_outline: { color: C.gold },
  labelVariant_danger:  { color: C.white },
} as Record<string, ViewStyle | TextStyle>);
