import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import colors from '../theme/colors';
import { reserveTicket } from '../api/api';

export default function ReservarScreen({ route, navigation }) {
  const { ticket } = route.params;
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReservar = async () => {
    if (!nombre || !contacto) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const data = await reserveTicket(ticket.code, nombre, contacto);

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert(
        '✅ Ticket Reservado',
        `El ticket ${ticket.code} fue reservado para ${nombre}.\n\nAhora puedes reportar la venta cuando recibas el pago.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error reservando ticket:', error);
      Alert.alert('Error', 'No se pudo reservar el ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketCode}>{ticket.code}</Text>
          <Text style={styles.ticketObra}>{ticket.obra}</Text>
          <Text style={styles.ticketFecha}>
            {new Date(ticket.fecha).toLocaleString('es-AR')}
          </Text>
        </View>

        <Text style={styles.title}>Reservar Ticket</Text>
        <Text style={styles.subtitle}>
          Completa los datos del comprador para reservar este ticket
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre del comprador *</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan Pérez"
            placeholderTextColor={colors.gray}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Contacto (teléfono o email) *</Text>
          <TextInput
            style={styles.input}
            placeholder="+5491122334455 o email@ejemplo.com"
            placeholderTextColor={colors.gray}
            value={contacto}
            onChangeText={setContacto}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.reserveButton, loading && styles.buttonDisabled]}
            onPress={handleReservar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.reserveButtonText}>Reservar Ticket</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ ¿Qué sucede al reservar?</Text>
          <Text style={styles.infoText}>
            • El ticket queda reservado a tu nombre{'\n'}
            • Ya no aparecerá disponible para otros vendedores{'\n'}
            • Puedes reportar la venta cuando recibas el pago{'\n'}
            • Si no se concreta, un admin puede liberarlo
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
  ticketInfo: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  ticketCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  ticketObra: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketFecha: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  reserveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  reserveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});
