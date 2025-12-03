import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listarFunciones, crearReserva } from '../../api';

export default function FuncionesPublicScreen({ route, navigation }) {
  const { obra } = route.params;
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [funciones, setFunciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null);
  const [reservando, setReservando] = useState(false);
  
  const [formReserva, setFormReserva] = useState({
    nombre: '',
    contacto: '',
    cantidad: '1'
  });

  useEffect(() => {
    cargarFunciones();
  }, []);

  const cargarFunciones = async () => {
    setLoading(true);
    try {
      const data = await listarFunciones(obra.id);
      setFunciones(data);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReservar = (funcion) => {
    setFuncionSeleccionada(funcion);
    setFormReserva({ nombre: '', contacto: '', cantidad: '1' });
    setModalVisible(true);
  };

  const confirmarReserva = async () => {
    if (!formReserva.nombre.trim()) {
      showError('Ingresá tu nombre');
      return;
    }
    
    const cantidad = parseInt(formReserva.cantidad);
    if (isNaN(cantidad) || cantidad < 1) {
      showError('Cantidad inválida');
      return;
    }

    setReservando(true);
    try {
      await crearReserva(
        funcionSeleccionada.id,
        formReserva.nombre.trim(),
        formReserva.contacto.trim(),
        cantidad
      );
      
      setModalVisible(false);
      showSuccess(`✅ ${cantidad} entrada(s) reservada(s) exitosamente`);
      cargarFunciones();
    } catch (error) {
      showError(error.message || 'Error al reservar');
    } finally {
      setReservando(false);
    }
  };

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#8B0000', '#DC143C', '#8B0000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFD700" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>{obra.nombre}</Text>
          <Text style={styles.subtitle}>Funciones disponibles</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : funciones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-remove" size={80} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay funciones programadas</Text>
          </View>
        ) : (
          funciones.map((funcion) => (
            <View key={funcion.id} style={styles.funcionCard}>
              <LinearGradient
                colors={['#1a1a1a', '#2d2d2d']}
                style={styles.cardGradient}
              >
                <View style={styles.funcionHeader}>
                  <View style={styles.fechaContainer}>
                    <MaterialCommunityIcons name="calendar" size={24} color="#FFD700" />
                    <Text style={styles.fechaText}>{formatFecha(funcion.fecha)}</Text>
                  </View>
                </View>

                <View style={styles.funcionInfo}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>{funcion.lugar || 'Teatro Principal'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="currency-usd" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>
                      ${Number(funcion.precio_base || 0).toLocaleString('es-UY')}
                    </Text>
                  </View>
                </View>

                <View style={styles.estadisticas}>
                  <View style={styles.estadistica}>
                    <Text style={styles.estadisticaNumero}>{funcion.disponibles || 0}</Text>
                    <Text style={styles.estadisticaLabel}>Disponibles</Text>
                  </View>
                  <View style={styles.estadistica}>
                    <Text style={styles.estadisticaNumero}>{funcion.reservadas || 0}</Text>
                    <Text style={styles.estadisticaLabel}>Reservadas</Text>
                  </View>
                  <View style={styles.estadistica}>
                    <Text style={styles.estadisticaNumero}>{funcion.vendidas || 0}</Text>
                    <Text style={styles.estadisticaLabel}>Vendidas</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.reservarButton,
                    (funcion.disponibles || 0) === 0 && styles.reservarButtonDisabled
                  ]}
                  onPress={() => handleReservar(funcion)}
                  disabled={(funcion.disponibles || 0) === 0}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={(funcion.disponibles || 0) > 0 
                      ? ['#FFD700', '#FFA500'] 
                      : ['#666', '#888']}
                    style={styles.reservarGradient}
                  >
                    <MaterialCommunityIcons 
                      name="ticket" 
                      size={24} 
                      color={(funcion.disponibles || 0) > 0 ? '#8B0000' : '#fff'} 
                    />
                    <Text style={[
                      styles.reservarText,
                      (funcion.disponibles || 0) === 0 && styles.reservarTextDisabled
                    ]}>
                      {(funcion.disponibles || 0) > 0 ? 'Reservar' : 'Agotado'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de Reserva */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎟️ Reservar Entradas</Text>
            
            <Text style={styles.label}>Tu nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor={colors.textSoft}
              value={formReserva.nombre}
              onChangeText={(text) => setFormReserva(prev => ({ ...prev, nombre: text }))}
            />

            <Text style={styles.label}>Contacto (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Teléfono o email"
              placeholderTextColor={colors.textSoft}
              value={formReserva.contacto}
              onChangeText={(text) => setFormReserva(prev => ({ ...prev, contacto: text }))}
            />

            <Text style={styles.label}>Cantidad de entradas</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor={colors.textSoft}
              value={formReserva.cantidad}
              onChangeText={(text) => setFormReserva(prev => ({ ...prev, cantidad: text }))}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmarReserva}
                disabled={reservando}
              >
                {reservando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>✓ Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  headerGradient: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 10,
  },
  headerContent: {
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFD700',
    opacity: 0.8,
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
  funcionCard: {
    marginBottom: 20,
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
  funcionHeader: {
    marginBottom: 16,
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fechaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    textTransform: 'capitalize',
    flex: 1,
  },
  funcionInfo: {
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
  },
  estadisticas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
  },
  estadistica: {
    alignItems: 'center',
  },
  estadisticaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  estadisticaLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  reservarButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  reservarButtonDisabled: {
    opacity: 0.6,
  },
  reservarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  reservarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  reservarTextDisabled: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: colors.secondary,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    color: colors.text,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
