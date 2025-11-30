import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
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
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDirectorDashboard();
        setData(snapshot);
      } finally {
        setLoading(false);
      }
    })();
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
    Alert.alert('Eliminar vendedor', 'El stock pendiente volvera a direccion. ?Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVendor(actorId);
            const snapshot = await getDirectorDashboard();
            setData(snapshot);
          } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <DailyQuote variant="card" />
      <Text style={styles.title}>Hola, director</Text>
      <Text style={styles.subtitle}>{data?.obraPrincipal || 'Tus producciones'}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Entradas" value={data?.stats?.tickets || 0} helper={`Pagadas ${data?.stats?.pagadas || 0}`} />
        <StatCard label="Actores" value={data?.stats?.actores || 0} gradient={colors.gradientSecondary} />
      </View>

      <SectionCard title="Salas abiertas" subtitle="Estado por funcion">
        {(data?.functions || []).map((funcion) => (
          <View key={funcion.id} style={styles.functionRow}>
            <View>
              <Text style={styles.functionTitle}>{funcion.titulo}</Text>
              <Text style={styles.functionMeta}>{new Date(funcion.fecha).toLocaleString()} /  {funcion.localidad}</Text>
            </View>
            <View style={styles.functionStats}>
              <Text style={styles.metaText}>Pagadas {funcion.pagadas}</Text>
              <Text style={styles.metaText}>Ingresadas {funcion.usadas}</Text>
            </View>
          </View>
        ))}
        {(!data?.functions || data.functions.length === 0) && (
          <Text style={styles.empty}>Todavia no creaste funciones</Text>
        )}
      </SectionCard>

      <SectionCard title="Actores" subtitle="Resultado por vendedor">
        {(data?.actors || []).map((actor) => (
          <View key={actor.id} style={styles.actorRow}>
            <View>
              <Text style={styles.actorName}>{actor.nombre}</Text>
              <Text style={styles.metaText}>Stock {actor.stock} /  Vendidas {actor.vendidas}</Text>
            </View>
            <View style={styles.actorActions}>
              <Text style={[styles.metaText, styles.alignRight]}>${actor.caja}</Text>
              {['ADMIN', 'SUPER'].includes(user?.role) && (
                <TouchableOpacity onPress={() => handleDeleteVendor(actor.id)}>
                  <Text style={styles.deleteText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textMuted, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  functionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  functionTitle: { color: colors.white, fontWeight: '700' },
  functionMeta: { color: colors.textMuted, fontSize: 12 },
  functionStats: { alignItems: 'flex-end' },
  metaText: { color: colors.textSoft, fontSize: 12 },
  actorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actorName: { color: colors.white, fontWeight: '600' },
  alignRight: { textAlign: 'right' },
  empty: { color: colors.textSoft, fontStyle: 'italic' },
  actorActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deleteText: {
    color: colors.error,
    fontWeight: '700',
  },
});
