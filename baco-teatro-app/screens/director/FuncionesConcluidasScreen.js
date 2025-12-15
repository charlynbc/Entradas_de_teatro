import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { colors } from '../../theme/colors';
import { listarFuncionesConcluideas, descargarPDFFuncion } from '../../api';
import { useToast } from '../../hooks/useToast';

export default function FuncionesConcluidasScreen({ navigation }) {
  const [funciones, setFunciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const cargarFunciones = useCallback(async () => {
    try {
      const data = await listarFuncionesConcluideas();
      setFunciones(data);
    } catch (error) {
      console.error('Error cargando funciones concluidas:', error);
      showToast(error.message || 'Error cargando funciones', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarFunciones();
  }, [cargarFunciones]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarFunciones();
  }, [cargarFunciones]);

  const handleDescargarPDF = async (funcionId) => {
    try {
      await descargarPDFFuncion(funcionId);
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
          <Text style={styles.headerTitle}>Funciones Concluidas</Text>
          <Text style={styles.headerSubtitle}>Historial y evaluaciones</Text>
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
        <Text style={styles.headerTitle}>Funciones Concluidas</Text>
        <Text style={styles.headerSubtitle}>
          {funciones.length} {funciones.length === 1 ? 'función' : 'funciones'}
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
        {funciones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="archive-outline" 
              size={64} 
              color={colors.textMuted} 
            />
            <Text style={styles.emptyText}>No hay funciones concluidas aún</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {funciones.map((funcion) => (
              <View key={funcion.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <MaterialCommunityIcons 
                      name="clipboard-check" 
                      size={24} 
                      color={colors.secondary} 
                    />
                    <Text style={styles.cardTitle}>{funcion.obra_nombre || funcion.obra}</Text>
                  </View>
                  {funcion.puntuacion && (
                    <View style={styles.puntuacionBadge}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                      <Text style={styles.puntuacionText}>{funcion.puntuacion}/10</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color={colors.textMuted} />
                    <Text style={styles.infoText}>
                      {new Date(funcion.fecha).toLocaleDateString('es-UY', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={colors.textMuted} />
                    <Text style={styles.infoText}>{funcion.lugar || 'Sin lugar'}</Text>
                  </View>

                  {funcion.grupo_nombre && (
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => {
                        if (funcion.grupo_id) {
                          navigation.navigate('GrupoDetail', { grupoId: funcion.grupo_id });
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="drama-masks" size={16} color={colors.secondary} />
                      <Text style={[styles.infoText, styles.linkText]}>{funcion.grupo_nombre}</Text>
                    </TouchableOpacity>
                  )}

                  {funcion.conclusion_director && (
                    <View style={styles.conclusionContainer}>
                      <Text style={styles.conclusionLabel}>Conclusión:</Text>
                      <Text style={styles.conclusionText} numberOfLines={3}>
                        {funcion.conclusion_director}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={() => handleDescargarPDF(funcion.id)}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFF" />
                    <Text style={styles.pdfButtonText}>Descargar Informe</Text>
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
  linkText: {
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
  conclusionContainer: {
    marginTop: 12,
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
