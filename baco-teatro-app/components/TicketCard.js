import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function TicketCard({ ticket, onPress, showActions = true, userRole }) {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'DISPONIBLE': return colors.gray;
      case 'STOCK_VENDEDOR': return colors.primary;
      case 'RESERVADO': return colors.warning;
      case 'REPORTADA_VENDIDA': return '#FF6B6B';
      case 'PAGADO': return colors.success;
      case 'USADO': return '#666666';
      default: return colors.gray;
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'STOCK_VENDEDOR': return 'En mi stock';
      case 'REPORTADA_VENDIDA': return 'Reportada vendida';
      default: return estado;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.card}>
        {/* Notches */}
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={[styles.notch, styles.notchRight]} />

        <View style={styles.header}>
          <Text style={styles.code}>{ticket.code}</Text>
          <View style={[styles.badge, { backgroundColor: getEstadoColor(ticket.estado) }]}>
            <Text style={styles.badgeText}>{getEstadoTexto(ticket.estado)}</Text>
          </View>
        </View>

        {ticket.obra && (
          <Text style={styles.obra}>{ticket.obra}</Text>
        )}

        {ticket.comprador_nombre && (
          <View style={styles.row}>
            <Text style={styles.label}>Comprador:</Text>
            <Text style={styles.value}>{ticket.comprador_nombre}</Text>
          </View>
        )}

        {ticket.precio && (
          <View style={styles.row}>
            <Text style={styles.label}>Precio:</Text>
            <Text style={styles.value}>${ticket.precio}</Text>
          </View>
        )}

        {ticket.vendedor_nombre && userRole === 'ADMIN' && (
          <View style={styles.row}>
            <Text style={styles.label}>Vendedor:</Text>
            <Text style={styles.value}>{ticket.vendedor_nombre}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  notch: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: colors.background, // Match screen background
    borderRadius: 10,
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  notchLeft: {
    left: -10,
  },
  notchRight: {
    right: -10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  code: {
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  obra: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
