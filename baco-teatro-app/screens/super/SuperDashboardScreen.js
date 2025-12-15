import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import StatCard from '../../components/StatCard';
import SectionCard from '../../components/SectionCard';
import ShowCard from '../../components/ShowCard';
import colors from '../../theme/colors';
import { getSuperDashboard } from '../../api';
import DailyQuote from '../../components/DailyQuote';

export default function SuperDashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getSuperDashboard();
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

  return (
    <ScreenContainer>
      <DailyQuote variant="card" />
      <Text style={styles.title}>Panel general</Text>
      <Text style={styles.subtitle}>Super usuario</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <StatCard label="Obras activas" value={data?.totals?.productions || 0} />
        <StatCard label="Funciones" value={data?.totals?.functions || 0} gradient={colors.gradientSecondary} />
        <StatCard label="Tickets generados" value={data?.totals?.tickets || 0} helper={`Vendidos: ${data?.totals?.sold || 0}`} />
        <StatCard label="Asistencias" value={data?.totals?.attendees || 0} />
      </ScrollView>

      {/* Sección de accesos rápidos combinados (director + vendedor) */}
      <SectionCard title="Accesos Rápidos" subtitle="Todas las funcionalidades">
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('DirectorVendors')}
          >
            <Ionicons name="people-outline" size={32} color={colors.secondary} />
            <Text style={styles.quickActionText}>Vendedores</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('DirectorScanner')}
          >
            <Ionicons name="qr-code-outline" size={32} color={colors.secondary} />
            <Text style={styles.quickActionText}>Validar QR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('ActorTransfer')}
          >
            <Ionicons name="swap-horizontal-outline" size={32} color={colors.secondary} />
            <Text style={styles.quickActionText}>Transferir</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('DirectorReportsObras')}
          >
            <Ionicons name="document-text-outline" size={32} color={colors.secondary} />
            <Text style={styles.quickActionText}>Reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('ActorHistory')}
          >
            <Ionicons name="time-outline" size={32} color={colors.secondary} />
            <Text style={styles.quickActionText}>Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Productions')}
          >
            <Ionicons name="color-palette-outline" size={32} color={colors.secondary} />
            <Text style={styles.quickActionText}>Producciones</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('FuncionesConcluideas')}
          >
            <Ionicons name="checkmark-circle-outline" size={32} color="#4CAF50" />
            <Text style={styles.quickActionText}>Concluidas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('GruposFinalizados')}
          >
            <Ionicons name="archive-outline" size={32} color="#FF9800" />
            <Text style={styles.quickActionText}>Finalizados</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard title="Alertas" subtitle="Movimientos clave de directores">
        {(data?.alerts || []).map((alert) => (
          <View key={alert.id} style={styles.alertRow}>
            <View style={styles.alertDot} />
            <View>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertBody}>{alert.body}</Text>
            </View>
          </View>
        ))}
        {(!data?.alerts || data.alerts.length === 0) && (
          <Text style={styles.empty}>Sin novedades por ahora</Text>
        )}
      </SectionCard>

      <SectionCard title="Próximas funciones" subtitle="48 horas">
        {(data?.upcomingShows || []).map((show) => (
          <ShowCard key={show.id} show={show}
            footer={<Text style={styles.showFooter}>{show.ventasPagadas} entradas pagadas · {show.actoresAsignados} actores</Text>}
          />
        ))}
        {(!data?.upcomingShows || data.upcomingShows.length === 0) && (
          <Text style={styles.empty}>No hay funciones agendadas</Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: 16,
  },
  statsRow: {
    marginBottom: 16,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  alertDot: {
    width: 10,
    height: 10,
    marginTop: 6,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  alertTitle: {
    color: colors.white,
    fontWeight: '700',
  },
  alertBody: {
    color: colors.textMuted,
  },
  empty: {
    color: colors.textSoft,
    fontStyle: 'italic',
  },
  showFooter: {
    color: colors.textMuted,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  quickAction: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
