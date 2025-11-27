import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import colors from '../theme/colors';
import {
  getShows,
  reporteResumenAdmin,
  reporteDeudores,
  reporteVendedores,
} from '../api/api';

export default function ReportesScreen() {
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState('');
  const [resumenAdmin, setResumenAdmin] = useState(null);
  const [deudores, setDeudores] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    if (selectedShow) {
      loadReportes();
    }
  }, [selectedShow]);

  const loadShows = async () => {
    try {
      const data = await getShows();
      setShows(data);
      if (data.length > 0) {
        setSelectedShow(data[0].id.toString());
      }
    } catch (error) {
      console.error('Error cargando shows:', error);
      Alert.alert('Error', 'No se pudieron cargar las funciones');
    }
  };

  const loadReportes = async () => {
    setLoading(true);
    try {
      const [admin, deud, vend] = await Promise.all([
        reporteResumenAdmin(selectedShow),
        reporteDeudores(selectedShow),
        reporteVendedores(selectedShow),
      ]);

      setResumenAdmin(admin);
      setDeudores(deud);
      setVendedores(vend);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  if (shows.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No hay funciones creadas.{'\n'}Crea una función primero.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes Financieros</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedShow}
            onValueChange={setSelectedShow}
            style={styles.picker}
          >
            {shows.map((show) => (
              <Picker.Item
                key={show.id}
                label={`${show.obra} - ${new Date(show.fecha).toLocaleDateString('es-AR')}`}
                value={show.id.toString()}
              />
            ))}
          </Picker>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Resumen General */}
          {resumenAdmin && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Resumen General</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{resumenAdmin.total_tickets}</Text>
                  <Text style={styles.statLabel}>Total Tickets</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{resumenAdmin.tickets_vendidos}</Text>
                  <Text style={styles.statLabel}>Vendidos</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    ${resumenAdmin.total_cobrado}
                  </Text>
                  <Text style={styles.statLabel}>Cobrado</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.warning }]}>
                    ${resumenAdmin.total_reportado}
                  </Text>
                  <Text style={styles.statLabel}>Reportado</Text>
                </View>
              </View>
            </View>
          )}

          {/* Vendedores */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👥 Por Vendedor</Text>
            {vendedores.map((v) => (
              <View key={v.vendedor_phone} style={styles.vendedorItem}>
                <Text style={styles.vendedorName}>{v.vendedor_nombre}</Text>
                <View style={styles.vendedorStats}>
                  <Text style={styles.vendedorStat}>
                    Asignados: {v.asignados}
                  </Text>
                  <Text style={styles.vendedorStat}>
                    Vendidos: {v.vendidos}
                  </Text>
                  <Text style={styles.vendedorStat}>
                    Cobrado: ${v.monto_cobrado}
                  </Text>
                  <Text
                    style={[
                      styles.vendedorStat,
                      { color: v.monto_debe > 0 ? colors.error : colors.success },
                    ]}
                  >
                    Debe: ${v.monto_debe}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Deudores */}
          {deudores.length > 0 && (
            <View style={[styles.card, styles.alertCard]}>
              <Text style={styles.cardTitle}>⚠️ Deudores</Text>
              {deudores.map((d) => (
                <View key={d.vendedor_phone} style={styles.deudorItem}>
                  <View>
                    <Text style={styles.deudorName}>{d.vendedor_nombre}</Text>
                    <Text style={styles.deudorPhone}>{d.vendedor_phone}</Text>
                  </View>
                  <View style={styles.deudorAmount}>
                    <Text style={styles.deudorValue}>${d.monto_debe}</Text>
                    <Text style={styles.deudorLabel}>Pendiente</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 16,
    lineHeight: 24,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },
  vendedorItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: 12,
  },
  vendedorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  vendedorStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vendedorStat: {
    fontSize: 13,
    color: colors.gray,
  },
  deudorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  deudorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  deudorPhone: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  deudorAmount: {
    alignItems: 'flex-end',
  },
  deudorValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
  },
  deudorLabel: {
    fontSize: 12,
    color: colors.gray,
  },
});
