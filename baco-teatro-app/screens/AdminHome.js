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
import colors from '../theme/colors';
import { getShows } from '../api/api';

export default function AdminHome({ navigation }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUser();
    loadShows();
  }, []);

  const loadUser = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name || 'Admin');
    }
  };

  const loadShows = async () => {
    setLoading(true);
    try {
      const data = await getShows();
      setShows(data);
    } catch (error) {
      console.error('Error cargando shows:', error);
      Alert.alert('Error', 'No se pudieron cargar las funciones');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const menuItems = [
    {
      title: 'Crear Función',
      icon: '🎭',
      screen: 'CrearShow',
      color: colors.primary,
    },
    {
      title: 'Crear Usuario',
      icon: '👤',
      screen: 'CrearUsuario',
      color: '#2196F3',
    },
    {
      title: 'Asignar Tickets',
      icon: '🎟️',
      screen: 'AsignarTickets',
      color: '#4CAF50',
    },
    {
      title: 'Reportes',
      icon: '📊',
      screen: 'Reportes',
      color: '#FF9800',
    },
    {
      title: 'Validar QR',
      icon: '📸',
      screen: 'ValidarQR',
      color: '#9C27B0',
    },
  ];

  const renderShowItem = ({ item }) => (
    <TouchableOpacity
      style={styles.showCard}
      onPress={() => navigation.navigate('AsignarTickets', { show: item })}
    >
      <Text style={styles.showObra}>{item.obra}</Text>
      <Text style={styles.showFecha}>
        {new Date(item.fecha).toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      <Text style={styles.showCapacidad}>
        Capacidad: {item.capacidad} | Precio base: ${item.base_price}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.role}>Administrador</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Menu de acciones */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de funciones */}
      <View style={styles.showsSection}>
        <Text style={styles.sectionTitle}>Funciones</Text>
        <FlatList
          data={shows}
          renderItem={renderShowItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadShows} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay funciones creadas. {'\n'}Crea tu primera función.
            </Text>
          }
        />
      </View>
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
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: colors.white,
  },
  menuItem: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  showsSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  showCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  showObra: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  showFecha: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  showCapacidad: {
    fontSize: 12,
    color: colors.gray,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 16,
    marginTop: 48,
    lineHeight: 24,
  },
});
