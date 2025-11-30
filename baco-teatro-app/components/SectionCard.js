import React from 'react';
import { View, Text, StyleSheet, ViewPropTypes } from 'react-native';
import colors from '../theme/colors';

export default function SectionCard({ title, subtitle, children, action }) {
  return (
    <View style={styles.card}>
      {(title || action) && (
        <View style={styles.header}>
          <View>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action || null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 2,
  },
});
