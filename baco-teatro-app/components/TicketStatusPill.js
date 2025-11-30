import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const STATUS_COPY = {
  DISPONIBLE: 'Disponible',
  STOCK_VENDEDOR: 'No vendida',
  RESERVADO: 'Reservada',
  REPORTADA_VENDIDA: 'Vendida',
  PAGADO: 'Pagada',
  USADO: 'Usada',
  TRANSFERIDA: 'Transferida',
};

const STATUS_COLOR = {
  DISPONIBLE: colors.states.disponible,
  STOCK_VENDEDOR: colors.secondary,
  RESERVADO: colors.states.reservada,
  REPORTADA_VENDIDA: colors.states.vendida,
  PAGADO: colors.states.pagada,
  USADO: colors.states.usada,
  TRANSFERIDA: colors.states.transferida,
};

export default function TicketStatusPill({ estado }) {
  const label = STATUS_COPY[estado] || estado;
  const backgroundColor = STATUS_COLOR[estado] || colors.gray;

  return (
    <View style={[styles.pill, { backgroundColor }]}> 
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 12,
  },
});
