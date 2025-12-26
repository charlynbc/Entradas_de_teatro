import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { obtenerObra, listarEnsayos, listarShows, actualizarObra, archivarObra } from '../../api';
import colors from '../../theme/colors';

export default function ObraDetailScreen({ route, navigation }) {
  const { obraId } = route.params;
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [obra, setObra] = useState(null);
  const [ensayos, setEnsayos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [obraData, ensayosData, funcionesData] = await Promise.all([
        obtenerObra(obraId),
        listarEnsayos().then(data => data.filter(e => e.obra_id === obraId)),
        listarShows().then(data => data.filter(s => s.obra_id === obraId))
      ]);
      setObra(obraData);
      setEnsayos(ensayosData);
      setFunciones(funcionesData);
    } catch (error) {
      showError(error.message || 'Error al cargar datos');
    }
  }, [obraId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const handleCrearEnsayo = () => {
    navigation.navigate('CrearEnsayo', {
      obraId: obra.id,
      obraNombre: obra.nombre,
      grupoId: obra.grupo_id
    });
  };

  const handleCrearFuncion = () => {
    navigation.navigate('Funciones', {
      obraId: obra.id,
      obraNombre: obra.nombre
    });
  };

  const handleArchivar = () => {
    Alert.alert(
      'Archivar Obra',
      `¿Estás seguro de archivar "${obra.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await archivarObra(obraId);
              showSuccess('Obra archivada');
              navigation.goBack();
            } catch (error) {
              showError(error.message || 'Error al archivar');
            }
          }
        }
      ]
    );
  };

  const handleMarcarLista = async () => {
    try {
      await actualizarObra(obraId, { estado: 'LISTA' });
      showSuccess('Obra marcada como lista');
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al actualizar');
    }
  };

  if (!obra) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const estadoBadgeConfig = {
    EN_DESARROLLO: { label: 'En Desarrollo', color: colors.warning },
    LISTA: { label: 'Lista', color: colors.success },
    ARCHIVADA: { label: 'Archivada', color: colors.textMuted }
  };

  const estadoBadge = estadoBadgeConfig[obra.estado] || estadoBadgeConfig.EN_DESARROLLO;

  const ensayosFuturos = ensayos.filter(e => new Date(e.fecha) >= new Date()).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const ensayosPasados = ensayos.filter(e => new Date(e.fecha) < new Date()).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const funcionesFuturas = funciones.filter(f => new Date(f.fecha) >= new Date()).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const funcionesPasadas = funciones.filter(f => new Date(f.fecha) < new Date()).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {obra.nombre}
              </Text>
              <View style={[styles.estadoBadge, { backgroundColor: estadoBadge.color + '20' }]}>
                <Text style={[styles.estadoBadgeText, { color: estadoBadge.color }]}>
                  {estadoBadge.label}
                </Text>
              </View>
            </View>

            <Text style={styles.grupoNombre}>{obra.grupo_nombre}</Text>
          </View>
        </View>

        {/* Información de la Obra */}
        <View style={styles.infoCard}>
          {obra.descripcion && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="text" size={20} color={colors.secondary} />
              <Text style={styles.infoText}>{obra.descripcion}</Text>
            </View>
          )}

          {obra.autor && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.secondary} />
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Autor: </Text>
                {obra.autor}
              </Text>
            </View>
          )}

          {obra.genero && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="theater" size={20} color={colors.secondary} />
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Género: </Text>
                {obra.genero}
              </Text>
            </View>
          )}

          {obra.duracion_aprox && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.secondary} />
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Duración: </Text>
                {obra.duracion_aprox} minutos
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {obra.estado !== 'ARCHIVADA' && (
          <View style={styles.actionButtons}>
            {obra.estado === 'EN_DESARROLLO' && (
              <TouchableOpacity style={styles.actionButton} onPress={handleMarcarLista}>
                <LinearGradient
                  colors={[colors.success, colors.success + 'DD']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Marcar como Lista</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={handleArchivar}>
              <View style={styles.archiveButton}>
                <MaterialCommunityIcons name="archive" size={20} color={colors.textMuted} />
                <Text style={styles.archiveButtonText}>Archivar</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Ensayos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="music-note" size={24} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Ensayos</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{ensayos.length}</Text>
              </View>
            </View>

            {obra.estado !== 'ARCHIVADA' && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCrearEnsayo}
              >
                <Ionicons name="add-circle" size={24} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {ensayosFuturos.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Próximos Ensayos</Text>
              {ensayosFuturos.map((ensayo) => (
                <View key={ensayo.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{ensayo.titulo}</Text>
                    <Text style={styles.itemDate}>
                      {new Date(ensayo.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </Text>
                  </View>
                  <View style={styles.itemMeta}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.itemMetaText}>Hasta {ensayo.hora_fin}</Text>
                  </View>
                  {ensayo.lugar && (
                    <View style={styles.itemMeta}>
                      <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.itemMetaText}>{ensayo.lugar}</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {ensayosPasados.length > 0 && (
            <>
              <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>Ensayos Realizados</Text>
              {ensayosPasados.slice(0, 3).map((ensayo) => (
                <View key={ensayo.id} style={[styles.itemCard, styles.pastItem]}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, styles.pastItemText]}>{ensayo.titulo}</Text>
                    <Text style={[styles.itemDate, styles.pastItemText]}>
                      {new Date(ensayo.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {ensayos.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="music-note-off" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay ensayos programados</Text>
              {obra.estado !== 'ARCHIVADA' && (
                <TouchableOpacity style={styles.emptyButton} onPress={handleCrearEnsayo}>
                  <Text style={styles.emptyButtonText}>Crear Primer Ensayo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Funciones Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="drama-masks" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Funciones</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{funciones.length}</Text>
              </View>
            </View>

            {obra.estado !== 'ARCHIVADA' && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCrearFuncion}
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {funcionesFuturas.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Próximas Funciones</Text>
              {funcionesFuturas.map((funcion) => (
                <TouchableOpacity
                  key={funcion.id}
                  style={styles.itemCard}
                  onPress={() => navigation.navigate('DirectorShowDetail', { showId: funcion.id })}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{funcion.obra}</Text>
                    <Text style={styles.itemDate}>
                      {new Date(funcion.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.itemMeta}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.itemMetaText}>{funcion.lugar}</Text>
                  </View>
                  <View style={styles.itemMeta}>
                    <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.itemMetaText}>
                      Capacidad: {funcion.capacidad} | Precio: ${funcion.base_price}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {funcionesPasadas.length > 0 && (
            <>
              <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>Funciones Realizadas</Text>
              {funcionesPasadas.slice(0, 3).map((funcion) => (
                <TouchableOpacity
                  key={funcion.id}
                  style={[styles.itemCard, styles.pastItem]}
                  onPress={() => navigation.navigate('DirectorShowDetail', { showId: funcion.id })}
                >
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, styles.pastItemText]}>{funcion.obra}</Text>
                    <Text style={[styles.itemDate, styles.pastItemText]}>
                      {new Date(funcion.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {funciones.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="theater" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay funciones programadas</Text>
              {obra.estado !== 'ARCHIVADA' && (
                <TouchableOpacity style={styles.emptyButton} onPress={handleCrearFuncion}>
                  <Text style={styles.emptyButtonText}>Crear Primera Función</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grupoNombre: {
    fontSize: 16,
    color: colors.textMuted,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  infoLabel: {
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  archiveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  itemMetaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  pastItem: {
    opacity: 0.6,
  },
  pastItemText: {
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
});
