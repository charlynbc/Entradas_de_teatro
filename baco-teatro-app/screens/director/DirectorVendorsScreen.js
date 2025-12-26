import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { listVendors, createVendor, deleteVendor } from '../../api';
import { Ionicons } from '@expo/vector-icons';

export default function DirectorVendorsScreen() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ nombre: '', cedula: '', email: '', telefono: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listVendors();
      setVendors(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.nombre || !form.cedula) {
      Alert.alert('Falta información', 'El nombre y la cédula son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await createVendor(form);
      setForm({ nombre: '', cedula: '', email: '', telefono: '' });
      setModalVisible(false);
      load();
      Alert.alert('Éxito', 'Vendedor registrado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear el vendedor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (vendor) => {
    Alert.alert(
      'Eliminar vendedor',
      `¿Estás seguro de eliminar a ${vendor.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendor(vendor.id);
              load();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Vendedores</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={colors.black} />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 20 }} />
      ) : vendors.length === 0 ? (
        <Text style={styles.emptyText}>No hay vendedores registrados</Text>
      ) : (
        vendors.map((vendor) => (
          <View key={vendor.id} style={styles.card}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{vendor.nombre.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{vendor.nombre}</Text>
              <Text style={styles.detail}>C.I. {vendor.id}</Text>
              {vendor.email && <Text style={styles.detail}>{vendor.email}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleDelete(vendor)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Vendedor</Text>
            
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={colors.textSoft}
              value={form.nombre}
              onChangeText={(t) => setForm(prev => ({ ...prev, nombre: t }))}
            />

            <Text style={styles.label}>Cédula (Usuario) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 12345678"
              placeholderTextColor={colors.textSoft}
              keyboardType="numeric"
              value={form.cedula}
              onChangeText={(t) => setForm(prev => ({ ...prev, cedula: t }))}
            />

            <Text style={styles.label}>Email (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="juan@ejemplo.com"
              placeholderTextColor={colors.textSoft}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(t) => setForm(prev => ({ ...prev, email: t }))}
            />

            <Text style={styles.label}>Teléfono (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+598 99 123 456"
              placeholderTextColor={colors.textSoft}
              keyboardType="phone-pad"
              value={form.telefono}
              onChangeText={(t) => setForm(prev => ({ ...prev, telefono: t }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleCreate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: colors.secondary,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  saveButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
});
