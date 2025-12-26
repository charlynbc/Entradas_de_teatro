import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { colors } from '../../theme/colors';
import { listarGruposFinalizados, descargarPDFGrupo } from '../../api';
import { useToast } from '../../hooks/useToast';

export default function GruposFinalizadosScreen({ navigation }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const cargarGrupos = useCallback(async () => {
    try {
      const data = await listarGruposFinalizados();
      setGrupos(data);
    } catch (error) {
      console.error('Error cargando grupos finalizados:', error);
      showToast(error.message || 'Error cargando grupos', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarGrupos();
  }, [cargarGrupos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarGrupos();
  }, [cargarGrupos]);

  const handleDescargarPDF = async (grupoId) => {
    try {
      await descargarPDFGrupo(grupoId);
      showToast('Descargando informe...', 'success');
    } catch (error) {
      showToast('Error descargando PDF', 'error');
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Grupos Finalizados</Text>
          <Text style={styles.headerSubtitle}>Historial de grupos</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Grupos Finalizados</Text>
        <Text style={styles.headerSubtitle}>
          {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        {grupos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="account-group-outline" 
              size={64} 
              color={colors.textMuted} 
            />
            <Text style={styles.emptyText}>No hay grupos finalizados aún</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {grupos.map((grupo) => (
              <View key={grupo.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <MaterialCommunityIcons 
                      name="account-group" 
                      size={24} 
                      color={colors.secondary} 
                    />
                    <Text style={styles.cardTitle}>{grupo.nombre}</Text>
                  </View>
                  {grupo.puntuacion && (
                    <View style={styles.puntuacionBadge}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                      <Text style={styles.puntuacionText}>{grupo.puntuacion}/10</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="account-tie" size={16} color={colors.textMuted} />
                    <Text style={styles.infoText}>Director: {grupo.director_nombre}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="calendar-range" size={16} color={colors.textMuted} />
                    <Text style={styles.infoText}>
                      {new Date(grupo.fecha_inicio).toLocaleDateString('es-UY')} - {new Date(grupo.fecha_fin).toLocaleDateString('es-UY')}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.infoText}>
                      {grupo.dia_semana} a las {grupo.hora_inicio.substring(0, 5)}
                    </Text>
                  </View>

                  {grupo.obra_a_realizar && (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="script-text" size={16} color={colors.textMuted} />
                      <Text style={styles.infoText}>{grupo.obra_a_realizar}</Text>
                    </View>
                  )}

                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="account-multiple" size={20} color={colors.secondary} />
                      <Text style={styles.statNumber}>{grupo.total_miembros || 0}</Text>
                      <Text style={styles.statLabel}>Miembros</Text>
                    </View>

                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="theater" size={20} color={colors.secondary} />
                      <Text style={styles.statNumber}>{grupo.total_obras || 0}</Text>
                      <Text style={styles.statLabel}>Obras</Text>
                    </View>

                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="run" size={20} color={colors.secondary} />
                      <Text style={styles.statNumber}>{grupo.total_ensayos || 0}</Text>
                      <Text style={styles.statLabel}>Ensayos</Text>
                    </View>
                  </View>

                  {grupo.conclusion && (
                    <View style={styles.conclusionContainer}>
                      <Text style={styles.conclusionLabel}>Conclusión del Año:</Text>
                      <Text style={styles.conclusionText} numberOfLines={4}>
                        {grupo.conclusion}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={() => handleDescargarPDF(grupo.id)}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFF" />
                    <Text style={styles.pdfButtonText}>Descargar Informe Completo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: colors.bgCard,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  puntuacionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  puntuacionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginLeft: 4,
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  conclusionContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.bgLight,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  conclusionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 4,
  },
  conclusionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
});
