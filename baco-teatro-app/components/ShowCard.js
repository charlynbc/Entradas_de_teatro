import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import colors from '../theme/colors';
import TicketStatusPill from './TicketStatusPill';
import { LinearGradient } from 'expo-linear-gradient';

export default function ShowCard({ show, footer, children }) {
  return (
    <View style={styles.card}>
      {show.foto_url && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: show.foto_url }} 
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', colors.surface + 'CC', colors.surface]}
            style={styles.imageGradient}
          />
        </View>
      )}
      
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{show.obra}</Text>
          <Text style={styles.meta}>{new Date(show.fecha).toLocaleString()}</Text>
          {show.lugar ? <Text style={styles.meta}>{show.lugar}</Text> : null}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{show.capacidad} entradas</Text>
        </View>
      </View>

      {children && <View style={styles.content}>{children}</View>}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    paddingTop: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.accent,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
