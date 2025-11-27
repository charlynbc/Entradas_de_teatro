import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { searchTickets, markTicketPaid } from '../services/api';

export default function AdminCobrarScreen() {
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Ingresa un código de ticket o nombre de comprador');
      return;
    }

    setLoading(true);
    try {
      const results = await searchTickets(query);
      setTickets(results);
      if (results.length === 0) {
        Alert.alert('Sin resultados', 'No se encontraron tickets con ese criterio');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarPagado = async (ticket) => {
    if (ticket.estado !== 'RESERVADO') {
      Alert.alert(
        'No se puede cobrar',
        `Este ticket está en estado ${ticket.estado}. Solo se pueden cobrar tickets RESERVADOS.`
      );
      return;
    }

    Alert.alert(
      'Confirmar Pago',
      `¿Confirmas que ${ticket.nombreComprador} pagó el ticket ${ticket.codigo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cobrado',
          onPress: async () => {
            try {
              await markTicketPaid(ticket.codigo);
              Alert.alert('✅ Pago Confirmado', 'El ticket ahora está marcado como PAGADO');
              handleBuscar(); // Refrescar resultados
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'DISPONIBLE':
        return '#9E9E9E';
      case 'STOCK_VENDEDOR':
        return '#FF9800';
      case 'RESERVADO':
        return '#2196F3';
      case 'PAGADO':
        return '#4CAF50';
      case 'USADO':
        return '#607D8B';
      default:
        return '#000';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>💰</Text>
          <Text style={styles.title}>Cobrar Tickets</Text>
          <Text style={styles.subtitle}>
            Busca y marca tickets reservados como pagados
          </Text>
        </View>

        <View style={styles.searchSection}>
          <TextInput
            style={styles.input}
            placeholder="Código de ticket o nombre del comprador"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.buttonDisabled]}
            onPress={handleBuscar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>🔍 Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {tickets.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {tickets.length} resultado{tickets.length !== 1 && 's'}
            </Text>
            {tickets.map((ticket) => (
              <View key={ticket.codigo} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketCode}>{ticket.codigo}</Text>
                  <View
                    style={[
                      styles.estadoBadge,
                      { backgroundColor: getEstadoColor(ticket.estado) },
                    ]}
                  >
                    <Text style={styles.estadoText}>{ticket.estado}</Text>
                  </View>
                </View>

                <Text style={styles.ticketShow}>{ticket.tituloShow}</Text>
                <Text style={styles.ticketFecha}>
                  📅 {ticket.fechaShow} - {ticket.horaShow}
                </Text>

                {ticket.nombreComprador && (
                  <View style={styles.compradorSection}>
                    <Text style={styles.compradorLabel}>Comprador:</Text>
                    <Text style={styles.compradorNombre}>
                      {ticket.nombreComprador}
                    </Text>
                    {ticket.emailComprador && (
                      <Text style={styles.compradorEmail}>
                        {ticket.emailComprador}
                      </Text>
                    )}
                  </View>
                )}

                {ticket.estado === 'RESERVADO' && (
                  <TouchableOpacity
                    style={styles.pagarButton}
                    onPress={() => handleMarcarPagado(ticket)}
                  >
                    <Text style={styles.pagarButtonText}>
                      ✅ Marcar como Pagado
                    </Text>
                  </TouchableOpacity>
                )}

                {ticket.estado === 'PAGADO' && (
                  <View style={styles.pagadoInfo}>
                    <Text style={styles.pagadoText}>
                      ✅ Ya está pagado - Listo para validar en puerta
                    </Text>
                  </View>
                )}

                {ticket.estado !== 'RESERVADO' && ticket.estado !== 'PAGADO' && (
                  <View style={styles.noAccionInfo}>
                    <Text style={styles.noAccionText}>
                      No se puede cobrar en estado {ticket.estado}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Cómo funciona</Text>
          <Text style={styles.infoText}>
            1. Busca por código de ticket (Ej: T-ABC12345)
          </Text>
          <Text style={styles.infoText}>
            2. O busca por nombre del comprador
          </Text>
          <Text style={styles.infoText}>
            3. Solo puedes marcar como pagados los tickets RESERVADOS
          </Text>
          <Text style={styles.infoText}>
            4. Una vez pagado, el ticket puede ser validado en puerta
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
    padding: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketShow: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  ticketFecha: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  compradorSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  compradorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  compradorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  compradorEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pagarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  pagarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagadoInfo: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  pagadoText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  noAccionInfo: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noAccionText: {
    color: '#E65100',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
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
    marginBottom: 4,
  },
});
