import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { getActorHistory } from '../../api';

export default function ActorHistoryScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getActorHistory();
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
      <SectionCard title="Caja" subtitle="Resumen de movimientos">
        <View style={styles.row}>
          <Text style={styles.label}>Vendidas</Text>
          <Text style={styles.value}>{data?.resumen?.vendidas || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Pagadas</Text>
          <Text style={styles.value}>{data?.resumen?.pagadas || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Caja entregada</Text>
          <Text style={[styles.value, styles.success]}>${data?.resumen?.entregado || 0}</Text>
        </View>
      </SectionCard>

      <SectionCard title="Entradas usadas" subtitle="Ingreso de público">
        {(data?.usadas || []).map((item) => (
          <View key={item.showId} style={styles.row}>
            <View>
              <Text style={styles.label}>{item.obra}</Text>
              <Text style={styles.meta}>{new Date(item.fecha).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.value}>{item.cantidad}</Text>
          </View>
        ))}
        {(!data?.usadas || data.usadas.length === 0) && (
          <Text style={styles.meta}>Aún no se registran ingresos</Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.white, fontWeight: '600' },
  value: { color: colors.white, fontWeight: '700' },
  success: { color: colors.secondary },
  meta: { color: colors.textMuted, fontSize: 12 },
});
