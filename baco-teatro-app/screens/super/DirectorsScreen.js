import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import {
  listDirectors,
  createDirector,
  resetDirectorPassword,
  deleteDirector,
  listVendors,
  createVendor,
  deleteVendor,
} from '../../api';

export default function DirectorsScreen() {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [userForm, setUserForm] = useState({ name: '', cedula: '', genero: 'masculino', role: 'ADMIN' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dirs, actors] = await Promise.all([
        listDirectors(),
        listVendors(),
      ]);
      // Ordenar alfabéticamente por nombre
      setDirectors(dirs.sort((a, b) => a.name.localeCompare(b.name)));
      setVendors(actors.sort((a, b) => a.name.localeCompare(b.name)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.cedula) {
      showError('Completa nombre y cédula');
      return;
    }
    setSaving(true);
    try {
      if (userForm.role === 'ADMIN') {
        await createDirector(userForm);
        showSuccess('✨ Director creado con éxito (contraseña: admin123)');
      } else {
        await createVendor(userForm);
        const generoLabel = userForm.genero === 'femenino' ? 'Actriz' : 'Actor';
        showSuccess(`✨ ${generoLabel} creado con éxito (contraseña: admin123)`);
      }
      setUserForm({ name: '', cedula: '', genero: 'masculino', role: 'ADMIN' });
      load();
    } catch (error) {
      showError(error.message || 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (cedula) => {
    if (!confirm(`🔐 Resetear contraseña\n\n¿Querés restablecer la contraseña de ${cedula} a admin123?`)) {
      return;
    }
    try {
      await resetDirectorPassword(cedula);
      showSuccess('🔐 Contraseña reseteada con éxito');
    } catch (error) {
      showError('No se pudo resetear la contraseña');
    }
  };

  const handleDeleteDirector = async (cedula, nombre) => {
    if (!confirm(`🗑️ Eliminar director\n\nSe van a borrar las obras y funciones asignadas a ${nombre}. ¿Continuar?`)) {
      return;
    }
    try {
      await deleteDirector(cedula);
      await load();
      showSuccess('🗑️ Director eliminado con éxito');
    } catch (error) {
      showError(error.message || 'No se pudo eliminar el director');
    }
  };

  const handleDeleteActor = async (cedula, nombre, genero) => {
    const generoLabel = genero === 'femenino' ? 'actriz' : 'actor';
    if (!confirm(`🗑️ Eliminar ${generoLabel}\n\nEl stock de ${nombre} volverá a dirección. ¿Confirmás?`)) {
      return;
    }
    try {
      await deleteVendor(cedula);
      await load();
      showSuccess(`🗑️ ${generoLabel === 'actriz' ? 'Actriz' : 'Actor'} eliminado con éxito`);
    } catch (error) {
      showError(error.message || `No se pudo eliminar el ${generoLabel}`);
    }
  };

  const getGeneroLabel = (genero) => {
    if (genero === 'femenino') return '♀️';
    if (genero === 'masculino') return '♂️';
    return '⚧';
  };

  return (
    <ScreenContainer scrollable>
      <LinearGradient
        colors={['#8B0000', '#DC143C', '#8B0000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>🎭 Administración</Text>
            <Text style={styles.headerSubtitle}>Directores y Elenco</Text>
          </View>
          <MaterialCommunityIcons name="account-supervisor" size={48} color="#FFD700" />
        </View>
      </LinearGradient>
      
      {/* CREAR USUARIO */}
      <SectionCard 
        title="✨ Nuevo miembro del equipo" 
        subtitle="Agrega directores y elenco con un clic"
      >
        {/* Selector de Rol - Cards grandes */}
        <Text style={styles.sectionLabel}>Tipo de usuario</Text>
        <View style={styles.roleSelector}>
          <TouchableOpacity 
            style={[
              styles.roleCard,
              userForm.role === 'ADMIN' && styles.roleCardActive
            ]}
            onPress={() => setUserForm((prev) => ({ ...prev, role: 'ADMIN' }))}
            activeOpacity={0.7}
          >
            <View style={[
              styles.roleIconCircle,
              userForm.role === 'ADMIN' && styles.roleIconCircleActive
            ]}>
              <MaterialCommunityIcons 
                name="movie-open" 
                size={32} 
                color={userForm.role === 'ADMIN' ? colors.secondary : colors.textMuted} 
              />
            </View>
            <Text style={[
              styles.roleTitle,
              userForm.role === 'ADMIN' && styles.roleTitleActive
            ]}>Director</Text>
            <Text style={styles.roleDescription}>Gestiona obras y funciones</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.roleCard,
              userForm.role === 'VENDEDOR' && styles.roleCardActive
            ]}
            onPress={() => setUserForm((prev) => ({ ...prev, role: 'VENDEDOR' }))}
            activeOpacity={0.7}
          >
            <View style={[
              styles.roleIconCircle,
              userForm.role === 'VENDEDOR' && styles.roleIconCircleActive
            ]}>
              <MaterialCommunityIcons 
                name="drama-masks" 
                size={32} 
                color={userForm.role === 'VENDEDOR' ? colors.secondary : colors.textMuted} 
              />
            </View>
            <Text style={[
              styles.roleTitle,
              userForm.role === 'VENDEDOR' && styles.roleTitleActive
            ]}>Actor/Actriz</Text>
            <Text style={styles.roleDescription}>Vende entradas al público</Text>
          </TouchableOpacity>
        </View>

        {/* Formulario */}
        <Text style={styles.sectionLabel}>Información personal</Text>
        
        <View style={styles.inputGroup}>
          <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Nombre completo"
            placeholderTextColor={colors.textSoft}
            value={userForm.name}
            onChangeText={(name) => setUserForm((prev) => ({ ...prev, name }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <MaterialCommunityIcons name="card-account-details" size={20} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Cédula de identidad"
            placeholderTextColor={colors.textSoft}
            value={userForm.cedula}
            onChangeText={(cedula) => setUserForm((prev) => ({ ...prev, cedula }))}
            keyboardType="numeric"
          />
        </View>

        {/* Género - Pills */}
        <Text style={styles.sectionLabel}>Género</Text>
        <View style={styles.genderPills}>
          <TouchableOpacity
            style={[
              styles.genderPill,
              userForm.genero === 'masculino' && styles.genderPillActive
            ]}
            onPress={() => setUserForm((prev) => ({ ...prev, genero: 'masculino' }))}
          >
            <Text style={[
              styles.genderPillText,
              userForm.genero === 'masculino' && styles.genderPillTextActive
            ]}>♂️ Masculino</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderPill,
              userForm.genero === 'femenino' && styles.genderPillActive
            ]}
            onPress={() => setUserForm((prev) => ({ ...prev, genero: 'femenino' }))}
          >
            <Text style={[
              styles.genderPillText,
              userForm.genero === 'femenino' && styles.genderPillTextActive
            ]}>♀️ Femenino</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderPill,
              userForm.genero === 'otro' && styles.genderPillActive
            ]}
            onPress={() => setUserForm((prev) => ({ ...prev, genero: 'otro' }))}
          >
            <Text style={[
              styles.genderPillText,
              userForm.genero === 'otro' && styles.genderPillTextActive
            ]}>⚧ Otro</Text>
          </TouchableOpacity>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color={colors.secondary} />
          <Text style={styles.infoText}>
            La contraseña inicial será <Text style={styles.infoBold}>admin123</Text>. 
            El usuario deberá cambiarla en su primer acceso.
          </Text>
        </View>

        {/* Botón crear */}
        <TouchableOpacity 
          style={[styles.createButton, saving && styles.createButtonDisabled]} 
          onPress={handleCreateUser} 
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <>
              <MaterialCommunityIcons 
                name={userForm.role === 'ADMIN' ? 'movie-open' : 'drama-masks'} 
                size={20} 
                color={colors.black} 
              />
              <Text style={styles.createButtonText}>
                {userForm.role === 'ADMIN' ? 'Crear Director' : 'Crear Actor/Actriz'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </SectionCard>

      <SectionCard title="Directores" subtitle={`${directors.length} cuenta${directors.length !== 1 ? 's' : ''}`}>
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : directors.length === 0 ? (
          <Text style={styles.empty}>Todavía no hay directores</Text>
        ) : (
          directors.map((dir) => (
            <View key={dir.cedula} style={styles.row}>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Text style={styles.name}>{dir.name}</Text>
                  <Text style={styles.genero}>{getGeneroLabel(dir.genero)}</Text>
                </View>
                <Text style={styles.meta}>{dir.cedula}</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => handleReset(dir.cedula)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteDirector(dir.cedula, dir.name)} style={styles.dangerButton}>
                  <Text style={styles.dangerText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Actores y actrices" subtitle={`${vendors.length} cuenta${vendors.length !== 1 ? 's' : ''}`}>
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : vendors.length === 0 ? (
          <Text style={styles.empty}>Todavía no hay actores/actrices</Text>
        ) : (
          vendors.map((vendor) => (
            <View key={vendor.cedula} style={styles.row}>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Text style={styles.name}>{vendor.name}</Text>
                  <Text style={styles.genero}>{getGeneroLabel(vendor.genero)}</Text>
                </View>
                <Text style={styles.meta}>{vendor.cedula}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteActor(vendor.cedula, vendor.name, vendor.genero)} style={styles.dangerButton}>
                <Text style={styles.dangerText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </SectionCard>
      
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
  headerGradient: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleCardActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '15',
  },
  roleIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIconCircleActive: {
    backgroundColor: colors.secondary + '20',
  },
  roleTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleTitleActive: {
    color: colors.secondary,
  },
  roleDescription: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    color: colors.text,
    padding: 14,
    fontSize: 16,
  },
  genderPills: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  genderPill: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },
  genderPillText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  genderPillTextActive: {
    color: colors.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.secondary + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
    color: colors.secondary,
  },
  createButton: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  genero: {
    fontSize: 16,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dangerText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});
