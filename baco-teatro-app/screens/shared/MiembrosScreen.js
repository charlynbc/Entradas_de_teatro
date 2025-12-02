import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listarMiembros } from '../../api';

export default function MiembrosScreen({ navigation }) {
  const { toast, showError, hideToast } = useToast();
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMiembros();
  }, []);

  const loadMiembros = async () => {
    try {
      const data = await listarMiembros();
      setMiembros(data);
    } catch (error) {
      showError('No se pudieron cargar los miembros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (rol) => {
    switch (rol) {
      case 'admin':
        return 'Director';
      case 'vendedor':
        return 'Actor/Vendedor';
      case 'supremo':
        return 'Super Usuario';
      default:
        return rol;
    }
  };

  const getRoleIcon = (rol) => {
    switch (rol) {
      case 'admin':
        return 'film-outline';
      case 'vendedor':
        return 'person-outline';
      case 'supremo':
        return 'star-outline';
      default:
        return 'person-circle-outline';
    }
  };

  const renderMiembro = ({ item }) => {
    const obras = JSON.parse(item.obras || '[]').filter(o => o.show_id);
    
    return (
      <TouchableOpacity
        style={styles.miembroCard}
        onPress={() => {
          Alert.alert(
            item.nombre,
            `${getRoleLabel(item.rol)}\n\nObras activas: ${item.obras_activas || 0}\n\nCédula: ${item.cedula}`,
            [
              {
                text: 'Ver obras',
                onPress: () => {
                  if (obras.length > 0) {
                    const obrasText = obras.map(o => `• ${o.show_nombre}`).join('\n');
                    Alert.alert('Obras de ' + item.nombre, obrasText);
                  } else {
                    Alert.alert('Sin obras', 'Este miembro no tiene obras asignadas actualmente');
                  }
                }
              },
              { text: 'Cerrar', style: 'cancel' }
            ]
          );
        }}
      >
        <View style={styles.miembroHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.rol === 'admin' ? colors.secondary + '20' : colors.primary + '20' }]}>
            <Ionicons name={getRoleIcon(item.rol)} size={28} color={item.rol === 'admin' ? colors.secondary : colors.primary} />
          </View>
          <View style={styles.miembroInfo}>
            <Text style={styles.miembroNombre}>{item.nombre}</Text>
            <Text style={styles.miembroRol}>{getRoleLabel(item.rol)}</Text>
            {item.obras_activas > 0 && (
              <Text style={styles.miembroObras}>
                {item.obras_activas} {item.obras_activas === 1 ? 'obra activa' : 'obras activas'}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  // Separar directores y actores
  const directores = miembros.filter(m => m.rol === 'admin');
  const actores = miembros.filter(m => m.rol === 'vendedor');

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Miembros del Elenco</Text>
        <Text style={styles.subtitle}>Directores y actores de Baco Teatro</Text>
      </View>

      {directores.length > 0 && (
        <SectionCard title="Directores" subtitle={`${directores.length} ${directores.length === 1 ? 'director' : 'directores'}`}>
          {directores.map(item => (
            <View key={item.id}>
              {renderMiembro({ item })}
            </View>
          ))}
        </SectionCard>
      )}

      {actores.length > 0 && (
        <SectionCard title="Actores/Vendedores" subtitle={`${actores.length} ${actores.length === 1 ? 'miembro' : 'miembros'}`}>
          {actores.map(item => (
            <View key={item.id}>
              {renderMiembro({ item })}
            </View>
          ))}
        </SectionCard>
      )}

      {miembros.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>No hay miembros registrados</Text>
        </View>
      )}
      
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  miembroCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  miembroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miembroInfo: {
    flex: 1,
  },
  miembroNombre: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  miembroRol: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  miembroObras: {
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
  },
});
