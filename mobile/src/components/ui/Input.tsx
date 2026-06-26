import React, { useState } from 'react';
import {
  TextInput, View, Text, TouchableOpacity, StyleSheet,
  type TextInputProps,
} from 'react-native';
import { C } from '../../lib/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  dark?: boolean;
}

export function Input({ label, error, left, right, dark = false, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={S.wrapper}>
      {label && (
        <Text style={[S.label, dark && S.labelDark]}>{label}</Text>
      )}
      <View style={[
        S.row,
        dark ? S.rowDark : S.rowLight,
        focused && (dark ? S.rowFocusDark : S.rowFocusLight),
        !!error && S.rowError,
      ]}>
        {left && <View style={S.icon}>{left}</View>}
        <TextInput
          style={[S.input, dark && S.inputDark, style]}
          placeholderTextColor={dark ? 'rgba(253,248,243,0.35)' : C.subtle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {right && <View style={S.icon}>{right}</View>}
      </View>
      {error && <Text style={S.error}>{error}</Text>}
    </View>
  );
}

const S = StyleSheet.create({
  wrapper: { gap: 6 },
  label:   { fontSize: 13, fontWeight: '500', color: C.charcoal, letterSpacing: 0.5 },
  labelDark: { color: C.goldLight },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  rowLight:      { backgroundColor: '#fff', borderColor: C.border },
  rowDark:       { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(191,139,94,0.2)' },
  rowFocusLight: { borderColor: C.gold },
  rowFocusDark:  { borderColor: C.gold },
  rowError:      { borderColor: C.error },

  input: { flex: 1, fontSize: 15, color: C.charcoal, fontWeight: '400' },
  inputDark: { color: C.cream },

  icon:  { marginRight: 10 },
  error: { fontSize: 12, color: C.error, marginTop: 2 },
});
