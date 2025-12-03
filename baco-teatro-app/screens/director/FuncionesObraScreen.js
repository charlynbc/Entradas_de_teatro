import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listarFunciones, crearFuncion, actualizarFuncion, eliminarFuncion, asignarEntradasAVendedor, obtenerElencoObra } from '../../api';

export default function FuncionesObraScreen({ route, navigation }) {
  const { obra } = route.params;
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [funciones, setFunciones] = useState([]);
  const [elenco, setElenco] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [editandoFuncion, setEditandoFuncion] = useState(null);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null);
  const [procesando, setProcesando] = useState(false);
  
  const [formFuncion, setFormFuncion] = useState({
    fecha: '',
    lugar: '',
    capacidad: '',
    precio_base: ''
  });

  const [formAsignar, setFormAsignar] = useState({
    cedula_vendedor: '',
    cantidad: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [datFunciones, datElenco] = await Promise.all([
        listarFunciones(obra.id),
        obtenerElencoObra(obra.id)
      ]);
      setFunciones(datFunciones);
      setElenco(datElenco);
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

  const abrirModalCrear = () => {
    setEditandoFuncion(null);
    setFormFuncion({ fecha: '', lugar: '', capacidad: '', precio_base: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (funcion) => {
    setEditandoFuncion(funcion);
    setFormFuncion({
      fecha: new Date(funcion.fecha).toISOString().slice(0, 16),
      lugar: funcion.lugar || '',
      capacidad: funcion.capacidad?.toString() || '',
      precio_base: funcion.precio_base?.toString() || ''
    });
    setModalVisible(true);
  };

  const guardarFuncion = async () => {
    if (!formFuncion.fecha) {
      showError('Ingresá fecha y hora');
      return;
    }
    
    const capacidad = parseInt(formFuncion.capacidad);
    const precio = parseFloat(formFuncion.precio_base);
    
    if (isNaN(capacidad) || capacidad < 1) {
      showError('Capacidad inválida');
      return;
    }

    setProcesando(true);
    try {
      const payload = {
        fecha: formFuncion.fecha,
        lugar: formFuncion.lugar || 'Teatro Principal',
        capacidad,
        precio_base: isNaN(precio) ? 0 : precio
      };

      if (editandoFuncion) {
        await actualizarFuncion(editandoFuncion.id, payload);
        showSuccess('✅ Función actualizada');
      } else {
        await crearFuncion(obra.id, payload);
        showSuccess('✅ Función creada exitosamente');
      }
      
      setModalVisible(false);
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al guardar función');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarEliminar = (funcion) => {
    Alert.alert(
      '¿Eliminar Función?',
      `Función del ${formatFecha(funcion.fecha)}. Se eliminarán todas las entradas asociadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => eliminar(funcion.id)
        }
      ]
    );
  };

  const eliminar = async (funcionId) => {
    setProcesando(true);
    try {
      await eliminarFuncion(funcionId);
      showSuccess('✅ Función eliminada');
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al eliminar');
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalAsignar = (funcion) => {
    setFuncionSeleccionada(funcion);
    setFormAsignar({ cedula_vendedor: '', cantidad: '' });
    setModalAsignar(true);
  };

  const asignarEntradas = async () => {
    if (!formAsignar.cedula_vendedor) {
      showError('Seleccioná un vendedor');
      return;
    }
    
    const cantidad = parseInt(formAsignar.cantidad);
    if (isNaN(cantidad) || cantidad < 1) {
      showError('Cantidad inválida');
      return;
    }

    setProcesando(true);
    try {
      await asignarEntradasAVendedor(funcionSeleccionada.id, formAsignar.cedula_vendedor, cantidad);
      showSuccess(`✅ ${cantidad} entrada(s) asignada(s)`);
      setModalAsignar(false);
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al asignar entradas');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#8B0000', '#DC143C', '#8B0000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFD700" />
        </TouchableOpacity>
        
        <Text style={styles.title}>{obra.nombre}</Text>
        <Text style={styles.subtitle}>Gestión de Funciones</Text>
        
        <TouchableOpacity style={styles.addButton} onPress={abrirModalCrear}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.addGradient}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#8B0000" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : funciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank" size={80} color={colors.textMuted} />
          <Text style={styles.emptyText}>No hay funciones programadas</Text>
          <Text style={styles.emptySubtext}>Creá la primera función</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {funciones.map((funcion) => (
            <View key={funcion.id} style={styles.funcionCard}>
              <LinearGradient
                colors={['#1a1a1a', '#2d2d2d']}
                style={styles.cardGradient}
              >
                <View style={styles.funcionHeader}>
                  <MaterialCommunityIcons name="calendar" size={28} color="#FFD700" />
                  <Text style={styles.fechaText}>{formatFecha(funcion.fecha)}</Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>{funcion.lugar || 'Teatro'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="seat" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>{funcion.capacidad} lugares</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="currency-usd" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>${Number(funcion.precio_base || 0).toLocaleString('es-UY')}</Text>
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

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => abrirModalAsignar(funcion)}
                  >
                    <LinearGradient
                      colors={['#4169E1', '#1E90FF']}
                      style={styles.actionGradient}
                    >
                      <MaterialCommunityIcons name="account-arrow-right" size={18} color="#FFF" />
                      <Text style={styles.actionText}>Asignar</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => abrirModalEditar(funcion)}
                  >
                    <LinearGradient
                      colors={['#FFA500', '#FF8C00']}
                      style={styles.actionGradient}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
                      <Text style={styles.actionText}>Editar</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => confirmarEliminar(funcion)}
                  >
                    <LinearGradient
                      colors={['#DC143C', '#8B0000']}
                      style={styles.actionGradient}
                    >
                      <MaterialCommunityIcons name="delete" size={18} color="#FFF" />
                      <Text style={styles.actionText}>Eliminar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal Crear/Editar Función */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editandoFuncion ? '✏️ Editar Función' : '➕ Nueva Función'}
            </Text>
            
            <Text style={styles.label}>Fecha y Hora *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor={colors.textSoft}
              value={formFuncion.fecha}
              onChangeText={(text) => setFormFuncion(prev => ({ ...prev, fecha: text }))}
            />

            <Text style={styles.label}>Lugar</Text>
            <TextInput
              style={styles.input}
              placeholder="Teatro Principal"
              placeholderTextColor={colors.textSoft}
              value={formFuncion.lugar}
              onChangeText={(text) => setFormFuncion(prev => ({ ...prev, lugar: text }))}
            />

            <Text style={styles.label}>Capacidad *</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              placeholderTextColor={colors.textSoft}
              value={formFuncion.capacidad}
              onChangeText={(text) => setFormFuncion(prev => ({ ...prev, capacidad: text }))}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Precio Base</Text>
            <TextInput
              style={styles.input}
              placeholder="500"
              placeholderTextColor={colors.textSoft}
              value={formFuncion.precio_base}
              onChangeText={(text) => setFormFuncion(prev => ({ ...prev, precio_base: text }))}
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
                onPress={guardarFuncion}
                disabled={procesando}
              >
                {procesando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {editandoFuncion ? 'Actualizar' : 'Crear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Asignar Entradas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalAsignar}
        onRequestClose={() => setModalAsignar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎟️ Asignar Entradas</Text>
            
            <Text style={styles.label}>Vendedor *</Text>
            <View style={styles.pickerContainer}>
              {elenco.map(miembro => (
                <TouchableOpacity
                  key={miembro.cedula}
                  style={[
                    styles.vendedorOption,
                    formAsignar.cedula_vendedor === miembro.cedula && styles.vendedorOptionSelected
                  ]}
                  onPress={() => setFormAsignar(prev => ({ ...prev, cedula_vendedor: miembro.cedula }))}
                >
                  <MaterialCommunityIcons 
                    name={formAsignar.cedula_vendedor === miembro.cedula ? 'check-circle' : 'account-circle'} 
                    size={24} 
                    color={formAsignar.cedula_vendedor === miembro.cedula ? colors.secondary : colors.textMuted} 
                  />
                  <Text style={styles.vendedorText}>{miembro.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cantidad de Entradas *</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={colors.textSoft}
              value={formAsignar.cantidad}
              onChangeText={(text) => setFormAsignar(prev => ({ ...prev, cantidad: text }))}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalAsignar(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={asignarEntradas}
                disabled={procesando}
              >
                {procesando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Asignar</Text>
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
  header: {
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
  addButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 10,
  },
  addGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 80,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  funcionCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
  },
  cardGradient: {
    padding: 16,
  },
  funcionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  fechaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    textTransform: 'capitalize',
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
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
    maxHeight: '80%',
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
  pickerContainer: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 16,
    maxHeight: 200,
  },
  vendedorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  vendedorOptionSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  vendedorText: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
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
