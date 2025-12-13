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
  const [directorForm, setDirectorForm] = useState({ name: '', cedula: '', genero: 'masculino' });
  const [actorForm, setActorForm] = useState({ name: '', cedula: '', genero: 'masculino' });
  const [savingDirector, setSavingDirector] = useState(false);
  const [savingActor, setSavingActor] = useState(false);

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

  const handleCreateDirector = async () => {
    if (!directorForm.name || !directorForm.cedula) {
      showError('Completa nombre y cédula');
      return;
    }
    setSavingDirector(true);
    try {
      await createDirector(directorForm);
      setDirectorForm({ name: '', cedula: '', genero: 'masculino' });
      load();
      showSuccess('✨ Director creado con éxito (contraseña: admin123)');
    } catch (error) {
      showError(error.message || 'No se pudo crear el director');
    } finally {
      setSavingDirector(false);
    }
  };

  const handleCreateActor = async () => {
    if (!actorForm.name || !actorForm.cedula) {
      showError('Completa nombre y cédula');
      return;
    }
    setSavingActor(true);
    try {
      await createVendor(actorForm);
      setActorForm({ name: '', cedula: '', genero: 'masculino' });
      load();
      const generoLabel = actorForm.genero === 'femenino' ? 'Actriz' : 'Actor';
      showSuccess(`✨ ${generoLabel} creado con éxito (contraseña: admin123)`);
    } catch (error) {
      showError(error.message || 'No se pudo crear el actor/actriz');
    } finally {
      setSavingActor(false);
    }
  };

  const handleReset = async (cedula) => {
    Alert.alert(
      '🔐 Resetear contraseña',
      `¿Querés restablecer la contraseña de ${cedula} a admin123?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await resetDirectorPassword(cedula);
              showSuccess('🔐 Contraseña reseteada con éxito');
            } catch (error) {
              showError('No se pudo resetear la contraseña');
            }
          },
        },
      ]
    );
  };

  const handleDeleteDirector = (cedula, nombre) => {
    Alert.alert(
      '🗑️ Eliminar director',
      `Se van a borrar las obras y funciones asignadas a ${nombre}. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDirector(cedula);
              load();
              showSuccess('🗑️ Director eliminado con éxito');
            } catch (error) {
              showError(error.message || 'No se pudo eliminar el director');
            }
          },
        },
      ]
    );
  };

  const handleDeleteActor = (cedula, nombre, genero) => {
    const generoLabel = genero === 'femenino' ? 'actriz' : 'actor';
    Alert.alert(
      `🗑️ Eliminar ${generoLabel}`,
      `El stock de ${nombre} volverá a dirección. ¿Confirmás?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendor(cedula);
              load();
              showSuccess(`🗑️ ${generoLabel === 'actriz' ? 'Actriz' : 'Actor'} eliminado con éxito`);
            } catch (error) {
              showError(error.message || `No se pudo eliminar el ${generoLabel}`);
            }
          },
        },
      ]
    );
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
      
      {/* SECCIÓN DIRECTORES */}
      <SectionCard title="Crear director" subtitle="Cada director administra sus obras">
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={colors.textSoft}
          value={directorForm.name}
          onChangeText={(name) => setDirectorForm((prev) => ({ ...prev, name }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Cédula"
          placeholderTextColor={colors.textSoft}
          value={directorForm.cedula}
          onChangeText={(cedula) => setDirectorForm((prev) => ({ ...prev, cedula }))}
          keyboardType="numeric"
        />
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Género:</Text>
          <Picker
            selectedValue={directorForm.genero}
            onValueChange={(genero) => setDirectorForm((prev) => ({ ...prev, genero }))}
            style={styles.picker}
          >
            <Picker.Item label="Masculino ♂️" value="masculino" />
            <Picker.Item label="Femenino ♀️" value="femenino" />
            <Picker.Item label="Otro ⚧" value="otro" />
          </Picker>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleCreateDirector} disabled={savingDirector}>
          {savingDirector ? <ActivityIndicator color={colors.black} /> : <Text style={styles.buttonText}>Crear director</Text>}
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

      {/* SECCIÓN ACTORES/ACTRICES */}
      <SectionCard title="Crear actor/actriz" subtitle="Los actores venden entradas">
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={colors.textSoft}
          value={actorForm.name}
          onChangeText={(name) => setActorForm((prev) => ({ ...prev, name }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Cédula"
          placeholderTextColor={colors.textSoft}
          value={actorForm.cedula}
          onChangeText={(cedula) => setActorForm((prev) => ({ ...prev, cedula }))}
          keyboardType="numeric"
        />
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Género:</Text>
          <Picker
            selectedValue={actorForm.genero}
            onValueChange={(genero) => setActorForm((prev) => ({ ...prev, genero }))}
            style={styles.picker}
          >
            <Picker.Item label="Masculino ♂️ (Actor)" value="masculino" />
            <Picker.Item label="Femenino ♀️ (Actriz)" value="femenino" />
            <Picker.Item label="Otro ⚧ (Actante)" value="otro" />
          </Picker>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleCreateActor} disabled={savingActor}>
          {savingActor ? <ActivityIndicator color={colors.black} /> : <Text style={styles.buttonText}>Crear actor/actriz</Text>}
        </TouchableOpacity>
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
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pickerLabel: {
    color: colors.text,
    fontSize: 14,
    paddingTop: 8,
    paddingLeft: 14,
    fontWeight: '600',
  },
  picker: {
    color: colors.text,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: 'bold',
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
