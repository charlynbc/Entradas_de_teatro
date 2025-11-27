import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import colors from '../theme/colors';
import { reportTicketSold } from '../api/api';

export default function ReportarVentaScreen({ route, navigation }) {
  const { ticket } = route.params;
  const [loading, setLoading] = useState(false);

  const handleReportar = () => {
    Alert.alert(
      'Confirmar venta',
      `¿Confirmas que recibiste el pago de ${ticket.comprador_nombre}?\n\nEsta acción reportará la venta al administrador.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, reportar',
          style: 'default',
          onPress: confirmarReporte,
        },
      ]
    );
  };

  const confirmarReporte = async () => {
    setLoading(true);
    try {
      const data = await reportTicketSold(ticket.code);

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert(
        '✅ Venta Reportada',
        'La venta fue reportada exitosamente.\n\nEl administrador debe aprobar el pago para que el ticket quede confirmado.',
        [
          {
            text: 'Ver QR',
            onPress: () =>
              navigation.replace('TicketQR', { ticket: data }),
          },
          {
            text: 'Volver',
            onPress: () => navigation.navigate('VendedorHome'),
          },
        ]
      );
    } catch (error) {
      console.error('Error reportando venta:', error);
      Alert.alert('Error', 'No se pudo reportar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.ticketCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RESERVADO</Text>
          </View>
          <Text style={styles.ticketCode}>{ticket.code}</Text>
          <Text style={styles.ticketObra}>{ticket.obra}</Text>
          <Text style={styles.ticketFecha}>
            {new Date(ticket.fecha).toLocaleString('es-AR')}
          </Text>
        </View>

        <View style={styles.compradorCard}>
          <Text style={styles.compradorTitle}>Datos del comprador</Text>
          <View style={styles.compradorRow}>
            <Text style={styles.compradorLabel}>Nombre:</Text>
            <Text style={styles.compradorValue}>{ticket.comprador_nombre}</Text>
          </View>
          <View style={styles.compradorRow}>
            <Text style={styles.compradorLabel}>Contacto:</Text>
            <Text style={styles.compradorValue}>{ticket.comprador_contacto}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Reportar venta</Text>
          <Text style={styles.sectionText}>
            Cuando recibas el pago del comprador, reporta la venta al administrador.
            {'\n\n'}
            El administrador aprobará el pago y el ticket quedará confirmado.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.reportButton, loading && styles.buttonDisabled]}
          onPress={handleReportar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.reportButtonEmoji}>💸</Text>
              <Text style={styles.reportButtonText}>
                Recibí el pago - Reportar venta
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Importante</Text>
          <Text style={styles.warningText}>
            • Solo reporta la venta cuando hayas recibido el pago{'\n'}
            • El ticket quedará en estado "Reportada vendida"{'\n'}
            • Esperarás la aprobación del administrador{'\n'}
            • Una vez aprobado, el comprador podrá ver su QR
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  ticketObra: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketFecha: {
    fontSize: 14,
    color: colors.gray,
  },
  compradorCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  compradorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  compradorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  compradorLabel: {
    fontSize: 14,
    color: colors.gray,
    width: 80,
  },
  compradorValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  reportButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  reportButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  reportButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
});
