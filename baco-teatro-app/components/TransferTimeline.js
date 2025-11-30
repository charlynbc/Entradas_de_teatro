import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function TransferTimeline({ events = [] }) {
  if (!events.length) {
    return <Text style={styles.empty}>Aún no hay movimientos</Text>;
  }

  return (
    <View style={styles.container}>
      {events.map((event, index) => (
        <View key={event.id || index} style={styles.row}>
          <View style={styles.dot} />
          <View style={styles.content}>
            <Text style={styles.title}>{event.title}</Text>
            {event.subtitle ? <Text style={styles.subtitle}>{event.subtitle}</Text> : null}
            <Text style={styles.meta}>{new Date(event.date).toLocaleString()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    color: colors.textSoft,
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    color: colors.textSoft,
    fontStyle: 'italic',
  },
});
