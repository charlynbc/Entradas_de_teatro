import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import colors from '../../theme/colors';
import { listarEnsayos, crearEnsayo, eliminarEnsayo, listarVendedores } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function EnsayosGeneralesScreen({ navigation }) {
  const [ensayos, setEnsayos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: new Date(),
    lugar: '',
    descripcion: '',
    actores: []
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { user } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const isDirector = ['ADMIN', 'SUPER'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ensayosData, vendedoresData] = await Promise.all([
        listarEnsayos(),
        isDirector ? listarVendedores() : Promise.resolve([])
      ]);
      setEnsayos(ensayosData);
      setVendedores(vendedoresData);
    } catch (error) {
      showError('No se pudieron cargar los ensayos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearEnsayo = async () => {
    if (!formData.titulo || !formData.lugar) {
      showError('Completa título y lugar del ensayo');
      return;
    }

    try {
      await crearEnsayo(formData);
      setModalVisible(false);
      setFormData({
        titulo: '',
        fecha: new Date(),
        lugar: '',
        descripcion: '',
        actores: []
      });
      loadData();
      showSuccess('✨ Ensayo creado con éxito');
    } catch (error) {
      showError(error.message || 'No se pudo crear el ensayo');
    }
  };

  const handleEliminarEnsayo = (ensayoId, titulo) => {
    Alert.alert(
      '🗑️ Eliminar ensayo',
      `¿Eliminar "${titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarEnsayo(ensayoId);
              loadData();
              showSuccess('🗑️ Ensayo eliminado con éxito');
            } catch (error) {
              showError('No se pudo eliminar el ensayo');
            }
          }
        }
      ]
    );
  };

  const toggleActor = (actorId) => {
    setFormData(prev => ({
      ...prev,
      actores: prev.actores.includes(actorId)
        ? prev.actores.filter(id => id !== actorId)
        : [...prev.actores, actorId]
    }));
  };

  const renderEnsayo = ({ item }) => {
    const fecha = new Date(item.fecha);
    const actores = item.actores || [];

    return (
      <View style={styles.ensayoCard}>
        <View style={styles.ensayoHeader}>
          <View style={styles.fechaBox}>
            <Text style={styles.dia}>{fecha.getDate()}</Text>
            <Text style={styles.mes}>{fecha.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</Text>
          </View>
          <View style={styles.ensayoInfo}>
            <Text style={styles.ensayoTitulo}>{item.titulo}</Text>
            <View style={styles.ensayoMeta}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.ensayoMetaText}>
                {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs
              </Text>
            </View>
            <View style={styles.ensayoMeta}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.ensayoMetaText}>{item.lugar}</Text>
            </View>
            {item.descripcion && (
              <Text style={styles.ensayoDescripcion}>{item.descripcion}</Text>
            )}
            {actores.length > 0 && (
              <View style={styles.actoresList}>
                <Ionicons name="people-outline" size={14} color={colors.secondary} />
                <Text style={styles.actoresText}>
                  {actores.map(a => a.nombre).join(', ')}
                </Text>
              </View>
            )}
          </View>
          {isDirector && (
            <TouchableOpacity
              onPress={() => handleEliminarEnsayo(item.id, item.titulo)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#4B0082', '#8B008B', '#9370DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>🎭 Ensayos Generales</Text>
            <Text style={styles.headerSubtitle}>Cronograma del elenco</Text>
          </View>
          <MaterialCommunityIcons name="calendar-star" size={48} color="#FFD700" />
        </View>
      </LinearGradient>

      {isDirector && (
        <TouchableOpacity
          style={styles.crearButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.secondary} />
          <Text style={styles.crearButtonText}>Crear Ensayo</Text>
        </TouchableOpacity>
      )}

      {ensayos.length > 0 ? (
        <FlatList
          data={ensayos}
          renderItem={renderEnsayo}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 60 }}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {isDirector ? 'No hay ensayos programados. Creá uno nuevo.' : 'No tienes ensayos programados'}
          </Text>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Ensayo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Título del ensayo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Ensayo General Obra X"
                placeholderTextColor={colors.textMuted}
                value={formData.titulo}
                onChangeText={(text) => setFormData({ ...formData, titulo: text })}
              />

              <Text style={styles.label}>Fecha y hora *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.text }}>
                  {formData.fecha.toLocaleString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.fecha}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({ ...formData, fecha: selectedDate });
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Lugar *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Teatro Municipal"
                placeholderTextColor={colors.textMuted}
                value={formData.lugar}
                onChangeText={(text) => setFormData({ ...formData, lugar: text })}
              />

              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detalles adicionales del ensayo"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={formData.descripcion}
                onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
              />

              <Text style={styles.label}>Actores que asisten</Text>
              <View style={styles.actoresSelection}>
                {vendedores.map(vendedor => (
                  <TouchableOpacity
                    key={vendedor.id}
                    style={[
                      styles.actorChip,
                      formData.actores.includes(vendedor.id) && styles.actorChipSelected
                    ]}
                    onPress={() => toggleActor(vendedor.id)}
                  >
                    <Text style={[
                      styles.actorChipText,
                      formData.actores.includes(vendedor.id) && styles.actorChipTextSelected
                    ]}>
                      {vendedor.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCrearEnsayo}
              >
                <Text style={styles.submitButtonText}>Crear Ensayo</Text>
              </TouchableOpacity>
            </ScrollView>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4B0082',
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  crearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
    gap: 10,
  },
  crearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  ensayoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ensayoHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  fechaBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    minWidth: 50,
  },
  dia: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  mes: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '700',
  },
  ensayoInfo: {
    flex: 1,
  },
  ensayoTitulo: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  ensayoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ensayoMetaText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  ensayoDescripcion: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  actoresList: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actoresText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '500',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actoresSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actorChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actorChipSelected: {
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },
  actorChipText: {
    fontSize: 14,
    color: colors.text,
  },
  actorChipTextSelected: {
    color: colors.secondary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
});
