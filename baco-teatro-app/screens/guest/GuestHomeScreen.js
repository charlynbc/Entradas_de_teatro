import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Image } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { getPublicShows } from '../../api';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.logoSection}>
          <Ionicons name="theater" size={48} color={colors.secondary} />
          <Text style={styles.companyName}>Baco Teatro</Text>
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
          style={styles.manualButton}
          onPress={() => navigation.navigate('GuestManual')}
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.secondary} />
          <Text style={styles.manualText}>Manual de Usuario</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactoButton}
          onPress={() => navigation.navigate('Contacto')}
        >
          <Ionicons name="person-circle-outline" size={20} color={colors.secondary} />
          <Text style={styles.manualText}>Contacto</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Soy del elenco</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Próximas Funciones</Text>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={shows}
          renderItem={renderShow}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay funciones disponibles por ahora.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 8,
    textAlign: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary + '60',
    gap: 6,
  },
  contactoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary + '60',
    gap: 6,
  },
  manualText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  loginLink: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  }
});
