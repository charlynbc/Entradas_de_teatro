import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../theme/colors';

export default function StatCard({ label, value, helper, gradient = colors.gradientPrimary }) {
  return (
    <LinearGradient colors={gradient} style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    minWidth: 140,
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  helper: {
    marginTop: 4,
    color: colors.text,
    opacity: 0.8,
  },
});
