import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { 
  obtenerGrupo, 
  listarActoresDisponibles, 
  agregarMiembroGrupo, 
  eliminarMiembroGrupo,
  archivarGrupo,
  listarEnsayosGrupo
} from '../../api';
import colors from '../../theme/colors';

export default function GrupoDetailScreen({ route, navigation }) {
  const { grupoId } = route.params;
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [grupo, setGrupo] = useState(null);
  const [ensayos, setEnsayos] = useState([]);
  const [actoresDisponibles, setActoresDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalAddMember, setModalAddMember] = useState(false);
  const [modalCreateEnsayo, setModalCreateEnsayo] = useState(false);
  
  const [ensayoForm, setEnsayoForm] = useState({
    titulo: '',
    fecha: '',
    hora_fin: '',
    lugar: 'Sala Baco Teatro',
    descripcion: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [grupoData, ensayosData, actoresData] = await Promise.all([
        obtenerGrupo(grupoId),
        listarEnsayosGrupo(grupoId),
        listarActoresDisponibles(grupoId)
      ]);
      
      setGrupo(grupoData);
      setEnsayos(ensayosData);
      setActoresDisponibles(actoresData);
    } catch (error) {
      showError('Error al cargar datos del grupo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarMiembro = async (actorCedula) => {
    try {
      await agregarMiembroGrupo(grupoId, actorCedula);
      showSuccess('Miembro agregado al grupo');
      setModalAddMember(false);
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al agregar miembro');
    }
  };

  const handleEliminarMiembro = async (actorCedula) => {
    if (!confirm('¿Eliminar este miembro del grupo?')) return;
    
    try {
      await eliminarMiembroGrupo(grupoId, actorCedula);
      showSuccess('Miembro eliminado del grupo');
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al eliminar miembro');
    }
  };

  const handleArchivarGrupo = async () => {
    if (!confirm('¿Archivar este grupo? No se podrán crear más ensayos.')) return;
    
    try {
      await archivarGrupo(grupoId);
      showSuccess('Grupo archivado');
      navigation.goBack();
    } catch (error) {
      showError(error.message || 'Error al archivar grupo');
    }
  };

  const handleCrearEnsayo = () => {
    navigation.navigate('CrearEnsayo', { 
      grupoId,
      grupoNombre: grupo.nombre,
      lugarDefault: 'Sala Baco Teatro'
    });
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando grupo...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!grupo) return null;

  const miembros = grupo.miembros || [];
  const grupoActivo = grupo.estado === 'ACTIVO';

  return (
    <ScreenContainer>
      {/* Header del Grupo */}
      <View style={styles.headerCard}>
        <LinearGradient
          colors={[colors.primary, colors.primary + 'DD']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="account-group" size={48} color="white" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{grupo.nombre}</Text>
              <View style={styles.headerMeta}>
                <View style={styles.headerMetaItem}>
                  <Ionicons name="calendar" size={16} color="white" />
                  <Text style={styles.headerMetaText}>{grupo.dia_semana}</Text>
                </View>
                <View style={styles.headerMetaItem}>
                  <Ionicons name="time" size={16} color="white" />
                  <Text style={styles.headerMetaText}>{grupo.hora_inicio?.substring(0, 5)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: grupoActivo ? colors.success : colors.textMuted }]}>
              <Text style={styles.estadoText}>{grupo.estado}</Text>
            </View>
          </View>

          {grupo.descripcion && (
            <Text style={styles.headerDescription}>{grupo.descripcion}</Text>
          )}

          {grupo.obra_a_realizar && (
            <View style={styles.obraContainer}>
              <MaterialCommunityIcons name="drama-masks" size={18} color="white" />
              <Text style={styles.obraText}>{grupo.obra_a_realizar}</Text>
            </View>
          )}

          <View style={styles.fechasContainer}>
            <View style={styles.fechaItem}>
              <Text style={styles.fechaLabel}>Inicio</Text>
              <Text style={styles.fechaValue}>{grupo.fecha_inicio}</Text>
            </View>
            <View style={styles.fechaDivider} />
            <View style={styles.fechaItem}>
              <Text style={styles.fechaLabel}>Fin</Text>
              <Text style={styles.fechaValue}>{grupo.fecha_fin}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Botones de Acción */}
      {grupoActivo && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={handleCrearEnsayo}
          >
            <LinearGradient
              colors={[colors.secondary, colors.secondary + 'DD']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.actionButtonText}>Crear Ensayo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={() => setModalAddMember(true)}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color={colors.primary} />
            <Text style={styles.secondaryActionText}>Agregar Miembro</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Miembros del Grupo */}
      <SectionCard
        title={
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-multiple" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Miembros</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{miembros.length}</Text>
            </View>
          </View>
        }
      >
        {miembros.length === 0 ? (
          <View style={styles.emptySection}>
            <MaterialCommunityIcons name="account-off-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay miembros en este grupo</Text>
          </View>
        ) : (
          miembros.map((miembro, index) => (
            <View key={index} style={styles.miembroItem}>
              <View style={styles.miembroInfo}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {miembro.nombre?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.miembroDetails}>
                  <Text style={styles.miembroNombre}>{miembro.nombre}</Text>
                  <Text style={styles.miembroCedula}>CI: {miembro.cedula}</Text>
                </View>
              </View>
              
              {grupoActivo && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleEliminarMiembro(miembro.cedula)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </SectionCard>

      {/* Ensayos del Grupo */}
      <SectionCard
        title={
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-check" size={22} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Ensayos Programados</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[styles.countText, { color: colors.secondary }]}>{ensayos.length}</Text>
            </View>
          </View>
        }
      >
        {ensayos.length === 0 ? (
          <View style={styles.emptySection}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay ensayos programados</Text>
          </View>
        ) : (
          ensayos.map((ensayo) => (
            <TouchableOpacity
              key={ensayo.id}
              style={styles.ensayoItem}
              onPress={() => navigation.navigate('EnsayoDetail', { ensayoId: ensayo.id })}
            >
              <View style={styles.ensayoHeader}>
                <Text style={styles.ensayoTitulo}>{ensayo.titulo}</Text>
              </View>
              <View style={styles.ensayoMeta}>
                <View style={styles.ensayoMetaItem}>
                  <Ionicons name="calendar" size={14} color={colors.textMuted} />
                  <Text style={styles.ensayoMetaText}>
                    {new Date(ensayo.fecha).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <View style={styles.ensayoMetaItem}>
                  <Ionicons name="time" size={14} color={colors.textMuted} />
                  <Text style={styles.ensayoMetaText}>
                    {grupo.hora_inicio?.substring(0, 5)} - {ensayo.hora_fin?.substring(0, 5)}
                  </Text>
                </View>
                {ensayo.lugar && (
                  <View style={styles.ensayoMetaItem}>
                    <Ionicons name="location" size={14} color={colors.textMuted} />
                    <Text style={styles.ensayoMetaText}>{ensayo.lugar}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </SectionCard>

      {/* Archivar Grupo */}
      {grupoActivo && (
        <TouchableOpacity
          style={styles.archivarButton}
          onPress={handleArchivarGrupo}
        >
          <MaterialCommunityIcons name="archive" size={20} color={colors.error} />
          <Text style={styles.archivarText}>Archivar Grupo</Text>
        </TouchableOpacity>
      )}

      {/* Modal Agregar Miembro */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalAddMember}
        onRequestClose={() => setModalAddMember(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Miembro</Text>
              <TouchableOpacity onPress={() => setModalAddMember(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {actoresDisponibles.length === 0 ? (
                <View style={styles.emptyModal}>
                  <MaterialCommunityIcons name="account-off" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyModalText}>
                    No hay actores disponibles para agregar
                  </Text>
                </View>
              ) : (
                actoresDisponibles.map((actor) => (
                  <TouchableOpacity
                    key={actor.cedula}
                    style={styles.actorItem}
                    onPress={() => handleAgregarMiembro(actor.cedula)}
                  >
                    <View style={styles.actorInfo}>
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {actor.nombre?.charAt(0) || '?'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.actorNombre}>{actor.nombre}</Text>
                        <Text style={styles.actorCedula}>CI: {actor.cedula}</Text>
                      </View>
                    </View>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </TouchableOpacity>
                ))
              )}
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
  headerCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerGradient: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  headerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerMetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  headerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  obraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  obraText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  fechasContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  fechaItem: {
    flex: 1,
    alignItems: 'center',
  },
  fechaLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  fechaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  fechaDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryActionButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
  miembroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  miembroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  miembroDetails: {
    flex: 1,
  },
  miembroNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  miembroCedula: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  ensayoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  ensayoHeader: {
    marginBottom: 6,
  },
  ensayoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ensayoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ensayoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ensayoMetaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  archivarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  archivarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  emptyModal: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyModalText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  actorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  actorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actorCedula: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
