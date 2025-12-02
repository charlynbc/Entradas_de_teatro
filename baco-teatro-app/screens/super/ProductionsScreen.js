import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { listProductions, createProduction, deleteProduction } from '../../api';

export default function ProductionsScreen() {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [productions, setProductions] = useState([]);
  const [form, setForm] = useState({ titulo: '', descripcion: '', color: '#F48C06' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listProductions();
      setProductions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.titulo) {
      showError('Ingresá el nombre de la obra');
      return;
    }
    setSaving(true);
    try {
      await createProduction(form);
      setForm({ titulo: '', descripcion: '', color: form.color });
      load();
      showSuccess('✨ Obra creada con éxito');
    } catch (error) {
      showError(error.message || 'No se pudo crear la obra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (obra) => {
    Alert.alert(
      '🗑️ Eliminar Obra',
      `¿Seguro que querés eliminar "${obra.titulo}"? Esto borrará todas las funciones y tickets asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduction(obra.id);
              load();
              showSuccess('🗑️ Obra eliminada con éxito');
            } catch (error) {
              showError(error.message || 'No se pudo eliminar la obra');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>🎭 Obras</Text>
            <Text style={styles.headerSubtitle}>Gestión de producciones</Text>
          </View>
          <MaterialCommunityIcons name="theater" size={48} color="#8B0000" />
        </View>
      </LinearGradient>
      
      <SectionCard title="Nueva obra" subtitle="Define la paleta y la sinopsis">
        <TextInput
          style={styles.input}
          placeholder="Nombre de la obra"
          placeholderTextColor={colors.textSoft}
          value={form.titulo}
          onChangeText={(titulo) => setForm((prev) => ({ ...prev, titulo }))}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Descripción / sinopsis"
          placeholderTextColor={colors.textSoft}
          multiline
          numberOfLines={3}
          value={form.descripcion}
          onChangeText={(descripcion) => setForm((prev) => ({ ...prev, descripcion }))}
        />
        <TextInput
          style={styles.input}
          placeholder="#F48C06"
          placeholderTextColor={colors.textSoft}
          value={form.color}
          onChangeText={(color) => setForm((prev) => ({ ...prev, color }))}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.black} /> : <Text style={styles.buttonText}>Crear obra</Text>}
        </TouchableOpacity>
      </SectionCard>

      <SectionCard title="Obras en cartel" subtitle={`${productions.length} proyectos`}>
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : productions.length === 0 ? (
          <Text style={styles.empty}>Todavía no creaste obras</Text>
        ) : (
          productions.map((obra) => (
            <View key={obra.id} style={styles.row}>
              <View style={styles.colorDot(obra.color)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{obra.titulo}</Text>
                <Text style={styles.meta}>{obra.funciones} funciones · {obra.entradas} entradas</Text>
              </View>
              <Text style={styles.meta}>{obra.estado}</Text>
              <TouchableOpacity onPress={() => handleDelete(obra)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Eliminar</Text>
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
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#000',
    opacity: 0.8,
    marginTop: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
  },
  multiline: {
    textAlignVertical: 'top',
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
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colorDot: (colorHex) => ({
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colorHex,
  }),
  name: {
    color: colors.white,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  empty: {
    color: colors.textSoft,
    fontStyle: 'italic',
  },
  deleteBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  deleteText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
});
