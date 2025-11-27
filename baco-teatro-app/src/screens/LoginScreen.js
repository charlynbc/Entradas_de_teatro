import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { getUsuarios } from '../services/api';

export default function LoginScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { login } = useUser();

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user) => {
    login(user);
  };

  const renderUsuario = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        item.rol === 'ADMIN' ? styles.adminCard : styles.vendedorCard,
      ]}
      onPress={() => handleLogin(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <Text style={styles.userName}>{item.nombre}</Text>
        <View
          style={[
            styles.roleBadge,
            item.rol === 'ADMIN' ? styles.adminBadge : styles.vendedorBadge,
          ]}
        >
          <Text style={styles.roleText}>{item.rol}</Text>
        </View>
      </View>
      <Text style={styles.userEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoStrip} />
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoBaco}>Baco</Text>
            <Text style={styles.logoTeatro}>teatro</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Selecciona tu usuario</Text>
      </View>

      <FlatList
        data={usuarios}
        renderItem={renderUsuario}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoStrip: {
    width: 8,
    height: 50,
    backgroundColor: colors.background,
    marginRight: 16,
  },
  logoTextContainer: {
    flexDirection: 'column',
  },
  logoBaco: {
    color: colors.background,
    fontSize: 36,
    fontWeight: 'bold',
  },
  logoTeatro: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
    marginTop: -6,
  },
  subtitle: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  adminCard: {
    borderLeftColor: colors.primary,
  },
  vendedorCard: {
    borderLeftColor: '#4CAF50',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: colors.primary,
  },
  vendedorBadge: {
    backgroundColor: '#4CAF50',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
