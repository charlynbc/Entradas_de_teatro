import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import ShowCard from '../../components/ShowCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listDirectorShows, deleteProduction, getSession } from '../../api';
import { Ionicons } from '@expo/vector-icons';

export default function DirectorShowsScreen({ navigation }) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soloMisFunciones, setSoloMisFunciones] = useState(false);

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

  const funcionesFiltradas = shows.filter(show => {
    if (!soloMisFunciones) return true;
    const currentUser = getSession().user;
    return show.director_cedula === currentUser?.id;
  });

  const handleDeleteShow = async (show) => {
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(`🗑️ Eliminar Obra\n\n¿Estás seguro de eliminar "${show.obra}"? Esto borrará todos los tickets asociados.`)
      : await new Promise((resolve) => {
          Alert.alert(
            '🗑️ Eliminar Obra',
            `¿Estás seguro de eliminar "${show.obra}"? Esto borrará todos los tickets asociados.`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
    
    if (!confirmed) return;
    
    try {
      await deleteProduction(show.id);
      load();
      showSuccess('🗑️ Función eliminada con éxito');
    } catch (error) {
      showError(error.message || 'No se pudo eliminar la obra');
    }
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

  return (
    <ScreenContainer>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🎭 Funciones del Teatro</Text>
            <Text style={styles.subtitle}>Todas las funciones programadas</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filtro Solo Mis Funciones */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Solo mis funciones</Text>
        <Switch
          value={soloMisFunciones}
          onValueChange={setSoloMisFunciones}
          trackColor={{ false: colors.textMuted, true: colors.secondary }}
          thumbColor={soloMisFunciones ? colors.primary : colors.text}
        />
      </View>

      {/* Lista de Funciones */}
      <View style={styles.funcionesList}>
        {loading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : funcionesFiltradas.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="ticket-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {soloMisFunciones ? 'No tienes funciones creadas' : 'No hay funciones en el teatro'}
            </Text>
          </View>
        ) : (
          funcionesFiltradas.map((show) => (
            <View key={show.id} style={styles.showItemContainer}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('DirectorShowDetail', { show })}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <ShowCard
                  show={show}
                  footer={(
                    <View>
                      {show.grupo_nombre && (
                        <TouchableOpacity
                          style={styles.grupoLink}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (show.grupo_id) {
                              navigation.navigate('GrupoDetail', { grupoId: show.grupo_id });
                            }
                          }}
                        >
                          <MaterialCommunityIcons name="drama-masks" size={16} color={colors.secondary} />
                          <Text style={styles.grupoNombre}>{show.grupo_nombre}</Text>
                          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type}
        onHide={hideToast}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.Create({
  headerGradient: {
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

            <Text style={styles.label}>Foto de la Función</Text>
            <TouchableOpacity 
              style={styles.fotoButton}
              onPress={handleSelectFoto}
            >
              {showForm.foto_url ? (
                <View style={styles.fotoPreviewContainer}>
                  <Image source={{ uri: showForm.foto_url }} style={styles.fotoPreview} />
                  <Text style={styles.fotoButtonText}>Cambiar foto</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-plus" size={32} color={colors.secondary} />
                  <Text style={styles.fotoButtonText}>Seleccionar foto (opcional)</Text>
                </>
              )}
            </TouchableOpacity>

            {obraIdFromRoute && (
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => {
                  setCopiarFotoPrimeraFuncion(!copiarFotoPrimeraFuncion);
                  if (!copiarFotoPrimeraFuncion) {
                    setShowForm({ ...showForm, foto_url: null });
                  }
                }}
              >
                <MaterialCommunityIcons 
                  name={copiarFotoPrimeraFuncion ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={24} 
                  color={copiarFotoPrimeraFuncion ? colors.secondary : colors.textSoft} 
                />
                <Text style={styles.checkboxLabel}>
                  Copiar foto de la primera función de esta obra
                </Text>
              </TouchableOpacity>
            )}

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
  fotoButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.secondary + '40',
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 120,
  },
  fotoPreviewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  fotoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  fotoButtonText: {
    color: colors.text,
    marginTop: 8,
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface + '80',
    borderRadius: 8,
  },
  checkboxLabel: {
    color: colors.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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
  deleteButton: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error + '40',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
