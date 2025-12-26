import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, Modal, TextInput, Image, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import ScreenContainer from '../../components/ScreenContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { 
  obtenerGrupo, 
  listarObrasPorGrupo, 
  actualizarGrupo, 
  archivarGrupo,
  listarActoresDisponibles,
  agregarMiembroGrupo,
  eliminarMiembroGrupo,
  crearObra,
  actualizarObra,
  eliminarObra,
  listDirectorShows,
  getSession,
  finalizarGrupo
} from '../../api';
import colors from '../../theme/colors';

export default function GrupoDetailScreen({ route, navigation }) {
  const { grupoId } = route.params;
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [grupo, setGrupo] = useState(null);
  const [obras, setObras] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modales
  const [modalEditGrupo, setModalEditGrupo] = useState(false);
  const [modalAddMiembro, setModalAddMiembro] = useState(false);
  const [modalEditObra, setModalEditObra] = useState(false);
  const [modalFinalizarGrupo, setModalFinalizarGrupo] = useState(false);
  
  // Formularios
  const [formGrupo, setFormGrupo] = useState({});
  const [formObra, setFormObra] = useState({});
  const [actoresDisponibles, setActoresDisponibles] = useState([]);
  const [selectedActor, setSelectedActor] = useState('');
  const [formFinalizarGrupo, setFormFinalizarGrupo] = useState({ conclusion: '', puntuacion: '' });

  // Helper para verificar si el usuario puede editar el grupo
  const puedeEditarGrupo = useCallback(() => {
    const session = getSession();
    if (!grupo) return false;
    return session.user?.role === 'SUPER' || grupo.director_cedula === session.user?.id;
  }, [grupo]);

  const cargarDatos = useCallback(async () => {
    try {
      const [grupoData, obrasData, funcionesData] = await Promise.all([
        obtenerGrupo(grupoId),
        listarObrasPorGrupo(grupoId),
        listDirectorShows() // Traemos todas las funciones
      ]);
      setGrupo(grupoData);
      setObras(obrasData);
      // Filtrar solo las funciones de este grupo
      const funcionesDelGrupo = funcionesData.filter(f => f.grupo_id === grupoId);
      setFunciones(funcionesDelGrupo);
    } catch (error) {
      showError(error.message || 'Error al cargar datos');
    }
  }, [grupoId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const handleEditarGrupo = () => {
    setFormGrupo({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || '',
      fecha_inicio: grupo.fecha_inicio,
      fecha_fin: grupo.fecha_fin,
      obra_a_realizar: grupo.obra_a_realizar || ''
    });
    setModalEditGrupo(true);
  };

  const handleGuardarGrupo = async () => {
    try {
      await actualizarGrupo(grupoId, formGrupo);
      showSuccess('Grupo actualizado');
      setModalEditGrupo(false);
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al actualizar');
    }
  };

  const handleEliminarGrupo = () => {
    Alert.alert(
      '⚠️ Eliminar Grupo',
      `¿Estás seguro de archivar "${grupo.nombre}"? Esta acción se puede revertir.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await archivarGrupo(grupoId);
              showSuccess('Grupo archivado');
              navigation.goBack();
            } catch (error) {
              showError(error.message || 'Error al archivar');
            }
          }
        }
      ]
    );
  };

  const handleFinalizarGrupo = async () => {
    if (!formFinalizarGrupo.conclusion) {
      showError('Debes agregar una conclusión');
      return;
    }
    if (!formFinalizarGrupo.puntuacion || formFinalizarGrupo.puntuacion < 1 || formFinalizarGrupo.puntuacion > 10) {
      showError('La puntuación debe ser entre 1 y 10');
      return;
    }

    try {
      await finalizarGrupo(grupoId, {
        conclusion: formFinalizarGrupo.conclusion,
        puntuacion: parseInt(formFinalizarGrupo.puntuacion)
      });
      showSuccess('Grupo finalizado correctamente');
      setModalFinalizarGrupo(false);
      navigation.navigate('GruposFinalizados');
    } catch (error) {
      showError(error.message || 'Error al finalizar grupo');
    }
  };

  const handleAgregarMiembro = async () => {
    const actores = await listarActoresDisponibles(grupoId);
    setActoresDisponibles(actores);
    setModalAddMiembro(true);
  };

  const handleConfirmarAgregarMiembro = async () => {
    if (!selectedActor) {
      showError('Selecciona un actor/director');
      return;
    }
    try {
      await agregarMiembroGrupo(grupoId, selectedActor);
      showSuccess('Miembro agregado');
      setModalAddMiembro(false);
      setSelectedActor('');
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al agregar');
    }
  };

  const handleEliminarMiembro = (miembro) => {
    Alert.alert(
      '⚠️ Eliminar Miembro',
      `¿Remover a ${miembro.nombre} del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarMiembroGrupo(grupoId, miembro.cedula);
              showSuccess('Miembro eliminado');
              cargarDatos();
            } catch (error) {
              showError(error.message || 'Error al eliminar');
            }
          }
        }
      ]
    );
  };

  const handleCrearObra = () => {
    navigation.navigate('CrearObra', {
      grupoId: grupo.id,
      grupoNombre: grupo.nombre
    });
  };

  const handleEditarObra = (obra) => {
    setFormObra({
      id: obra.id,
      nombre: obra.nombre,
      descripcion: obra.descripcion || '',
      autor: obra.autor || '',
      genero: obra.genero || '',
      duracion_aprox: obra.duracion_aprox?.toString() || ''
    });
    setModalEditObra(true);
  };

  const handleGuardarObra = async () => {
    try {
      await actualizarObra(formObra.id, {
        nombre: formObra.nombre,
        descripcion: formObra.descripcion,
        autor: formObra.autor,
        genero: formObra.genero,
        duracion_aprox: formObra.duracion_aprox ? parseInt(formObra.duracion_aprox) : null
      });
      showSuccess('Obra actualizada');
      setModalEditObra(false);
      cargarDatos();
    } catch (error) {
      showError(error.message || 'Error al actualizar');
    }
  };

  const handleEliminarObra = (obra) => {
    Alert.alert(
      '⚠️ Eliminar Obra',
      `¿Estás seguro de eliminar "${obra.nombre}"? Esto eliminará todos sus ensayos y funciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarObra(obra.id);
              showSuccess('Obra eliminada');
              cargarDatos();
            } catch (error) {
              showError(error.message || 'Error al eliminar');
            }
          }
        }
      ]
    );
  };

  const handleSelectFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      // TODO: Subir imagen y actualizar foto_url
      showSuccess('Foto seleccionada (subida pendiente)');
    }
  };

  if (!grupo) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header con Foto del Grupo */}
        <View style={styles.header}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.headerGradient}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.fotoGrupo}
              onPress={puedeEditarGrupo() ? handleSelectFoto : null}
              disabled={!puedeEditarGrupo()}
            >
              {grupo.foto_url ? (
                <Image source={{ uri: grupo.foto_url }} style={styles.fotoGrupoImage} />
              ) : (
                <View style={styles.fotoGrupoPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={40} color="white" />
                  <Text style={styles.fotoGrupoText}>
                    {puedeEditarGrupo() ? 'Agregar foto del elenco' : 'Foto del elenco'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.grupoNombre}>{grupo.nombre}</Text>
              <View style={styles.headerMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={16} color={colors.accent} />
                  <Text style={styles.metaText}>{grupo.dia_semana} • {grupo.hora_inicio}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people" size={16} color={colors.accent} />
                  <Text style={styles.metaText}>{grupo.miembros?.length || 0} miembros</Text>
                </View>
              </View>
            </View>

            {puedeEditarGrupo() && (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton} onPress={handleEditarGrupo}>
                  <Ionicons name="create-outline" size={24} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => setModalFinalizarGrupo(true)}>
                  <MaterialCommunityIcons name="clipboard-check" size={24} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleEliminarGrupo}>
                  <Ionicons name="archive-outline" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Descripción */}
        {grupo.descripcion && (
          <View style={styles.section}>
            <Text style={styles.descripcion}>{grupo.descripcion}</Text>
          </View>
        )}

        {/* Miembros del Elenco */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="account-group" size={24} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Elenco</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAgregarMiembro}
            >
              <Ionicons name="add-circle" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {grupo.miembros && grupo.miembros.length > 0 ? (
            grupo.miembros.map((miembro, index) => (
              <View key={index} style={styles.miembroCard}>
                <View style={styles.miembroInfo}>
                  <View style={styles.miembroAvatar}>
                    <MaterialCommunityIcons 
                      name={miembro.rol_en_grupo === 'DIRECTOR' ? 'star' : 'account'} 
                      size={24} 
                      color={miembro.rol_en_grupo === 'DIRECTOR' ? colors.accent : colors.secondary} 
                    />
                  </View>
                  <View style={styles.miembroTexto}>
                    <Text style={styles.miembroNombre}>{miembro.nombre}</Text>
                    <Text style={styles.miembroRol}>
                      {miembro.rol_en_grupo === 'DIRECTOR' ? '⭐ Director' : 'Actor/Actriz'}
                    </Text>
                  </View>
                </View>
                {miembro.cedula !== grupo.director_cedula && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleEliminarMiembro(miembro)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-off" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay miembros agregados</Text>
            </View>
          )}
        </View>

        {/* Obras del Grupo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="drama-masks" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Obras</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCrearObra}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {obras.length > 0 ? (
            obras.map((obra) => (
              <TouchableOpacity
                key={obra.id}
                style={styles.obraCard}
                onPress={() => navigation.navigate('ObraDetail', { obraId: obra.id })}
              >
                <LinearGradient
                  colors={[colors.surface, colors.surfaceAlt]}
                  style={styles.obraCardGradient}
                >
                  <View style={styles.obraHeader}>
                    <Text style={styles.obraNombre}>{obra.nombre}</Text>
                    <View style={[
                      styles.estadoBadge,
                      { backgroundColor: 
                        obra.estado === 'LISTA' ? colors.success + '30' :
                        obra.estado === 'ARCHIVADA' ? colors.textMuted + '30' :
                        colors.warning + '30'
                      }
                    ]}>
                      <Text style={[
                        styles.estadoText,
                        { color:
                          obra.estado === 'LISTA' ? colors.success :
                          obra.estado === 'ARCHIVADA' ? colors.textMuted :
                          colors.warning
                        }
                      ]}>
                        {obra.estado === 'LISTA' ? 'Lista' : 
                         obra.estado === 'ARCHIVADA' ? 'Archivada' : 
                         'En Desarrollo'}
                      </Text>
                    </View>
                  </View>

                  {obra.descripcion && (
                    <Text style={styles.obraDescripcion} numberOfLines={2}>
                      {obra.descripcion}
                    </Text>
                  )}

                  <View style={styles.obraMeta}>
                    {obra.autor && (
                      <View style={styles.obraMetaItem}>
                        <MaterialCommunityIcons name="pencil" size={14} color={colors.textMuted} />
                        <Text style={styles.obraMetaText}>{obra.autor}</Text>
                      </View>
                    )}
                    {obra.genero && (
                      <View style={styles.obraMetaItem}>
                        <MaterialCommunityIcons name="theater" size={14} color={colors.textMuted} />
                        <Text style={styles.obraMetaText}>{obra.genero}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.obraActions}>
                    <TouchableOpacity
                      style={styles.obraActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditarObra(obra);
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.secondary} />
                      <Text style={styles.obraActionText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.obraActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEliminarObra(obra);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                      <Text style={[styles.obraActionText, { color: colors.error }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="drama-masks" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay obras creadas</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCrearObra}>
                <Text style={styles.emptyButtonText}>Crear Primera Obra</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Funciones del Grupo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="ticket" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Funciones</Text>
            </View>
            {puedeEditarGrupo() && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  // Navegar a crear función pre-llenando la obra si hay alguna
                  const obraParaFuncion = obras.find(o => o.estado === 'LISTA') || obras[0];
                  navigation.navigate('DirectorShows', {
                    obraId: obraParaFuncion?.id,
                    obraNombre: obraParaFuncion?.nombre,
                    grupoId: grupoId
                  });
                }}
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {funciones.length > 0 ? (
            funciones.map((funcion) => (
              <TouchableOpacity
                key={funcion.id}
                style={styles.funcionCard}
                onPress={() => navigation.navigate('DirectorShowDetail', { showId: funcion.id })}
              >
                <LinearGradient
                  colors={[colors.surface, colors.surfaceAlt]}
                  style={styles.obraCardGradient}
                >
                  <View style={styles.obraHeader}>
                    <Text style={styles.obraNombre}>{funcion.obra}</Text>
                    <View style={styles.estadoBadge}>
                      <Text style={styles.estadoText}>
                        {funcion.capacidad} entradas
                      </Text>
                    </View>
                  </View>

                  <View style={styles.obraMeta}>
                    <View style={styles.obraMetaItem}>
                      <MaterialCommunityIcons name="calendar" size={14} color={colors.textMuted} />
                      <Text style={styles.obraMetaText}>
                        {new Date(funcion.fecha).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.obraMetaItem}>
                      <MaterialCommunityIcons name="map-marker" size={14} color={colors.textMuted} />
                      <Text style={styles.obraMetaText}>{funcion.lugar || 'Teatro Principal'}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="ticket" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay funciones programadas</Text>
              {puedeEditarGrupo() && (
                <TouchableOpacity 
                  style={styles.emptyButton} 
                  onPress={() => navigation.navigate('DirectorShows', { grupoId })}
                >
                  <Text style={styles.emptyButtonText}>Crear Primera Función</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Editar Grupo */}
      <Modal
        visible={modalEditGrupo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalEditGrupo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Grupo</Text>
              <TouchableOpacity onPress={() => setModalEditGrupo(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Grupo *</Text>
                <TextInput
                  style={styles.input}
                  value={formGrupo.nombre}
                  onChangeText={(text) => setFormGrupo({ ...formGrupo, nombre: text })}
                  placeholder="Nombre del grupo"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formGrupo.descripcion}
                  onChangeText={(text) => setFormGrupo({ ...formGrupo, descripcion: text })}
                  placeholder="Descripción del grupo"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Obra a Realizar</Text>
                <TextInput
                  style={styles.input}
                  value={formGrupo.obra_a_realizar}
                  onChangeText={(text) => setFormGrupo({ ...formGrupo, obra_a_realizar: text })}
                  placeholder="Obra que trabajarán"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.infoText}>
                  El día y hora de clases NO se pueden modificar después de crear el grupo.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalEditGrupo(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleGuardarGrupo}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonPrimaryText}>Guardar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Agregar Miembro */}
      <Modal
        visible={modalAddMiembro}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAddMiembro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Miembro</Text>
              <TouchableOpacity onPress={() => setModalAddMiembro(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Seleccionar Actor/Director</Text>
              <ScrollView style={styles.actoresList}>
                {actoresDisponibles.map((actor) => (
                  <TouchableOpacity
                    key={actor.cedula}
                    style={[
                      styles.actorItem,
                      selectedActor === actor.cedula && styles.actorItemSelected
                    ]}
                    onPress={() => setSelectedActor(actor.cedula)}
                  >
                    <MaterialCommunityIcons 
                      name={actor.role === 'ADMIN' ? 'star' : 'account'} 
                      size={24} 
                      color={selectedActor === actor.cedula ? colors.accent : colors.textMuted} 
                    />
                    <View style={styles.actorInfo}>
                      <Text style={[
                        styles.actorNombre,
                        selectedActor === actor.cedula && styles.actorNombreSelected
                      ]}>
                        {actor.nombre}
                      </Text>
                      <Text style={styles.actorRol}>
                        {actor.role === 'ADMIN' ? 'Director' : 'Actor/Actriz'}
                      </Text>
                    </View>
                    {selectedActor === actor.cedula && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalAddMiembro(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleConfirmarAgregarMiembro}
              >
                <LinearGradient
                  colors={colors.gradientSecondary}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonPrimaryText}>Agregar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Obra */}
      <Modal
        visible={modalEditObra}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalEditObra(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Obra</Text>
              <TouchableOpacity onPress={() => setModalEditObra(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de la Obra *</Text>
                <TextInput
                  style={styles.input}
                  value={formObra.nombre}
                  onChangeText={(text) => setFormObra({ ...formObra, nombre: text })}
                  placeholder="Nombre de la obra"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formObra.descripcion}
                  onChangeText={(text) => setFormObra({ ...formObra, descripcion: text })}
                  placeholder="Sinopsis"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Autor</Text>
                <TextInput
                  style={styles.input}
                  value={formObra.autor}
                  onChangeText={(text) => setFormObra({ ...formObra, autor: text })}
                  placeholder="Autor de la obra"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Género</Text>
                <TextInput
                  style={styles.input}
                  value={formObra.genero}
                  onChangeText={(text) => setFormObra({ ...formObra, genero: text })}
                  placeholder="Drama, Comedia, etc."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duración (minutos)</Text>
                <TextInput
                  style={styles.input}
                  value={formObra.duracion_aprox}
                  onChangeText={(text) => setFormObra({ ...formObra, duracion_aprox: text })}
                  placeholder="120"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalEditObra(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleGuardarObra}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonPrimaryText}>Guardar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Finalizar Grupo */}
      <Modal
        visible={modalFinalizarGrupo}
        animationType="slide"
        transparent
        onRequestClose={() => setModalFinalizarGrupo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✅ Finalizar Grupo</Text>
              <TouchableOpacity onPress={() => setModalFinalizarGrupo(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Finalizar el grupo "{grupo?.nombre}" marcará el cierre del año.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Puntuación del Año (1-10) *</Text>
                <TextInput
                  style={styles.input}
                  value={formFinalizarGrupo.puntuacion}
                  onChangeText={(text) => setFormFinalizarGrupo({ ...formFinalizarGrupo, puntuacion: text })}
                  placeholder="8"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Conclusión del Año *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formFinalizarGrupo.conclusion}
                  onChangeText={(text) => setFormFinalizarGrupo({ ...formFinalizarGrupo, conclusion: text })}
                  placeholder="Escribe tus conclusiones sobre el año del grupo: aspectos positivos, áreas de mejora, logros alcanzados..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalFinalizarGrupo(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleFinalizarGrupo}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonPrimaryText}>Finalizar Grupo</Text>
                </LinearGradient>
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
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerGradient: {
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  fotoGrupo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  fotoGrupoImage: {
    width: '100%',
    height: '100%',
  },
  fotoGrupoPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  fotoGrupoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  headerInfo: {
    marginBottom: 15,
  },
  grupoNombre: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 30,
  },
  descripcion: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miembroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  miembroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  miembroAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miembroTexto: {
    flex: 1,
  },
  miembroNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  miembroRol: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  obraCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  funcionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  obraCardGradient: {
    padding: 16,
  },
  obraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  obraNombre: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 10,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  obraDescripcion: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 10,
  },
  obraMeta: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12,
  },
  obraMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  obraMetaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  obraActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  obraActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  obraActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.info + '15',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  actoresList: {
    maxHeight: 300,
  },
  actorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actorItemSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '15',
  },
  actorInfo: {
    flex: 1,
  },
  actorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actorNombreSelected: {
    color: colors.accent,
  },
  actorRol: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonPrimary: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
