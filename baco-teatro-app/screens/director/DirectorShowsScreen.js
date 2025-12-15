import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import ShowCard from '../../components/ShowCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listDirectorShows, getSession } from '../../api';

export default function DirectorShowsScreen({ navigation }) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soloMisFunciones, setSoloMisFunciones] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listDirectorShows();
      setShows(data);
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

  const funcionesFiltradas = shows.filter(show => {
    if (!soloMisFunciones) return true;
    const currentUser = getSession().user;
    return show.director_cedula === currentUser?.id;
  });

  return (
    <ScreenContainer>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🎭 Funciones del Teatro</Text>
            <Text style={styles.subtitle}>Todas las funciones programadas</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filtro Solo Mis Funciones */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Solo mis funciones</Text>
        <Switch
          value={soloMisFunciones}
          onValueChange={setSoloMisFunciones}
          trackColor={{ false: colors.textMuted, true: colors.secondary }}
          thumbColor={soloMisFunciones ? colors.primary : colors.text}
        />
      </View>

      {/* Lista de Funciones */}
      <View style={styles.funcionesList}>
        {loading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : funcionesFiltradas.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="ticket-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {soloMisFunciones ? 'No tienes funciones creadas' : 'No hay funciones en el teatro'}
            </Text>
          </View>
        ) : (
          funcionesFiltradas.map((show) => (
            <View key={show.id} style={styles.showItemContainer}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('DirectorShowDetail', { show })}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <ShowCard
                  show={show}
                  footer={(
                    <View>
                      {show.grupo_nombre && (
                        <TouchableOpacity
                          style={styles.grupoLink}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (show.grupo_id) {
                              navigation.navigate('GrupoDetail', { grupoId: show.grupo_id });
                            }
                          }}
                        >
                          <MaterialCommunityIcons name="drama-masks" size={16} color={colors.secondary} />
                          <Text style={styles.grupoNombre}>{show.grupo_nombre}</Text>
                          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  funcionesList: {
    gap: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  showItemContainer: {
    marginBottom: 12,
  },
  grupoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + '80',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  grupoNombre: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
