import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { getVendedorTickets, transferTicket, getVendedores } from '../services/api';
import { Picker } from '@react-native-picker/picker';

export default function VendedorMisTicketsScreen() {
  const { user } = useUser();
  const [tickets, setTickets] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transferenciasAbiertas, setTransferenciasAbiertas] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [ticketsData, vendedoresData] = await Promise.all([
        getVendedorTickets(user.id),
        getVendedores(),
      ]);
      setTickets(ticketsData);
      setVendedores(vendedoresData.filter((v) => v.id !== user.id));
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const toggleTransferencia = (codigo) => {
    setTransferenciasAbiertas({
      ...transferenciasAbiertas,
      [codigo]: !transferenciasAbiertas[codigo],
    });
  };

  const handleTransferir = async (ticket, nuevoVendedorId) => {
    if (!nuevoVendedorId) {
      Alert.alert('Error', 'Selecciona un vendedor');
      return;
    }

    const vendedor = vendedores.find((v) => v.id === parseInt(nuevoVendedorId));
    
    Alert.alert(
      'Confirmar Transferencia',
      `¿Transferir ${ticket.codigo} a ${vendedor.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferir',
          onPress: async () => {
            try {
              await transferTicket(ticket.codigo, nuevoVendedorId);
              Alert.alert('✅ Transferido', `Ticket transferido a ${vendedor.nombre}`);
              setTransferenciasAbiertas({
                ...transferenciasAbiertas,
                [ticket.codigo]: false,
              });
              cargarDatos();
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
      case 'STOCK_VENDEDOR':
        return '#FF9800';
      case 'RESERVADO':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const agruparPorShow = () => {
    const grupos = {};
    tickets.forEach((ticket) => {
      const key = `${ticket.tituloShow} - ${ticket.fechaShow}`;
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

  const grupos = agruparPorShow();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>🎟️</Text>
          <Text style={styles.title}>Mis Tickets</Text>
          <Text style={styles.subtitle}>
            {tickets.length} ticket{tickets.length !== 1 && 's'} en tu inventario
          </Text>
        </View>

        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No tienes tickets asignados</Text>
            <Text style={styles.emptyText}>
              Espera a que un administrador te asigne tickets para vender
            </Text>
          </View>
        ) : (
          grupos.map((grupo, idx) => (
            <View key={idx} style={styles.showGroup}>
              <View style={styles.showHeader}>
                <Text style={styles.showTitle}>{grupo.show}</Text>
                <Text style={styles.showFecha}>
                  📅 {grupo.fecha} - {grupo.hora}
                </Text>
                <Text style={styles.showCount}>
                  {grupo.tickets.length} ticket{grupo.tickets.length !== 1 && 's'}
                </Text>
              </View>

              {grupo.tickets.map((ticket) => (
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

                  {ticket.nombreComprador && (
                    <View style={styles.compradorSection}>
                      <Text style={styles.compradorLabel}>Reservado para:</Text>
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

                  {ticket.estado === 'STOCK_VENDEDOR' && (
                    <View style={styles.accionesSection}>
                      {!transferenciasAbiertas[ticket.codigo] ? (
                        <TouchableOpacity
                          style={styles.transferButton}
                          onPress={() => toggleTransferencia(ticket.codigo)}
                        >
                          <Text style={styles.transferButtonText}>
                            🔄 Transferir a otro vendedor
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.transferForm}>
                          <Text style={styles.transferLabel}>
                            Transferir a:
                          </Text>
                          <Picker
                            selectedValue=""
                            onValueChange={(value) =>
                              handleTransferir(ticket, value)
                            }
                            style={styles.picker}
                          >
                            <Picker.Item label="Selecciona vendedor..." value="" />
                            {vendedores.map((v) => (
                              <Picker.Item
                                key={v.id}
                                label={v.nombre}
                                value={v.id.toString()}
                              />
                            ))}
                          </Picker>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => toggleTransferencia(ticket.codigo)}
                          >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {ticket.estado === 'RESERVADO' && (
                    <View style={styles.reservadoInfo}>
                      <Text style={styles.reservadoText}>
                        ⏳ Esperando que el admin cobre este ticket
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Estados</Text>
          <View style={styles.infoRow}>
            <View style={[styles.miniEstado, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.infoText}>
              STOCK_VENDEDOR: Puedes reservarlo o transferirlo
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.miniEstado, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.infoText}>
              RESERVADO: Esperando que admin lo cobre
            </Text>
          </View>
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
  showGroup: {
    marginBottom: 24,
  },
  showHeader: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  showTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  showFecha: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  showCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  compradorSection: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  compradorLabel: {
    fontSize: 12,
    color: '#1565C0',
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
  accionesSection: {
    marginTop: 8,
  },
  transferButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  transferButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  transferForm: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  transferLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reservadoInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  reservadoText: {
    color: '#1565C0',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniEstado: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
});
