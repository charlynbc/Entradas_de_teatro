import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { misEntradasVendedor, quitarReserva, reportarVentaEntrada } from '../../api';

export default function MisEntradasScreen() {
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarEntradas();
  }, []);

  const cargarEntradas = async () => {
    setLoading(true);
    try {
      const data = await misEntradasVendedor();
      setEntradas(data);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-UY', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleQuitarReserva = (entrada) => {
    Alert.alert(
      '¿Quitar Reserva?',
      `Esta entrada volverá a estar EN STOCK para ser reservada o vendida.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          style: 'destructive',
          onPress: () => confirmarQuitarReserva(entrada.code)
        }
      ]
    );
  };

  const confirmarQuitarReserva = async (code) => {
    setProcesando(true);
    try {
      await quitarReserva(code);
      showSuccess('✅ Reserva eliminada exitosamente');
      cargarEntradas();
    } catch (error) {
      showError(error.message || 'Error al quitar reserva');
    } finally {
      setProcesando(false);
    }
  };

  const handleReportarVenta = (entrada) => {
    Alert.alert(
      '¿Reportar Venta?',
      `Marcar entrada ${entrada.code} como VENDIDA.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => confirmarVenta(entrada.code)
        }
      ]
    );
  };

  const confirmarVenta = async (code) => {
    setProcesando(true);
    try {
      await reportarVentaEntrada(code);
      showSuccess('✅ Venta reportada exitosamente');
      cargarEntradas();
    } catch (error) {
      showError(error.message || 'Error al reportar venta');
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'DISPONIBLE': return '#808080';
      case 'EN_STOCK': return '#4169E1';
      case 'RESERVADA': return '#FFA500';
      case 'VENDIDA': return '#32CD32';
      case 'PAGADA': return '#FFD700';
      case 'USADA': return '#8B0000';
      default: return colors.textMuted;
    }
  };

  const getEstadoIcono = (estado) => {
    switch (estado) {
      case 'DISPONIBLE': return 'ticket-outline';
      case 'EN_STOCK': return 'wallet';
      case 'RESERVADA': return 'clock-time-eight';
      case 'VENDIDA': return 'cash';
      case 'PAGADA': return 'check-circle';
      case 'USADA': return 'check-all';
      default: return 'ticket';
    }
  };

  // Agrupar por obra
  const agruparPorObra = () => {
    const grupos = {};
    entradas.forEach(entrada => {
      const obraKey = entrada.obra_nombre || 'Sin Obra';
      if (!grupos[obraKey]) {
        grupos[obraKey] = {
          obra: obraKey,
          entradas: []
        };
      }
      grupos[obraKey].entradas.push(entrada);
    });
    return Object.values(grupos);
  };

  const grupos = agruparPorObra();

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#8B0000', '#DC143C', '#8B0000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <MaterialCommunityIcons name="ticket-account" size={48} color="#FFD700" />
        <Text style={styles.title}>Mis Entradas</Text>
        <Text style={styles.subtitle}>
          {entradas.length} entrada{entradas.length !== 1 ? 's' : ''} total{entradas.length !== 1 ? 'es' : ''}
        </Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : entradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="ticket-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyText}>No tenés entradas asignadas</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {grupos.map((grupo, index) => (
            <View key={index} style={styles.obraGroup}>
              <Text style={styles.obraTitle}>🎭 {grupo.obra}</Text>
              
              {grupo.entradas.map((entrada) => (
                <View key={entrada.code} style={styles.entradaCard}>
                  <LinearGradient
                    colors={['#1a1a1a', '#2d2d2d']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.codigoContainer}>
                        <MaterialCommunityIcons name="barcode" size={20} color="#FFD700" />
                        <Text style={styles.codigoText}>{entrada.code}</Text>
                      </View>
                      <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(entrada.estado) }]}>
                        <MaterialCommunityIcons 
                          name={getEstadoIcono(entrada.estado)} 
                          size={16} 
                          color="#FFF" 
                        />
                        <Text style={styles.estadoText}>{entrada.estado}</Text>
                      </View>
                    </View>

                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                        <Text style={styles.infoText}>
                          {formatFecha(entrada.funcion_fecha)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary} />
                        <Text style={styles.infoText}>
                          {entrada.funcion_lugar || 'Teatro Principal'}
                        </Text>
                      </View>
                      {entrada.comprador_nombre && (
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
                          <Text style={styles.infoText}>
                            {entrada.comprador_nombre}
                          </Text>
                        </View>
                      )}
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="cash" size={18} color={colors.primary} />
                        <Text style={styles.infoText}>
                          ${Number(entrada.precio || 0).toLocaleString('es-UY')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      {entrada.estado === 'RESERVADA' && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleQuitarReserva(entrada)}
                          disabled={procesando}
                        >
                          <LinearGradient
                            colors={['#FFA500', '#FF8C00']}
                            style={styles.buttonGradient}
                          >
                            <MaterialCommunityIcons name="close-circle" size={20} color="#FFF" />
                            <Text style={styles.buttonText}>Quitar Reserva</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      
                      {(entrada.estado === 'EN_STOCK' || entrada.estado === 'RESERVADA') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleReportarVenta(entrada)}
                          disabled={procesando}
                        >
                          <LinearGradient
                            colors={['#32CD32', '#228B22']}
                            style={styles.buttonGradient}
                          >
                            <MaterialCommunityIcons name="cash-check" size={20} color="#FFF" />
                            <Text style={styles.buttonText}>Reportar Venta</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type}
        onHide={hideToast}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFD700',
    opacity: 0.8,
    marginTop: 5,
  },
  content: {
    marginTop: 20,
  },
  loader: {
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 20,
  },
  obraGroup: {
    marginBottom: 30,
  },
  obraTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    paddingLeft: 4,
  },
  entradaCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  codigoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codigoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  infoSection: {
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
