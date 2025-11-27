import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { getShows, getReporteVentas } from '../services/api';

export default function ReportesScreen() {
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [reporteVentas, setReporteVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    setLoading(true);
    try {
      const data = await getShows();
      setShows(data);
      if (data.length > 0) {
        loadReporte(data[0].id);
        setSelectedShow(data[0].id);
      }
    } catch (error) {
      console.error('Error cargando funciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReporte = async (showId = null) => {
    setLoading(true);
    try {
      const data = await getReporteVentas(showId);
      setReporteVentas(data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReporte(selectedShow);
  };

  const handleShowSelect = (showId) => {
    setSelectedShow(showId);
    loadReporte(showId);
  };

  const renderVendedor = ({ item }) => (
    <View style={styles.vendedorCard}>
      <View style={styles.vendedorHeader}>
        <Text style={styles.vendedorNombre}>{item.vendedorNombre}</Text>
        <Text style={styles.vendedorMonto}>${item.montoTotal}</Text>
      </View>
      <View style={styles.vendedorStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>En Stock</Text>
          <Text style={styles.statValue}>{item.cantidadEnStock || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Reservados</Text>
          <Text style={styles.statValue}>{item.cantidadReservada || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Vendidos</Text>
          <Text style={styles.statValue}>{item.cantidadVendida || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Usados</Text>
          <Text style={styles.statValue}>{item.cantidadUsada || 0}</Text>
        </View>
      </View>
    </View>
  );

  const calcularTotal = () => {
    return reporteVentas.reduce((sum, item) => sum + item.montoTotal, 0);
  };

  const calcularTotalTickets = () => {
    return reporteVentas.reduce((sum, item) => sum + (item.cantidadVendida || 0), 0);
  };

  const calcularTotalReservados = () => {
    return reporteVentas.reduce((sum, item) => sum + (item.cantidadReservada || 0), 0);
  };

  const calcularTotalEnStock = () => {
    return reporteVentas.reduce((sum, item) => sum + (item.cantidadEnStock || 0), 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes de Ventas</Text>
        <Text style={styles.subtitle}>Resumen por vendedor</Text>
      </View>

      {/* Selector de función */}
      {shows.length > 0 && (
        <View style={styles.showSelector}>
          <Text style={styles.selectorLabel}>Función:</Text>
          <FlatList
            horizontal
            data={shows}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.showButton,
                  selectedShow === item.id && styles.showButtonSelected,
                ]}
                onPress={() => handleShowSelect(item.id)}
              >
                <Text
                  style={[
                    styles.showButtonText,
                    selectedShow === item.id && styles.showButtonTextSelected,
                  ]}
                >
                  {item.obra}
                </Text>
                <Text
                  style={[
                    styles.showButtonDate,
                    selectedShow === item.id && styles.showButtonDateSelected,
                  ]}
                >
                  {item.fecha}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Resumen general */}
      {reporteVentas.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen General</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>En Stock</Text>
              <Text style={styles.summaryValue}>{calcularTotalEnStock()}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Reservados</Text>
              <Text style={styles.summaryValue}>{calcularTotalReservados()}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Vendidos</Text>
              <Text style={styles.summaryValue}>{calcularTotalTickets()}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Recaudado</Text>
              <Text style={styles.summaryValue}>${calcularTotal()}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Lista de vendedores */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : reporteVentas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay ventas registradas</Text>
        </View>
      ) : (
        <FlatList
          data={reporteVentas}
          keyExtractor={(item) => item.vendedorId.toString()}
          renderItem={renderVendedor}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  showSelector: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  showButton: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  showButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  showButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  showButtonTextSelected: {
    color: colors.background,
  },
  showButtonDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  showButtonDateSelected: {
    color: colors.background,
    opacity: 0.9,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.background,
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
  },
  listContainer: {
    padding: 20,
  },
  vendedorCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vendedorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendedorNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  vendedorMonto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  vendedorStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
