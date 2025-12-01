import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import StatCard from '../../components/StatCard';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { getDirectorDashboard, deleteVendor } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import DailyQuote from '../../components/DailyQuote';

export default function DirectorDashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadData = async () => {
    try {
      const snapshot = await getDirectorDashboard();
      setData(snapshot);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  const handleDeleteVendor = (actorId) => {
    Alert.alert('Eliminar vendedor', 'El stock pendiente volverá a dirección. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVendor(actorId);
            onRefresh();
          } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <Animated.View style={{ opacity: fadeAnim, gap: 14 }}>
        <DailyQuote variant="card" />
        <Text style={styles.title}>Hola, director</Text>
        <Text style={styles.subtitle}>{data?.obraPrincipal || 'Tus producciones'}</Text>

        <View style={styles.statsRow}>
          <StatCard label="Entradas" value={data?.stats?.tickets || 0} helper={`Pagadas ${data?.stats?.pagadas || 0}`} />
          <StatCard label="Actores" value={data?.stats?.actores || 0} gradient={colors.gradientSecondary} />
        </View>

        <TouchableOpacity 
          style={styles.reportesButton}
          onPress={() => navigation.navigate('DirectorReportsObras')}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reportesTitle}>Reportes de Obras</Text>
            <Text style={styles.reportesSubtitle}>Ver historial de funciones finalizadas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <SectionCard title="Salas abiertas" subtitle="Estado por función">
          {(data?.functions || []).map((funcion) => (
            <View key={funcion.id} style={styles.functionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.functionTitle}>{funcion.titulo}</Text>
                <Text style={styles.functionMeta}>{new Date(funcion.fecha).toLocaleString()} /  {funcion.localidad}</Text>
              </View>
              <View style={styles.functionStats}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Pagadas {funcion.pagadas}</Text>
                </View>
                <Text style={styles.metaText}>Ingresadas {funcion.usadas}</Text>
              </View>
            </View>
          ))}
          {(!data?.functions || data.functions.length === 0) && (
            <Text style={styles.empty}>Todavía no creaste funciones</Text>
          )}
        </SectionCard>

        <SectionCard title="Actores" subtitle="Resultado por vendedor">
          {(data?.actors || []).map((actor) => (
            <View key={actor.id} style={styles.actorRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.actorName}>{actor.nombre}</Text>
                <Text style={styles.metaText}>Stock {actor.stock} /  Vendidas {actor.vendidas}</Text>
              </View>
              <View style={styles.actorActions}>
                <Text style={[styles.metaText, styles.alignRight, styles.moneyText]}>${actor.caja}</Text>
                {['ADMIN', 'SUPER'].includes(user?.role) && (
                  <TouchableOpacity 
                    onPress={() => handleDeleteVendor(actor.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {(!data?.actors || data.actors.length === 0) && (
            <Text style={styles.empty}>Aún no hay actores asignados</Text>
          )}
        </SectionCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: -8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  functionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  functionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  functionMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  functionStats: {
    alignItems: 'flex-end',
  },
  pill: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  pillText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alignRight: {
    textAlign: 'right',
  },
  moneyText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  reportesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
    gap: 12,
  },
  reportesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  reportesSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
