import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import TransferTimeline from '../../components/TransferTimeline';
import colors from '../../theme/colors';
import { getDirectorReports } from '../../api';

export default function DirectorReportsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const report = await getDirectorReports();
        setData(report);
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
      <SectionCard title="Estado por actor" subtitle="Ventas y deuda">
        {(data?.actors || []).map((actor) => (
          <View key={actor.id} style={styles.actorRow}>
            <View>
              <Text style={styles.actorName}>{actor.name}</Text>
              <Text style={styles.meta}>Vendidas {actor.vendidas} · Pagadas {actor.pagadas}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amount}>${actor.entregado}</Text>
              <Text style={[styles.meta, actor.deuda > 0 && styles.debt]}>Deuda ${actor.deuda}</Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Movimientos recientes" subtitle="Transferencias y reportes">
        <TransferTimeline events={data?.events || []} />
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actorName: { color: colors.white, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 },
  amount: { color: colors.secondary, fontWeight: '700' },
  debt: { color: colors.error },
});
