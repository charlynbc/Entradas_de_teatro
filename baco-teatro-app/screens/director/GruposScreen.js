import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { listarGrupos, crearGrupo } from '../../api';
import colors from '../../theme/colors';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function GruposScreen({ navigation }) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    dia_semana: 'Miércoles',
    hora_inicio: '21:00',
    fecha_inicio: '',
    fecha_fin: '',
    obra_a_realizar: ''
  });

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      const data = await listarGrupos();
      setGrupos(data);
    } catch (error) {
      showError('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearGrupo = async () => {
    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
      showError('Completa todos los campos obligatorios');
      return;
    }

    try {
      await crearGrupo(formData);
      showSuccess('Grupo creado exitosamente');
      setModalVisible(false);
      resetForm();
      cargarGrupos();
    } catch (error) {
      showError(error.message || 'Error al crear grupo');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      dia_semana: 'Miércoles',
      hora_inicio: '21:00',
      fecha_inicio: '',
      fecha_fin: '',
      obra_a_realizar: ''
    });
  };

  const getEstadoColor = (estado) => {
    return estado === 'ACTIVO' ? colors.success : colors.textMuted;
  };

  const getEstadoIcon = (estado) => {
    return estado === 'ACTIVO' ? 'checkmark-circle' : 'archive';
  };

  const gruposActivos = grupos.filter(g => g.estado === 'ACTIVO');
  const gruposArchivados = grupos.filter(g => g.estado === 'ARCHIVADO');

  const renderGrupo = (grupo) => (
    <TouchableOpacity
      key={grupo.id}
      style={styles.grupoCard}
      onPress={() => navigation.navigate('GrupoDetail', { grupoId: grupo.id })}
      activeOpacity={0.7}
    >
      <View style={styles.grupoHeader}>
        <View style={styles.grupoIconContainer}>
          <LinearGradient
            colors={[colors.primary + '30', colors.primary + '10']}
            style={styles.grupoIconGradient}
          >
            <MaterialCommunityIcons name="account-group" size={28} color={colors.primary} />
          </LinearGradient>
        </View>
        
        <View style={styles.grupoInfo}>
          <View style={styles.grupoTitleRow}>
            <Text style={styles.grupoNombre} numberOfLines={1}>{grupo.nombre}</Text>
            <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(grupo.estado) + '20' }]}>
              <Ionicons name={getEstadoIcon(grupo.estado)} size={14} color={getEstadoColor(grupo.estado)} />
              <Text style={[styles.estadoText, { color: getEstadoColor(grupo.estado) }]}>
                {grupo.estado}
              </Text>
            </View>
          </View>

          <View style={styles.grupoMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{grupo.dia_semana}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{grupo.hora_inicio?.substring(0, 5)}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-multiple" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{grupo.miembros_activos || 0} miembros</Text>
            </View>
          </View>

          {grupo.obra_a_realizar && (
            <View style={styles.obraTag}>
              <MaterialCommunityIcons name="drama-masks" size={14} color={colors.secondary} />
              <Text style={styles.obraText} numberOfLines={1}>{grupo.obra_a_realizar}</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="loading" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Cargando grupos...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Grupos de Teatro</Text>
          <Text style={styles.subtitle}>
            {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'} total
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + 'DD']}
            style={styles.createButtonGradient}
          >
            <Ionicons name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Grupos Activos */}
      {gruposActivos.length > 0 && (
        <SectionCard
          title={
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="account-group" size={22} color={colors.primary} />
              <Text style={styles.sectionTitleText}>Grupos Activos</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{gruposActivos.length}</Text>
              </View>
            </View>
          }
        >
          {gruposActivos.map(grupo => renderGrupo(grupo))}
        </SectionCard>
      )}

      {/* Grupos Archivados */}
      {gruposArchivados.length > 0 && (
        <SectionCard
          title={
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="archive" size={22} color={colors.textMuted} />
              <Text style={styles.sectionTitleText}>Grupos Archivados</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.textMuted + '20' }]}>
                <Text style={[styles.countBadgeText, { color: colors.textMuted }]}>
                  {gruposArchivados.length}
                </Text>
              </View>
            </View>
          }
        >
          {gruposArchivados.map(grupo => renderGrupo(grupo))}
        </SectionCard>
      )}

      {grupos.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No hay grupos creados</Text>
          <Text style={styles.emptyText}>Crea tu primer grupo de teatro</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Crear Grupo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Crear Grupo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Grupo</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Nombre */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre del Grupo *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="account-group" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={formData.nombre}
                      onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                      placeholder="Ej: Grupo Teatro Experimental"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Descripción */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Descripción</Text>
                  <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                    <MaterialCommunityIcons name="text" size={20} color={colors.textMuted} style={{ marginTop: 8 }} />
                    <TextInput
                      style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                      value={formData.descripcion}
                      onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                      placeholder="Descripción del grupo"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>

                {/* Día de la semana */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Día de Clases * (No se puede cambiar)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diasContainer}>
                    {DIAS_SEMANA.map(dia => (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.diaButton,
                          formData.dia_semana === dia && styles.diaButtonActive
                        ]}
                        onPress={() => setFormData({ ...formData, dia_semana: dia })}
                      >
                        <Text style={[
                          styles.diaText,
                          formData.dia_semana === dia && styles.diaTextActive
                        ]}>
                          {dia.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Hora */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hora de Inicio * (No se puede cambiar)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={formData.hora_inicio}
                      onChangeText={(text) => setFormData({ ...formData, hora_inicio: text })}
                      placeholder="21:00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Fechas */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Fecha Inicio *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        value={formData.fecha_inicio}
                        onChangeText={(text) => setFormData({ ...formData, fecha_inicio: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                        {...Platform.select({
                          web: { type: 'date' }
                        })}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Fecha Fin *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        value={formData.fecha_fin}
                        onChangeText={(text) => setFormData({ ...formData, fecha_fin: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                        {...Platform.select({
                          web: { type: 'date' }
                        })}
                      />
                    </View>
                  </View>
                </View>

                {/* Obra */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Obra a Realizar</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="drama-masks" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={formData.obra_a_realizar}
                      onChangeText={(text) => setFormData({ ...formData, obra_a_realizar: text })}
                      placeholder="Ej: Esperando a Godot"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={colors.warning} />
                  <Text style={styles.infoText}>
                    El día y hora de clases NO podrán ser modificados después de crear el grupo
                  </Text>
                </View>

                {/* Botones */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleCrearGrupo}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primary + 'DD']}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>Crear Grupo</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  createButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  createButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  grupoCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  grupoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  grupoIconContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  grupoIconGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grupoInfo: {
    flex: 1,
    gap: 6,
  },
  grupoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grupoNombre: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  grupoMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  obraTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  obraText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    ...Platform.select({
      web: {
        maxWidth: 600,
        marginHorizontal: 'auto',
        width: '100%',
      },
    }),
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  diasContainer: {
    flexDirection: 'row',
  },
  diaButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  diaButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  diaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  diaTextActive: {
    color: colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.warning + '15',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
