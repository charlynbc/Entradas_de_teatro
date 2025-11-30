import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import colors from '../../theme/colors';
import { getActorSchedule } from '../../api';

export default function ActorRehearsalsScreen() {
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use getActorSchedule to show only relevant rehearsals
      const schedule = await getActorSchedule();
      setRehearsals(schedule.rehearsals || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title || 'Ensayo'}</Text>
        {item.obra && <Text style={styles.cardShow}>{item.obra}</Text>}
      </View>
      <Text style={styles.cardDate}>
        {new Date(item.date || item.fecha).toLocaleString()}
      </Text>
      <Text style={styles.cardLocation}>{item.location || item.lugar}</Text>
      {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Ensayos</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} />
      ) : (
        <FlatList
          data={rehearsals}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No tienes ensayos programados</Text>}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  cardShow: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    backgroundColor: 'rgba(106, 4, 15, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardDate: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textSoft,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 20,
  },
});
