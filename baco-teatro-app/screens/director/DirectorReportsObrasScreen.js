import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  Modal,
  Linking,
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { 
  listarReportesObras, 
  obtenerReporteObra, 
  eliminarReporteObra 
} from '../../api';

export default function DirectorReportsObrasScreen({ navigation }) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listarReportesObras();
      setReportes(data);
    } catch (error) {
      showError(error.message || 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation]);

  const handleVerDetalle = async (reporte) => {
    try {
      const detalle = await obtenerReporteObra(reporte.id);
      setSelectedReporte(detalle);
      setModalVisible(true);
    } catch (error) {
      showError(error.message || 'No se pudo cargar el reporte');
    }
  };

  const handleEliminar = (reporte) => {
    Alert.alert(
      '🗑️ Eliminar Reporte',
      `¿Estás seguro de eliminar el reporte de "${reporte.nombreObra}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarReporteObra(reporte.id);
              load();
              showSuccess('🗑️ Reporte eliminado con éxito');
            } catch (error) {
              showError(error.message || 'No se pudo eliminar el reporte');
            }
          },
        },
      ]
    );
  };

  const handleDescargarPDF = async (reporte) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://baco-teatro-1jxj.onrender.com';
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        showError('No hay sesión activa');
        return;
      }
      
      const url = `${API_URL}/api/reportes-obras/${reporte.id}/pdf`;
      
      Alert.alert(
        '💾 Descargar PDF',
        'Se abrirá el PDF en tu navegador',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir',
            onPress: () => {
              // En web abrimos la URL directamente con el token en headers
              // En móvil, usamos Linking
              if (Platform.OS === 'web') {
                window.open(`${url}?token=${token}`, '_blank');
              } else {
                Linking.openURL(`${url}?token=${token}`);
              }
              showInfo('Abriendo PDF...');
            }
          }
        ]
      );
    } catch (error) {
      showError(error.message || 'No se pudo descargar el PDF');
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-UY', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonto = (monto) => {
    return `$${parseFloat(monto || 0).toFixed(2)}`;
  };

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>📊 Reportes</Text>
            <Text style={styles.headerSubtitle}>Historial de obras</Text>
          </View>
          <MaterialCommunityIcons name="file-chart" size={48} color="#8B0000" />
        </View>
      </LinearGradient>

      <SectionCard title="Reportes Generados" subtitle={`${reportes.length} reportes`}>
        {loading ? (
          <ActivityIndicator color={colors.secondary} size="large" />
        ) : reportes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay reportes generados</Text>
            <Text style={styles.emptySubtext}>
              Los reportes se generan desde la pantalla de Obras
            </Text>
          </View>
        ) : (
          reportes.map((reporte) => (
            <View key={reporte.id} style={styles.reporteCard}>
              <TouchableOpacity 
                onPress={() => handleVerDetalle(reporte)}
                style={styles.reporteContent}
              >
                <View style={styles.reporteHeader}>
                  <Text style={styles.reporteNombre}>{reporte.nombreObra}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                </View>
                
                <View style={styles.reporteInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.infoText}>
                      Función: {formatFecha(reporte.fechaShow)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.infoText}>
                      Generado: {formatFecha(reporte.fechaGeneracion)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{reporte.ticketsVendidos}</Text>
                    <Text style={styles.statLabel}>Vendidos</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{reporte.ticketsUsados}</Text>
                    <Text style={styles.statLabel}>Asistieron</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValueMoney}>
                      {formatMonto(reporte.ingresosTotales)}
                    </Text>
                    <Text style={styles.statLabel}>Ingresos</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.reporteActions}>
                <TouchableOpacity 
                  onPress={() => handleDescargarPDF(reporte)}
                  style={styles.downloadButton}
                >
                  <Ionicons name="download-outline" size={18} color={colors.secondary} />
                  <Text style={styles.downloadText}>Descargar PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleEliminar(reporte)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={styles.deleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      {/* Modal de Detalle */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedReporte && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedReporte.nombreObra}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>📊 Resumen General</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Tickets:</Text>
                      <Text style={styles.detailValue}>{selectedReporte.totalTickets}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Vendidos:</Text>
                      <Text style={styles.detailValue}>{selectedReporte.ticketsVendidos}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Usados (Asistieron):</Text>
                      <Text style={styles.detailValue}>{selectedReporte.ticketsUsados}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ingresos Totales:</Text>
                      <Text style={styles.detailValueMoney}>
                        {formatMonto(selectedReporte.ingresosTotales)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>👥 Por Vendedor</Text>
                    {selectedReporte.vendedores && selectedReporte.vendedores.map((vendedor, idx) => (
                      <View key={idx} style={styles.vendedorCard}>
                        <View style={styles.vendedorHeader}>
                          <Text style={styles.vendedorNombre}>{vendedor.name}</Text>
                          <Text style={styles.vendedorCedula}>CI: {vendedor.cedula}</Text>
                        </View>
                        <View style={styles.vendedorStats}>
                          <Text style={styles.vendedorStat}>
                            Asignados: <Text style={styles.vendedorStatValue}>{vendedor.asignados}</Text>
                          </Text>
                          <Text style={styles.vendedorStat}>
                            Vendidos: <Text style={styles.vendedorStatValue}>{vendedor.vendidos}</Text>
                          </Text>
                          <Text style={styles.vendedorStat}>
                            Usados: <Text style={styles.vendedorStatValue}>{vendedor.usados}</Text>
                          </Text>
                          <Text style={styles.vendedorStat}>
                            Ingresos: <Text style={styles.vendedorStatMoney}>
                              {formatMonto(vendedor.ingresos)}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>🎫 Estados de Tickets</Text>
                    {selectedReporte.ventas && (
                      <>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>No Asignados:</Text>
                          <Text style={styles.detailValue}>{selectedReporte.ventas.noAsignados}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>En Poder:</Text>
                          <Text style={styles.detailValue}>{selectedReporte.ventas.enPoder}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Vendidas (No Pagadas):</Text>
                          <Text style={styles.detailValue}>{selectedReporte.ventas.vendidasNoPagadas}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Vendidas (Pagadas):</Text>
                          <Text style={styles.detailValue}>{selectedReporte.ventas.vendidasPagadas}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Usadas:</Text>
                          <Text style={styles.detailValue}>{selectedReporte.ventas.usadas}</Text>
                        </View>
                      </>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
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
  headerGradient: {
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#000',
    opacity: 0.8,
    marginTop: 4,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.textSoft,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  reporteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  reporteContent: {
    padding: 16,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reporteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  reporteInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  statValueMoney: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  reporteActions: {
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  downloadText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  deleteText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
    flex: 1,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  detailValueMoney: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
  },
  vendedorCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vendedorHeader: {
    marginBottom: 8,
  },
  vendedorNombre: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.white,
  },
  vendedorCedula: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  vendedorStats: {
    gap: 4,
  },
  vendedorStat: {
    fontSize: 13,
    color: colors.textMuted,
  },
  vendedorStatValue: {
    color: colors.text,
    fontWeight: '600',
  },
  vendedorStatMoney: {
    color: colors.success,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
