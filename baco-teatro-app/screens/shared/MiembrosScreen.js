import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listarMiembros } from '../../api';

export default function MiembrosScreen({ navigation }) {
  const { toast, showError, hideToast } = useToast();
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMiembro, setSelectedMiembro] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadMiembros();
  }, []);

  const loadMiembros = async () => {
    try {
      const data = await listarMiembros();
      setMiembros(data);
    } catch (error) {
      showError('No se pudieron cargar los miembros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMiembroPress = (miembro) => {
    setSelectedMiembro(miembro);
    setModalVisible(true);
  };

  const getGeneroLabel = (genero) => {
    if (genero === 'femenino') return '♀️';
    if (genero === 'masculino') return '♂️';
    return '⚧';
  };

  const getRoleLabel = (rol, genero) => {
    switch (rol) {
      case 'ADMIN':
      case 'admin':
        return 'Director';
      case 'VENDEDOR':
      case 'vendedor':
        if (genero === 'femenino') return 'Actriz';
        if (genero === 'masculino') return 'Actor';
        return 'Actante';
      case 'SUPER':
      case 'supremo':
        return 'Super Usuario';
      default:
        return rol;
    }
  };

  const getRoleIcon = (rol) => {
    switch (rol) {
      case 'ADMIN':
      case 'admin':
        return 'film-outline';
      case 'VENDEDOR':
      case 'vendedor':
        return 'person-outline';
      case 'SUPER':
      case 'supremo':
        return 'star-outline';
      default:
        return 'person-circle-outline';
    }
  };

  const getRoleColor = (rol) => {
    switch (rol) {
      case 'SUPER':
      case 'supremo':
        return '#FFD700'; // Dorado
      case 'ADMIN':
      case 'admin':
        return colors.secondary;
      case 'VENDEDOR':
      case 'vendedor':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  const getAvatarSource = (nombre, rol, genero) => {
    // Usar el nombre como seed para avatares únicos
    const seed = encodeURIComponent(nombre);
    if (rol === 'SUPER' || rol === 'supremo') {
      return { uri: `https://api.dicebear.com/7.x/bottts/png?seed=${seed}&backgroundColor=ffd700` };
    }
    if (rol === 'ADMIN' || rol === 'admin') {
      return { uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&backgroundColor=8b5cf6` };
    }
    // Para actores/actrices
    return { uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&backgroundColor=ec4899` };
  };

  const renderMiembro = (item) => {
    const roleColor = getRoleColor(item.rol);
    
    return (
      <TouchableOpacity
        key={item.cedula || item.id}
        style={styles.miembroCard}
        onPress={() => handleMiembroPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={getAvatarSource(item.name, item.rol, item.genero)}
            style={styles.avatar}
          />
          <View style={[styles.roleIconBadge, { backgroundColor: roleColor }]}>
            <Ionicons name={getRoleIcon(item.rol)} size={14} color="white" />
          </View>
        </View>
        <View style={styles.miembroInfo}>
          <View style={styles.miembroNameRow}>
            <Text style={styles.miembroNombre} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.generoEmoji}>{getGeneroLabel(item.genero)}</Text>
          </View>
          <Text style={[styles.miembroRol, { color: roleColor }]}>
            {getRoleLabel(item.rol, item.genero)}
          </Text>
          {item.obras_activas > 0 && (
            <View style={styles.obrasTag}>
              <MaterialCommunityIcons name="drama-masks" size={12} color={colors.secondary} />
              <Text style={styles.obrasText}>
                {item.obras_activas} {item.obras_activas === 1 ? 'obra' : 'obras'}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderMiembroDetail = () => {
    if (!selectedMiembro) return null;
    
    const roleColor = getRoleColor(selectedMiembro.rol);
    const obras = selectedMiembro.obras ? JSON.parse(selectedMiembro.obras).filter(o => o.show_id) : [];
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header con avatar grande */}
              <LinearGradient
                colors={[roleColor + '40', roleColor + '20']}
                style={styles.modalHeader}
              >
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                
                <Image 
                  source={getAvatarSource(selectedMiembro.name, selectedMiembro.rol, selectedMiembro.genero)}
                  style={styles.modalAvatar}
                />
                <View style={[styles.modalRoleBadge, { backgroundColor: roleColor }]}>
                  <Ionicons name={getRoleIcon(selectedMiembro.rol)} size={20} color="white" />
                </View>
                
                <Text style={styles.modalNombre}>{selectedMiembro.name}</Text>
                <Text style={[styles.modalRol, { color: roleColor }]}>
                  {getRoleLabel(selectedMiembro.rol, selectedMiembro.genero)} {getGeneroLabel(selectedMiembro.genero)}
                </Text>
              </LinearGradient>

              {/* Información */}
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="card-account-details" size={20} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Cédula</Text>
                    <Text style={styles.infoValue}>{selectedMiembro.cedula}</Text>
                  </View>
                </View>

                {selectedMiembro.phone && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="phone" size={20} color={colors.textMuted} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Teléfono</Text>
                      <Text style={styles.infoValue}>{selectedMiembro.phone}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="drama-masks" size={20} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Obras activas</Text>
                    <Text style={styles.infoValue}>{selectedMiembro.obras_activas || 0}</Text>
                  </View>
                </View>

                {obras.length > 0 && (
                  <View style={styles.obrasSection}>
                    <Text style={styles.obrasSectionTitle}>🎭 Obras</Text>
                    {obras.map((obra, index) => (
                      <View key={index} style={styles.obraItem}>
                        <View style={styles.obraIconCircle}>
                          <MaterialCommunityIcons name="movie-open" size={16} color={colors.secondary} />
                        </View>
                        <View style={styles.obraItemContent}>
                          <Text style={styles.obraItemName}>{obra.show_obra}</Text>
                          {obra.show_fecha && (
                            <Text style={styles.obraItemDate}>
                              {new Date(obra.show_fecha).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {obras.length === 0 && (
                  <View style={styles.noObrasBox}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
                    <Text style={styles.noObrasText}>
                      No tiene obras asignadas actualmente
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Separar y ordenar: primero directores (ADMIN), luego actores (VENDEDOR), ambos alfabéticamente
  const directores = miembros
    .filter(m => m.rol === 'ADMIN' || m.rol === 'admin')
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const actores = miembros
    .filter(m => m.rol === 'VENDEDOR' || m.rol === 'vendedor')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ScreenContainer>
      {/* Header con contador total */}
      <LinearGradient
        colors={[colors.primary + '20', colors.background]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="account-group" size={36} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Miembros de Baco</Text>
            <View style={styles.counterBadge}>
              <MaterialCommunityIcons name="account-multiple" size={16} color={colors.secondary} />
              <Text style={styles.counterText}>
                {miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Directores */}
      {directores.length > 0 && (
        <SectionCard 
          title={
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="account-tie" size={22} color={colors.primary} />
              <Text style={styles.sectionTitleText}>Directores</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{directores.length}</Text>
              </View>
            </View>
          }
        >
          {directores.map(item => renderMiembro(item))}
        </SectionCard>
      )}

      {/* Actores y Actrices */}
      {actores.length > 0 && (
        <SectionCard 
          title={
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="drama-masks" size={22} color={colors.secondary} />
              <Text style={styles.sectionTitleText}>Actores y Actrices</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{actores.length}</Text>
              </View>
            </View>
          }
        >
          {actores.map(item => renderMiembro(item))}
        </SectionCard>
      )}

      {miembros.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="account-off" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>No hay miembros registrados</Text>
        </View>
      )}
      
      {/* Modal de detalles */}
      {renderMiembroDetail()}
      
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
  
  // Header styles
  headerGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    marginHorizontal: -20,
    marginTop: -20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  
  // Section styles
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
  
  // Member card styles
  miembroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
    gap: 14,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  miembroInfo: {
    flex: 1,
    gap: 4,
  },
  miembroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miembroNombre: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  generoEmoji: {
    fontSize: 16,
  },
  miembroRol: {
    fontSize: 14,
    fontWeight: '500',
  },
  obrasTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  obrasText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
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
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: 'white',
    marginBottom: 16,
  },
  modalRoleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 12,
  },
  modalNombre: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRol: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  obrasSection: {
    marginTop: 8,
  },
  obrasSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  obraItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  obraIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  obraItemContent: {
    flex: 1,
  },
  obraItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  obraItemDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  noObrasBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: 8,
  },
  noObrasText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  
  // Empty state
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
  },
});
