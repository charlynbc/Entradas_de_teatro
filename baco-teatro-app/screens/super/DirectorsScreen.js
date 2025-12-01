import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import {
  listDirectors,
  createDirector,
  resetDirectorPassword,
  deleteDirector,
  listVendors,
  deleteVendor,
} from '../../api';

export default function DirectorsScreen() {
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ nombre: '', cedula: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dirs, actors] = await Promise.all([
        listDirectors(),
        listVendors(),
      ]);
      setDirectors(dirs);
      setVendors(actors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.nombre || !form.cedula) {
      Alert.alert('Falta info', 'Completa nombre y cedula');
      return;
    }
    setSaving(true);
    try {
      await createDirector(form);
      setForm({ nombre: '', cedula: '' });
      load();
      Alert.alert('Listo', 'Director creado con contrasena 1234');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (cedula) => {
    Alert.alert(
      'Resetear contrasena',
      `Queres restablecer la contrasena de ${cedula} a 1234?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await resetDirectorPassword(cedula);
            Alert.alert('Hecho', 'Contrasena reseteada');
          },
        },
      ]
    );
  };

  const handleDeleteDirector = (cedula) => {
    Alert.alert(
      'Eliminar director',
      `Se van a borrar las obras y funciones asignadas a ${cedula}. Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDirector(cedula);
              load();
              Alert.alert('Listo', 'Director eliminado');
            } catch (error) {
              Alert.alert('Error', error.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const handleDeleteVendor = (cedula) => {
    Alert.alert(
      'Eliminar vendedor',
      `El stock de ${cedula} volvera a direccion. Confirmas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendor(cedula);
              load();
              Alert.alert('Listo', 'Vendedor eliminado');
            } catch (error) {
              Alert.alert('Error', error.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <SectionCard title="Crear director" subtitle="Cada director administra sus obras">
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor={colors.textSoft}
          value={form.nombre}
          onChangeText={(nombre) => setForm((prev) => ({ ...prev, nombre }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Cedula"
          placeholderTextColor={colors.textSoft}
          value={form.cedula}
          onChangeText={(cedula) => setForm((prev) => ({ ...prev, cedula }))}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.black} /> : <Text style={styles.buttonText}>Crear director</Text>}
        </TouchableOpacity>
      </SectionCard>

      <SectionCard title="Directores activos" subtitle={`${directors.length} cuentas`}>
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          directors.map((dir) => (
            <View key={dir.cedula} style={styles.row}>
              <View>
                <Text style={styles.name}>{dir.nombre}</Text>
                <Text style={styles.meta}>{dir.cedula}</Text>
                <Text style={styles.meta}>{dir.obras} obras /  {dir.funciones} funciones</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => handleReset(dir.cedula)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Reset pass</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteDirector(dir.cedula)} style={styles.dangerButton}>
                  <Text style={styles.dangerText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Vendedores" subtitle={`${vendors.length} cuentas`}>
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : vendors.length === 0 ? (
          <Text style={styles.empty}>Todavia no tenes vendedores</Text>
        ) : (
          vendors.map((vendor) => (
            <View key={vendor.cedula} style={styles.row}>
              <View>
                <Text style={styles.name}>{vendor.nombre}</Text>
                <Text style={styles.meta}>{vendor.cedula}</Text>
                <Text style={styles.meta}>Stock {vendor.stock} /  Vendidas {vendor.vendidas} /  Pagadas {vendor.pagadas}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteVendor(vendor.cedula)} style={styles.dangerButton}>
                <Text style={styles.dangerText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.black,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  name: {
    color: colors.white,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  secondaryText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  dangerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerText: {
    color: colors.error,
    fontWeight: '600',
  },
});
