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
