import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  dark: '#260B10',
  gold: '#BF8B5E',
  blush: '#D9B89C',
  red: '#733122',
  copper: '#A6523F',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor={COLORS.dark} />
        <View style={styles.content}>
          <Text style={styles.eyebrow}>Est. 2024</Text>
          <Text style={styles.title}>Savora</Text>
          <Text style={styles.subtitle}>Where every meal is a story worth telling</Text>
          <View style={styles.divider} />
          <Text style={styles.body}>
            Reserve your table, explore our menu, and indulge in an unforgettable dining
            experience.
          </Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  eyebrow: {
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 12,
    opacity: 0.7,
  },
  title: {
    fontSize: 72,
    color: COLORS.gold,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.blush,
    fontStyle: 'italic',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.3,
    marginBottom: 24,
  },
  body: {
    fontSize: 14,
    color: COLORS.blush,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 22,
  },
});
