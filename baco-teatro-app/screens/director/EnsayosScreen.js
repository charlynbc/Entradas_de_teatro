import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { listarEnsayos } from '../../api';
import colors from '../../theme/colors';

export default function EnsayosScreen({ navigation }) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [ensayos, setEnsayos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarEnsayos();
  }, []);

  const cargarEnsayos = async () => {
    try {
      const data = await listarEnsayos();
      setEnsayos(data);
    } catch (error) {
      showError('Error al cargar ensayos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarEnsayos();
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderEnsayo = (ensayo) => {
    const fechaPasada = new Date(ensayo.fecha) < new Date();
    
    return (
      <TouchableOpacity
        key={ensayo.id}
        style={styles.ensayoCard}
        onPress={() => navigation.navigate('EnsayoDetail', { ensayoId: ensayo.id })}
        activeOpacity={0.7}
      >
        {/* Header con Grupo */}
        <View style={styles.ensayoHeader}>
          <View style={styles.grupoTag}>
            <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} />
            <Text style={styles.grupoNombre} numberOfLines={1}>
              {ensayo.grupo_nombre || 'Sin grupo'}
            </Text>
          </View>
          
          {fechaPasada && (
            <View style={styles.pasadoBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.pasadoText}>Realizado</Text>
            </View>
          )}
        </View>

        {/* Título */}
        <Text style={styles.ensayoTitulo}>{ensayo.titulo}</Text>

        {/* Obra */}
        {ensayo.grupo_obra && (
          <View style={styles.obraContainer}>
            <MaterialCommunityIcons name="drama-masks" size={16} color={colors.secondary} />
            <Text style={styles.obraText} numberOfLines={1}>{ensayo.grupo_obra}</Text>
          </View>
        )}

        {/* Meta info */}
        <View style={styles.ensayoMeta}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatearFecha(ensayo.fecha)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {ensayo.grupo_dia_semana} • {ensayo.hora_fin?.substring(0, 5)}
              </Text>
            </View>

            {ensayo.lugar && (
              <View style={styles.metaItem}>
                <Ionicons name="location" size={16} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{ensayo.lugar}</Text>
              </View>
            )}
          </View>

          {/* Director y miembros */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-star" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {ensayo.grupo_director_nombre || 'Sin director'}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-multiple" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {ensayo.miembros_activos || 0} miembros
              </Text>
            </View>
          </View>
        </View>

        {/* Descripción */}
        {ensayo.descripcion && (
          <Text style={styles.descripcion} numberOfLines={2}>
            {ensayo.descripcion}
          </Text>
        )}

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  // Separar ensayos próximos y pasados
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const ensayosProximos = ensayos.filter(e => new Date(e.fecha) >= hoy);
  const ensayosPasados = ensayos.filter(e => new Date(e.fecha) < hoy);

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="loading" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Cargando ensayos...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Ensayos</Text>
            <Text style={styles.subtitle}>
              {ensayos.length} {ensayos.length === 1 ? 'ensayo programado' : 'ensayos programados'}
            </Text>
          </View>
        </View>

        {/* Ensayos Próximos */}
        {ensayosProximos.length > 0 && (
          <SectionCard
            title={
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="calendar-clock" size={22} color={colors.secondary} />
                <Text style={styles.sectionTitleText}>Próximos Ensayos</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{ensayosProximos.length}</Text>
                </View>
              </View>
            }
          >
            {ensayosProximos.map(ensayo => renderEnsayo(ensayo))}
          </SectionCard>
        )}

        {/* Ensayos Pasados */}
        {ensayosPasados.length > 0 && (
          <SectionCard
            title={
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="history" size={22} color={colors.textMuted} />
                <Text style={styles.sectionTitleText}>Ensayos Realizados</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.textMuted + '20' }]}>
                  <Text style={[styles.countBadgeText, { color: colors.textMuted }]}>
                    {ensayosPasados.length}
                  </Text>
                </View>
              </View>
            }
          >
            {ensayosPasados.map(ensayo => renderEnsayo(ensayo))}
          </SectionCard>
        )}

        {ensayos.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No hay ensayos programados</Text>
            <Text style={styles.emptyText}>
              Los ensayos se crean desde la pantalla de Grupos
            </Text>
          </View>
        )}
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
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  ensayoCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
    position: 'relative',
  },
  ensayoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  grupoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
  },
  grupoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  pasadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pasadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  ensayoTitulo: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  obraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  obraText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  ensayoMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 120,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  descripcion: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  chevronContainer: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -10 }],
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
    textAlign: 'center',
  },
});
