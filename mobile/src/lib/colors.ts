import { Platform } from 'react-native';

export const C = {
  primary:       '#260B10',
  primaryLight:  '#3d1219',
  gold:          '#BF8B5E',
  goldLight:     '#D9B89C',
  goldDark:      '#a67748',
  cream:         '#FDF8F3',
  charcoal:      '#1a1a1a',
  border:        'rgba(26,26,26,0.08)',
  muted:         'rgba(26,26,26,0.4)',
  subtle:        'rgba(26,26,26,0.25)',
  overlay:       'rgba(38,11,16,0.65)',
  success:       '#10b981',
  error:         '#ef4444',
  warning:       '#f59e0b',
  info:          '#3b82f6',
  white:         '#FFFFFF',
  card:          '#FFFFFF',
};

export const SHADOW = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
  }),
};

export const FONT = {
  display: Platform.select({ ios: 'Georgia', default: 'serif' }),
  displayBold: Platform.select({ ios: 'Georgia', default: 'serif' }),
  body: 'System',
  mono: Platform.select({ ios: 'Courier', default: 'monospace' }),
};
