import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
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
      // Ordenar alfabéticamente por nombre
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setMiembros(sorted);
    } catch (error) {
      showError('No se pudieron cargar los miembros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getGeneroLabel = (genero) => {
    if (genero === 'femenino') return '♀️';
    if (genero === 'masculino') return '♂️';
    return '⚧';
  };

  const getRoleLabel = (rol, genero) => {
    switch (rol) {
      case 'ADMIN':
      case 'admin':
        return 'Director';
      case 'VENDEDOR':
      case 'vendedor':
        if (genero === 'femenino') return 'Actriz';
        if (genero === 'masculino') return 'Actor';
        return 'Actante';
      case 'SUPER':
      case 'supremo':
        return 'Super Usuario';
      default:
        return rol;
    }
  };

  const getRoleIcon = (rol) => {
    switch (rol) {
      case 'ADMIN':
      case 'admin':
        return 'film-outline';
      case 'VENDEDOR':
      case 'vendedor':
        return 'person-outline';
      case 'SUPER':
      case 'supremo':
        return 'star-outline';
      default:
        return 'person-circle-outline';
    }
  };

  const getRoleColor = (rol) => {
    switch (rol) {
      case 'SUPER':
      case 'supremo':
        return '#FFD700'; // Dorado
      case 'ADMIN':
      case 'admin':
        return colors.secondary;
      case 'VENDEDOR':
      case 'vendedor':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  const getAvatarSource = (rol, genero) => {
    // Determinar imagen según rol y género
    if (rol === 'SUPER' || rol === 'supremo') {
      return { uri: 'https://api.dicebear.com/7.x/bottts/png?seed=super&backgroundColor=ffd700' };
    }
    if (rol === 'ADMIN' || rol === 'admin') {
      return { uri: `https://api.dicebear.com/7.x/avataaars/png?seed=director&backgroundColor=8b5cf6` };
    }
    // Para actores/actrices
    const seed = genero === 'femenino' ? 'actress' : genero === 'masculino' ? 'actor' : 'performer';
    return { uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&backgroundColor=ec4899` };
  };

  const renderMiembro = ({ item }) => {
    const obras = JSON.parse(item.obras || '[]').filter(o => o.show_id);
    const roleColor = getRoleColor(item.rol);
    
    return (
      <TouchableOpacity
        style={styles.miembroCard}
        onPress={() => {
          if (confirm(`${item.name}\n${getRoleLabel(item.rol, item.genero)}\n\nObras activas: ${item.obras_activas || 0}\nCédula: ${item.cedula}\n\n¿Ver obras?`)) {
            if (obras.length > 0) {
              const obrasText = obras.map(o => `• ${o.show_nombre}`).join('\n');
              alert('Obras de ' + item.name + '\n\n' + obrasText);
            } else {
              alert('Este miembro no tiene obras asignadas actualmente');
            }
          }
        }}
      >
        <View style={styles.miembroHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={getAvatarSource(item.rol, item.genero)}
              style={styles.avatar}
            />
            <View style={[styles.roleIconBadge, { backgroundColor: roleColor }]}>
              <Ionicons name={getRoleIcon(item.rol)} size={14} color="white" />
            </View>
          </View>
          <View style={styles.miembroInfo}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Text style={styles.miembroNombre}>{item.name}</Text>
              <Text style={{fontSize: 16}}>{getGeneroLabel(item.genero)}</Text>
            </View>
            <Text style={[styles.miembroRol, { color: roleColor }]}>
              {getRoleLabel(item.rol, item.genero)}
            </Text>
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

  // Separar por roles y ordenar alfabéticamente cada grupo
  const superUsuarios = miembros.filter(m => m.rol === 'SUPER' || m.rol === 'supremo')
    .sort((a, b) => a.name.localeCompare(b.name));
  const directores = miembros.filter(m => m.rol === 'ADMIN' || m.rol === 'admin')
    .sort((a, b) => a.name.localeCompare(b.name));
  const actores = miembros.filter(m => m.rol === 'VENDEDOR' || m.rol === 'vendedor')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Todos los Usuarios</Text>
        <Text style={styles.subtitle}>{miembros.length} usuarios registrados en la aplicación</Text>
      </View>

      {superUsuarios.length > 0 && (
        <SectionCard title="🌟 Super Usuarios" subtitle={`${superUsuarios.length} ${superUsuarios.length === 1 ? 'administrador' : 'administradores'} del sistema`}>
          {superUsuarios.map(item => (
            <View key={item.cedula || item.id}>
              {renderMiembro({ item })}
            </View>
          ))}
        </SectionCard>
      )}

      {directores.length > 0 && (
        <SectionCard title="🎬 Directores" subtitle={`${directores.length} ${directores.length === 1 ? 'director' : 'directores'}`}>
          {directores.map(item => (
            <View key={item.cedula || item.id}>
              {renderMiembro({ item })}
            </View>
          ))}
        </SectionCard>
      )}

      {actores.length > 0 && (
        <SectionCard title="🎭 Actores y actrices" subtitle={`${actores.length} ${actores.length === 1 ? 'miembro' : 'miembros'}`}>
          {actores.map(item => (
            <View key={item.cedula || item.id}>
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
  avatarContainer: {
    width: 56,
    height: 56,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
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
