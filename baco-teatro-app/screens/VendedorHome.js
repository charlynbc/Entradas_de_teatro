import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import colors from '../theme/colors';
import { getMisTickets, getShows } from '../api/api';
import TicketCard from '../components/TicketCard';

export default function VendedorHome({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState('all');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  const estados = [
    { key: 'all', label: 'Todos', count: 0 },
    { key: 'STOCK_VENDEDOR', label: 'Mi Stock', count: 0 },
    { key: 'RESERVADO', label: 'Reservados', count: 0 },
    { key: 'REPORTADA_VENDIDA', label: 'Reportadas', count: 0 },
    { key: 'PAGADO', label: 'Pagados', count: 0 },
  ];

  const [selectedEstado, setSelectedEstado] = useState('all');

  useEffect(() => {
    loadUser();
    loadShows();
    loadTickets();
  }, [selectedShow]);

  const loadUser = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name || 'Vendedor');
    }
  };

  const loadShows = async () => {
    try {
      const data = await getShows();
      setShows(data);
    } catch (error) {
      console.error('Error cargando shows:', error);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const showId = selectedShow === 'all' ? null : selectedShow;
      const data = await getMisTickets(showId);
      setTickets(data);
    } catch (error) {
      console.error('Error cargando tickets:', error);
      Alert.alert('Error', 'No se pudieron cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const getTicketsByEstado = () => {
    if (selectedEstado === 'all') return tickets;
    return tickets.filter((t) => t.estado === selectedEstado);
  };

  const getEstadoCounts = () => {
    const counts = {
      all: tickets.length,
      STOCK_VENDEDOR: 0,
      RESERVADO: 0,
      REPORTADA_VENDIDA: 0,
      PAGADO: 0,
    };

    tickets.forEach((t) => {
      if (counts[t.estado] !== undefined) {
        counts[t.estado]++;
      }
    });

    return counts;
  };

  const counts = getEstadoCounts();
  const filteredTickets = getTicketsByEstado();

  const renderTicket = ({ item }) => (
    <TicketCard
      ticket={item}
      onPress={() => {
        if (item.estado === 'STOCK_VENDEDOR') {
          navigation.navigate('Reservar', { ticket: item });
        } else if (item.estado === 'RESERVADO') {
          navigation.navigate('ReportarVenta', { ticket: item });
        } else if (['REPORTADA_VENDIDA', 'PAGADO'].includes(item.estado)) {
          navigation.navigate('TicketQR', { ticket: item });
        }
      }}
      userRole="VENDEDOR"
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.role}>Vendedor</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de función */}
      <View style={styles.showPickerContainer}>
        <Picker
          selectedValue={selectedShow}
          onValueChange={setSelectedShow}
          style={styles.showPicker}
        >
          <Picker.Item label="📋 Todas las funciones" value="all" />
          {shows.map((show) => (
            <Picker.Item
              key={show.id}
              label={`${show.obra} - ${new Date(show.fecha).toLocaleDateString('es-AR')}`}
              value={show.id.toString()}
            />
          ))}
        </Picker>
      </View>

      {/* Tabs de estado */}
      <View style={styles.tabs}>
        {estados.map((estado) => (
          <TouchableOpacity
            key={estado.key}
            style={[
              styles.tab,
              selectedEstado === estado.key && styles.tabActive,
            ]}
            onPress={() => setSelectedEstado(estado.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedEstado === estado.key && styles.tabTextActive,
              ]}
            >
              {estado.label}
            </Text>
            <Text
              style={[
                styles.tabCount,
                selectedEstado === estado.key && styles.tabCountActive,
              ]}
            >
              {counts[estado.key] || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de tickets */}
      <FlatList
        data={filteredTickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.code}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTickets} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedEstado === 'all'
                ? 'No tienes tickets asignados'
                : `No hay tickets en estado "${estados.find((e) => e.key === selectedEstado)?.label}"`}
            </Text>
          </View>
        }
        contentContainerStyle={
          filteredTickets.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  role: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.white,
    fontWeight: '600',
  },
  showPickerContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  showPicker: {
    height: 50,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray,
    marginTop: 4,
  },
  tabCountActive: {
    color: colors.primary,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
});
