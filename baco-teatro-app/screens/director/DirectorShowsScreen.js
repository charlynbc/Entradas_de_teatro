import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import ShowCard from '../../components/ShowCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listDirectorShows, createShow, assignTicketsToActor, deleteProduction, updateShow, deleteShow, addVendorToShow, removeVendorFromShow, getShowCast, listVendors } from '../../api';
import { Ionicons } from '@expo/vector-icons';

const initialShow = { obra: '', fecha: new Date(), lugar: '', capacidad: '', base_price: '' };
const initialAssign = { showId: '', actorId: '', cantidad: '' };

export default function DirectorShowsScreen({ navigation }) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(initialShow);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [editForm, setEditForm] = useState(initialShow);
  
  // Cast management modal states
  const [castModalVisible, setCastModalVisible] = useState(false);
  const [managingShow, setManagingShow] = useState(null);
  const [showCast, setShowCast] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  
  // Date Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listDirectorShows();
      setShows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation]);

  const handleCreateShow = async () => {
    if (!showForm.obra || !showForm.lugar || !showForm.capacidad) {
      showError('Completá obra, lugar y capacidad');
      return;
    }
    setCreating(true);
    try {
      // Format date to string for API
      const fechaStr = showForm.fecha.toISOString();
      
      await createShow({
        obra: showForm.obra,
        fecha: fechaStr,
        lugar: showForm.lugar,
        capacidad: Number(showForm.capacidad),
        base_price: Number(showForm.base_price) || 0,
      });
      setShowForm(initialShow);
      setModalVisible(false);
      load();
      showSuccess('✨ Función creada y tickets generados con éxito');
    } catch (error) {
      showError(error.message || 'No se pudo crear la función');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShow = (show) => {
    Alert.alert(
      '🗑️ Eliminar Obra',
      `¿Estás seguro de eliminar "${show.obra}"? Esto borrará todos los tickets asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduction(show.id);
              load();
              showSuccess('🗑️ Obra eliminada con éxito');
            } catch (error) {
              showError(error.message || 'No se pudo eliminar la obra');
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDate = showForm.fecha;
      // Keep time, change date
      const newDate = new Date(selectedDate);
      newDate.setHours(currentDate.getHours());
      newDate.setMinutes(currentDate.getMinutes());
      setShowForm(prev => ({ ...prev, fecha: newDate }));
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const currentDate = showForm.fecha;
      // Keep date, change time
      const newDate = new Date(currentDate);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setShowForm(prev => ({ ...prev, fecha: newDate }));
    }
  };

  const formatMoney = (value = 0) => `$${Number(value || 0).toLocaleString('es-UY')}`;

  const handleEditShow = (show) => {
    setEditingShow(show);
    setEditForm({
      obra: show.obra || show.nombre,
      fecha: new Date(show.fecha),
      lugar: show.lugar || '',
      capacidad: String(show.capacidad || show.total_tickets || ''),
      base_price: String(show.base_price || show.precio || '')
    });
    setEditModalVisible(true);
  };

  const handleUpdateShow = async () => {
    if (!editForm.obra) {
      showError('El nombre de la obra es obligatorio');
      return;
    }
    setCreating(true);
    try {
      await updateShow(editingShow.id, {
        obra: editForm.obra,
        fecha: editForm.fecha.toISOString(),
        lugar: editForm.lugar,
        capacidad: Number(editForm.capacidad),
        base_price: Number(editForm.base_price)
      });
      setEditModalVisible(false);
      load();
      showSuccess('✅ Obra actualizada exitosamente');
    } catch (error) {
      showError(error.message || 'No se pudo actualizar la obra');
    } finally {
      setCreating(false);
    }
  };

  const handleManageCast = async (show) => {
    setManagingShow(show);
    setCastModalVisible(true);
    try {
      const [cast, vendors] = await Promise.all([
        getShowCast(show.id),
        listVendors()
      ]);
      setShowCast(cast);
      setAvailableVendors(vendors);
    } catch (error) {
      showError('Error cargando datos del elenco');
    }
  };

  const handleAddVendor = async () => {
    if (!selectedVendor) {
      showError('Seleccioná un vendedor');
      return;
    }
    try {
      await addVendorToShow(managingShow.id, selectedVendor);
      const cast = await getShowCast(managingShow.id);
      setShowCast(cast);
      setSelectedVendor('');
      showSuccess('✅ Vendedor agregado al elenco');
    } catch (error) {
      showError(error.message || 'Error agregando vendedor');
    }
  };

  const handleRemoveVendor = async (cedula) => {
    Alert.alert(
      'Remover del elenco',
      '¿Estás seguro de remover este vendedor de la obra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeVendorFromShow(managingShow.id, cedula);
              const cast = await getShowCast(managingShow.id);
              setShowCast(cast);
              showSuccess('✅ Vendedor removido del elenco');
            } catch (error) {
              showError(error.message || 'Error removiendo vendedor');
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>🎭 Funciones</Text>
            <Text style={styles.subtitle}>Gestión de shows y entradas</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B0000', '#DC143C', '#8B0000']}
              style={styles.addButtonGradient}
            >
              <MaterialCommunityIcons name="plus" size={28} color="#FFD700" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <SectionCard title="Funciones creadas" subtitle={`${shows.length} registros`}>
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          shows.map((show) => (
            <View key={show.id} style={styles.showItemContainer}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('DirectorShowDetail', { show })}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <ShowCard
                  show={show}
                  footer={(
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.meta}>Stock actores {show.enStock} /  Vendidas {show.vendidas}</Text>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </View>
                  )}
                />
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('FuncionesObra', { obra: show })}
                  style={[styles.actionButton, styles.functionsButton]}
                >
                  <Ionicons name="calendar-outline" size={20} color="#4169E1" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleManageCast(show)}
                  style={[styles.actionButton, styles.castButton]}
                >
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleEditShow(show)}
                  style={[styles.actionButton, styles.editButton]}
                >
                  <Ionicons name="create-outline" size={20} color={colors.warning} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteShow(show)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Función</Text>
            
            <Text style={styles.label}>Nombre de la obra</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Hamlet"
              placeholderTextColor={colors.textSoft}
              value={showForm.obra}
              onChangeText={(t) => setShowForm(prev => ({ ...prev, obra: t }))}
            />

            {Platform.OS !== 'web' && (
              <>
                <Text style={styles.label}>Fecha y Hora</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
                    <Text style={styles.dateText}>
                      {showForm.fecha.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
                    <Ionicons name="time-outline" size={20} color={colors.secondary} />
                    <Text style={styles.dateText}>
                      {showForm.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {(showDatePicker || showTimePicker) && Platform.OS !== 'web' && (
              <DateTimePicker
                value={showForm.fecha}
                mode={showDatePicker ? 'date' : 'time'}
                is24Hour={false}
                display="default"
                onChange={showDatePicker ? onDateChange : onTimeChange}
              />
            )}

            {Platform.OS === 'web' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Fecha y Hora</Text>
                <View style={styles.webDateContainer}>
                  {/* Fecha */}
                  <View style={styles.pickerGroup}>
                    <Text style={styles.pickerLabel}>Día</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={showForm.fecha.getDate()}
                        onValueChange={(itemValue) => {
                          const newDate = new Date(showForm.fecha);
                          newDate.setDate(itemValue);
                          setShowForm(prev => ({ ...prev, fecha: newDate }));
                        }}
                        style={styles.picker}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <Picker.Item key={d} label={String(d)} value={d} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={[styles.pickerGroup, { flex: 1.5 }]}>
                    <Text style={styles.pickerLabel}>Mes</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={showForm.fecha.getMonth()}
                        onValueChange={(itemValue) => {
                          const newDate = new Date(showForm.fecha);
                          newDate.setMonth(itemValue);
                          setShowForm(prev => ({ ...prev, fecha: newDate }));
                        }}
                        style={styles.picker}
                      >
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                          <Picker.Item key={i} label={m} value={i} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={[styles.pickerGroup, { flex: 1.2 }]}>
                    <Text style={styles.pickerLabel}>Año</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={showForm.fecha.getFullYear()}
                        onValueChange={(itemValue) => {
                          const newDate = new Date(showForm.fecha);
                          newDate.setFullYear(itemValue);
                          setShowForm(prev => ({ ...prev, fecha: newDate }));
                        }}
                        style={styles.picker}
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(y => (
                          <Picker.Item key={y} label={String(y)} value={y} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={[styles.webDateContainer, { marginTop: 10 }]}>
                  {/* Hora */}
                  <View style={styles.pickerGroup}>
                    <Text style={styles.pickerLabel}>Hora</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={showForm.fecha.getHours()}
                        onValueChange={(itemValue) => {
                          const newDate = new Date(showForm.fecha);
                          newDate.setHours(itemValue);
                          setShowForm(prev => ({ ...prev, fecha: newDate }));
                        }}
                        style={styles.picker}
                      >
                        {Array.from({ length: 24 }, (_, i) => i).map(h => (
                          <Picker.Item key={h} label={String(h).padStart(2, '0')} value={h} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <Text style={{ alignSelf: 'flex-end', marginBottom: 12, fontWeight: 'bold', fontSize: 18 }}>:</Text>

                  <View style={styles.pickerGroup}>
                    <Text style={styles.pickerLabel}>Minutos</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={showForm.fecha.getMinutes()}
                        onValueChange={(itemValue) => {
                          const newDate = new Date(showForm.fecha);
                          newDate.setMinutes(itemValue);
                          setShowForm(prev => ({ ...prev, fecha: newDate }));
                        }}
                        style={styles.picker}
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                          <Picker.Item key={m} label={String(m).padStart(2, '0')} value={m} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.label}>Localidad / Sala</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Sala Principal"
              placeholderTextColor={colors.textSoft}
              value={showForm.lugar}
              onChangeText={(t) => setShowForm(prev => ({ ...prev, lugar: t }))}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Capacidad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 200"
                  placeholderTextColor={colors.textSoft}
                  keyboardType="numeric"
                  value={showForm.capacidad}
                  onChangeText={(t) => setShowForm(prev => ({ ...prev, capacidad: t }))}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Precio Base</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 500"
                  placeholderTextColor={colors.textSoft}
                  keyboardType="numeric"
                  value={showForm.base_price}
                  onChangeText={(t) => setShowForm(prev => ({ ...prev, base_price: t }))}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleCreateShow}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text style={styles.saveButtonText}>Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Edición */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Función</Text>
            
            <Text style={styles.label}>Nombre de la obra</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la obra"
              placeholderTextColor={colors.textSoft}
              value={editForm.obra}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, obra: text }))}
            />

            <Text style={styles.label}>Lugar</Text>
            <TextInput
              style={styles.input}
              placeholder="Teatro, auditorio..."
              placeholderTextColor={colors.textSoft}
              value={editForm.lugar}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, lugar: text }))}
            />

            <Text style={styles.label}>Capacidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Cantidad de entradas"
              placeholderTextColor={colors.textSoft}
              value={editForm.capacidad}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, capacidad: text }))}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Precio Base ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="Precio por entrada"
              placeholderTextColor={colors.textSoft}
              value={editForm.base_price}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, base_price: text }))}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleUpdateShow}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>💾 Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Gestión de Elenco */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={castModalVisible}
        onRequestClose={() => setCastModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🎭 Elenco - {managingShow?.obra || managingShow?.nombre}
            </Text>
            
            <Text style={styles.label}>Agregar Vendedor</Text>
            <View style={styles.addVendorRow}>
              <View style={[styles.pickerWrapper, { flex: 1 }]}>
                <Picker
                  selectedValue={selectedVendor}
                  onValueChange={setSelectedVendor}
                  style={styles.picker}
                >
                  <Picker.Item label="Seleccionar vendedor..." value="" />
                  {availableVendors
                    .filter(v => !showCast.find(c => c.cedula === v.cedula))
                    .map(v => (
                      <Picker.Item 
                        key={v.cedula} 
                        label={`${v.nombre || v.name} (${v.cedula})`} 
                        value={v.cedula} 
                      />
                    ))
                  }
                </Picker>
              </View>
              <TouchableOpacity 
                style={styles.addVendorButton} 
                onPress={handleAddVendor}
              >
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>
              Elenco Actual ({showCast.length})
            </Text>
            {showCast.length === 0 ? (
              <Text style={styles.emptyText}>No hay vendedores en el elenco</Text>
            ) : (
              showCast.map((member) => (
                <View key={member.cedula} style={styles.castMemberRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.castMemberName}>{member.name}</Text>
                    <Text style={styles.castMemberCedula}>CI: {member.cedula}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleRemoveVendor(member.cedula)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={28} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { flex: 1 }]} 
                onPress={() => setCastModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Cerrar</Text>
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
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#000',
    opacity: 0.8,
    marginTop: 4,
    fontWeight: '600',
  },
  addButton: {
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  addButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.black,
    fontWeight: '700',
  },
  buttonSecondary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  buttonSecondaryText: {
    color: colors.secondary,
    fontWeight: '700',
  },
  meta: { color: colors.textMuted },
  insightsBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    gap: 8,
  },
  insightsTitle: {
    color: colors.white,
    fontWeight: '700',
  },
  insightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helper: {
    color: colors.textMuted,
    fontSize: 12,
  },
  insightValue: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  topSeller: {
    color: colors.accent,
    fontWeight: '600',
  },
  actorBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  actorName: {
    color: colors.white,
    fontWeight: '600',
  },
  debtText: {
    color: colors.error,
    fontWeight: '700',
  },
  successText: {
    color: colors.success,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: colors.secondary,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  saveButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  dateText: {
    color: colors.text,
  },
  webDateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pickerGroup: {
    flex: 1,
  },
  pickerLabel: {
    color: colors.secondary,
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary, // Borde más visible
    overflow: 'hidden',
  },
  picker: {
    height: 45,
    width: '100%',
    color: '#FFFFFF',
    backgroundColor: colors.surface,
    borderWidth: 0,
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 8,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  webHelper: {
    color: colors.warning,
    fontSize: 10,
    marginBottom: 10,
  },
  showItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 6,
  },
  actionButton: {
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  functionsButton: {
    borderColor: '#4169E1' + '40',
  },
  castButton: {
    borderColor: colors.primary + '40',
  },
  editButton: {
    borderColor: colors.warning + '40',
  },
  deleteButton: {
    borderColor: colors.error + '40',
  },
  addVendorRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addVendorButton: {
    padding: 4,
  },
  castMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  castMemberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  castMemberCedula: {
    color: colors.textMuted,
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});
