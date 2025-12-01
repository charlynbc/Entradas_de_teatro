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
        <Text style={styles.headerTitle}>Próximas Funciones</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Soy del elenco</Text>
        </TouchableOpacity>
      </View>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  loginLink: {
    color: colors.secondary,
    fontWeight: '600',
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
