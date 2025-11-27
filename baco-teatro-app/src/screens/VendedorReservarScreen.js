import React, { useState, useEffect } from 'react';
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
import { useUser } from '../context/UserContext';
import { getVendedorTickets, reserveTicket } from '../services/api';

export default function VendedorReservarScreen() {
  const { user } = useUser();
  const [tickets, setTickets] = useState([]);
  const [ticketsDisponibles, setTicketsDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [nombreComprador, setNombreComprador] = useState('');
  const [emailComprador, setEmailComprador] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarTickets();
  }, []);

  const cargarTickets = async () => {
    try {
      const data = await getVendedorTickets(user.id);
      setTickets(data);
      const disponibles = data.filter((t) => t.estado === 'STOCK_VENDEDOR');
      setTicketsDisponibles(disponibles);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleReservar = async () => {
    if (!selectedTicket) {
      Alert.alert('Error', 'Selecciona un ticket');
      return;
    }

    if (!nombreComprador.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del comprador');
      return;
    }

    setSubmitting(true);
    try {
      await reserveTicket(
        selectedTicket.codigo,
        nombreComprador.trim(),
        emailComprador.trim() || undefined
      );

      Alert.alert(
        '✅ Ticket Reservado',
        `El ticket ${selectedTicket.codigo} fue reservado para ${nombreComprador}.\n\nAhora debe ir a pagar con un administrador.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedTicket(null);
              setNombreComprador('');
              setEmailComprador('');
              cargarTickets();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const agruparPorShow = (tickets) => {
    const grupos = {};
    tickets.forEach((ticket) => {
      const key = `${ticket.tituloShow}|${ticket.fechaShow}`;
      if (!grupos[key]) {
        grupos[key] = {
          show: ticket.tituloShow,
          fecha: ticket.fechaShow,
          hora: ticket.horaShow,
          tickets: [],
        };
      }
      grupos[key].tickets.push(ticket);
    });
    return Object.values(grupos);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const grupos = agruparPorShow(ticketsDisponibles);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>Reservar Ticket</Text>
          <Text style={styles.subtitle}>
            Reserva un ticket para un comprador
          </Text>
        </View>

        {ticketsDisponibles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No tienes tickets disponibles</Text>
            <Text style={styles.emptyText}>
              Todos tus tickets ya están reservados o no tienes tickets asignados
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Selecciona un ticket</Text>
              {grupos.map((grupo, idx) => (
                <View key={idx} style={styles.showGroup}>
                  <Text style={styles.showTitle}>{grupo.show}</Text>
                  <Text style={styles.showFecha}>
                    📅 {grupo.fecha} - {grupo.hora}
                  </Text>
                  <View style={styles.ticketsGrid}>
                    {grupo.tickets.map((ticket) => (
                      <TouchableOpacity
                        key={ticket.codigo}
                        style={[
                          styles.ticketChip,
                          selectedTicket?.codigo === ticket.codigo &&
                            styles.ticketChipSelected,
                        ]}
                        onPress={() => handleSeleccionarTicket(ticket)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.ticketChipText,
                            selectedTicket?.codigo === ticket.codigo &&
                              styles.ticketChipTextSelected,
                          ]}
                        >
                          {ticket.codigo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {selectedTicket && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Datos del comprador</Text>
                <View style={styles.selectedTicketInfo}>
                  <Text style={styles.selectedLabel}>Ticket seleccionado:</Text>
                  <Text style={styles.selectedCode}>{selectedTicket.codigo}</Text>
                  <Text style={styles.selectedShow}>
                    {selectedTicket.tituloShow}
                  </Text>
                </View>

                <View style={styles.form}>
                  <Text style={styles.label}>
                    Nombre del comprador <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Juan Pérez"
                    value={nombreComprador}
                    onChangeText={setNombreComprador}
                    autoCapitalize="words"
                  />

                  <Text style={styles.label}>Email (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: juan@email.com"
                    value={emailComprador}
                    onChangeText={setEmailComprador}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={[
                      styles.reservarButton,
                      (!nombreComprador.trim() || submitting) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleReservar}
                    disabled={!nombreComprador.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.reservarButtonText}>
                        Reservar Ticket
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Proceso de Reserva</Text>
              <Text style={styles.infoText}>
                1. Selecciona uno de tus tickets disponibles
              </Text>
              <Text style={styles.infoText}>
                2. Ingresa el nombre de quien lo va a comprar
              </Text>
              <Text style={styles.infoText}>
                3. El ticket pasa a estado RESERVADO
              </Text>
              <Text style={styles.infoText}>
                4. El comprador debe ir con un admin para pagar
              </Text>
              <Text style={styles.infoText}>
                5. Una vez pagado, puede entrar al show
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  showGroup: {
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
  showTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  showFecha: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  ticketsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ticketChip: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ticketChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ticketChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  ticketChipTextSelected: {
    color: '#fff',
  },
  selectedTicketInfo: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
  },
  selectedCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  selectedShow: {
    fontSize: 16,
    color: '#fff',
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  reservarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  reservarButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 4,
  },
});
