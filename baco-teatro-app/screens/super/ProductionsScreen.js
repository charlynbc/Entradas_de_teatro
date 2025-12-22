import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { listProductions, createProduction } from '../../api';

export default function ProductionsScreen() {
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
      if (Platform.OS === 'web') {
        alert('Falta título\n\nIngresá el nombre de la obra');
      } else {
        Alert.alert('Falta título', 'Ingresá el nombre de la obra');
      }
      return;
    }
    setSaving(true);
    try {
      await createProduction(form);
      setForm({ titulo: '', descripcion: '', color: form.color });
      load();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert(`Error\n\n${error.message || 'No se pudo crear la obra'}`);
      } else {
        Alert.alert('Error', error.message || 'No se pudo crear la obra');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
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
});
