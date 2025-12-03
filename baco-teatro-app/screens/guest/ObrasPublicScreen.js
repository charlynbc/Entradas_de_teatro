import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import colors from '../../theme/colors';
import { listarObras } from '../../api';

export default function ObrasPublicScreen({ navigation }) {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    setLoading(true);
    try {
      const data = await listarObras();
      setObras(data.filter(o => o.activa));
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>🎭 Cartelera</Text>
            <Text style={styles.subtitle}>Obras en temporada</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : obras.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="theater" size={80} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay obras disponibles</Text>
          </View>
        ) : (
          obras.map((obra) => (
            <TouchableOpacity
              key={obra.id}
              style={styles.obraCard}
              onPress={() => navigation.navigate('FuncionesPublic', { obra })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B0000', '#DC143C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {obra.imagen_url ? (
                  <Image source={{ uri: obra.imagen_url }} style={styles.obraImagen} />
                ) : (
                  <View style={styles.placeholderImagen}>
                    <MaterialCommunityIcons name="theater" size={60} color="#FFD700" />
                  </View>
                )}
                
                <View style={styles.obraInfo}>
                  <Text style={styles.obraNombre}>{obra.nombre}</Text>
                  {obra.descripcion && (
                    <Text style={styles.obraDescripcion} numberOfLines={2}>
                      {obra.descripcion}
                    </Text>
                  )}
                  
                  <View style={styles.obraStats}>
                    <View style={styles.stat}>
                      <MaterialCommunityIcons name="calendar-multiple" size={16} color="#FFD700" />
                      <Text style={styles.statText}>{obra.total_funciones || 0} funciones</Text>
                    </View>
                    <View style={styles.stat}>
                      <MaterialCommunityIcons name="account-group" size={16} color="#FFD700" />
                      <Text style={styles.statText}>{obra.total_elenco || 0} elenco</Text>
                    </View>
                  </View>
                  
                  <View style={styles.verMasButton}>
                    <Text style={styles.verMasText}>Ver funciones</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#FFD700" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B0000',
    opacity: 0.8,
  },
  content: {
    marginTop: 20,
  },
  loader: {
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 20,
  },
  obraCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 16,
  },
  obraImagen: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  placeholderImagen: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  obraInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  obraNombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  obraDescripcion: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  obraStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  verMasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  verMasText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
