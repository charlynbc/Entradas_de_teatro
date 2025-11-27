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
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  obra: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: colors.gray,
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});
