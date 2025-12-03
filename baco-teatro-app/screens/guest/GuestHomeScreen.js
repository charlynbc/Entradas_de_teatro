import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import TheatricalButton from '../../components/TheatricalButton';
import colors from '../../theme/colors';
import { getPublicShows } from '../../api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function GuestHomeScreen({ navigation }) {
  console.log('GuestHomeScreen mounted');
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('GuestHomeScreen useEffect');
    load();
  }, []);

  const load = async () => {
    console.log('Loading shows...');
    try {
      const data = await getPublicShows();
      console.log('Shows loaded:', data);
      setShows(data);
    } catch (e) {
      console.error('Error loading shows:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderShow = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('GuestShowDetail', { showId: item.id, title: item.obra })}
    >
      <View style={styles.cardContent}>
        <View style={styles.dateBox}>
          <Text style={styles.day}>{new Date(item.fecha).getDate()}</Text>
          <Text style={styles.month}>
            {new Date(item.fecha).toLocaleString('es-ES', { month: 'short' }).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{item.obra}</Text>
          <Text style={styles.meta}>{item.lugar}</Text>
          <Text style={styles.meta}>
            {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.curtainTop}>
          <View style={styles.curtainLeft} />
          <View style={styles.curtainRight} />
        </View>
        <View style={styles.logoSection}>
          <View style={styles.spotlightContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.spotlight}
            >
              <MaterialCommunityIcons name="drama-masks" size={56} color="#000" />
            </LinearGradient>
          </View>
          <Text style={styles.companyName}>Baco Teatro</Text>
          <Text style={styles.subtitle}>25 años de historia teatral</Text>
        </View>
      </View>

      <View style={styles.descriptionCard}>
        <Text style={styles.description}>
          Somos una compañía teatral uruguaya dirigida por Gustavo Bouzas y Horacio Nieves. 
          Creada en 1998 llevamos más de 25 años de trayectoria teatral independiente, 
          profesional y honesta. Afiliados a F.U.T.I., S.U.A., AGADU.
        </Text>
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity 
          style={styles.theatricalButton}
          onPress={() => navigation.navigate('GuestManual')}
        >
          <LinearGradient
            colors={['#8B0000', '#DC143C', '#8B0000']}
            style={styles.buttonGradient}
          >
            <MaterialCommunityIcons name="book-open-page-variant" size={28} color="#FFD700" />
          </LinearGradient>
          <Text style={styles.buttonLabel}>Manual</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.theatricalButton}
          onPress={() => navigation.navigate('Developer')}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FFD700']}
            style={styles.buttonGradient}
          >
            <MaterialCommunityIcons name="account-star" size={28} color="#000" />
          </LinearGradient>
          <Text style={styles.buttonLabel}>Desarrollador</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.theatricalButton}
          onPress={() => navigation.navigate('Login')}
        >
          <LinearGradient
            colors={['#4B0082', '#8A2BE2', '#4B0082']}
            style={styles.buttonGradient}
          >
            <MaterialCommunityIcons name="account-group" size={28} color="#FFD700" />
          </LinearGradient>
          <Text style={styles.buttonLabel}>Elenco</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.secondary} size="large" />
          <Text style={styles.loadingText}>Cargando funciones...</Text>
        </View>
      ) : shows.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>🎭 Próximas Funciones</Text>
          <FlatList
            data={shows}
            renderItem={renderShow}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 60 }}
            scrollEnabled={false}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="theater" size={80} color={colors.secondary} />
          <Text style={styles.emptyTitle}>Próximamente</Text>
          <Text style={styles.emptyText}>
            Estamos preparando nuevas funciones para ti.
            Vuelve pronto para ver nuestra cartelera.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
    position: 'relative',
  },
  curtainTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
    zIndex: 1,
  },
  curtainLeft: {
    flex: 1,
    backgroundColor: '#8B0000',
    borderBottomRightRadius: 40,
    borderRightWidth: 3,
    borderRightColor: '#FFD700',
  },
  curtainRight: {
    flex: 1,
    backgroundColor: '#8B0000',
    borderBottomLeftRadius: 40,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 40,
  },
  spotlightContainer: {
    marginBottom: 16,
  },
  spotlight: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
    gap: 16,
  },
  theatricalButton: {
    alignItems: 'center',
    gap: 8,
  },
  buttonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonLabel: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    paddingHorizontal: 4,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#8B0000',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  day: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  month: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  }
});
