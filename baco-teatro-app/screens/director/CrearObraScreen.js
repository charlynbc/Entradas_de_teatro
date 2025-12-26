import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { crearObra } from '../../api';
import colors from '../../theme/colors';

export default function CrearObraScreen({ route, navigation }) {
  const { grupoId, grupoNombre } = route.params;
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    autor: '',
    genero: '',
    duracion_aprox: ''
  });

  const handleCrear = async () => {
    if (!formData.nombre) {
      showError('El nombre de la obra es obligatorio');
      return;
    }

    try {
      const payload = {
        grupo_id: grupoId,
        ...formData,
        duracion_aprox: formData.duracion_aprox ? parseInt(formData.duracion_aprox) : null
      };
      
      await crearObra(payload);
      showSuccess('Obra creada exitosamente');
      navigation.goBack();
    } catch (error) {
      showError(error.message || 'Error al crear obra');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Nueva Obra</Text>
            <View style={styles.grupoTag}>
              <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} />
              <Text style={styles.grupoNombre}>{grupoNombre}</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la Obra *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="drama-masks" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                placeholder="Ej: Esperando a Godot"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
              <MaterialCommunityIcons 
                name="text" 
                size={20} 
                color={colors.textMuted} 
                style={{ marginTop: 12 }} 
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.descripcion}
                onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                placeholder="Sinopsis de la obra"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>

          {/* Autor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Autor</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.autor}
                onChangeText={(text) => setFormData({ ...formData, autor: text })}
                placeholder="Ej: Samuel Beckett"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Género */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Género</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="theater" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.genero}
                onChangeText={(text) => setFormData({ ...formData, genero: text })}
                placeholder="Ej: Drama, Comedia, Tragedia"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Duración */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duración Aproximada (minutos)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="time-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.duracion_aprox}
                onChangeText={(text) => setFormData({ ...formData, duracion_aprox: text })}
                placeholder="120"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={colors.secondary} />
            <Text style={styles.infoText}>
              La obra será creada en estado "En desarrollo". Desde aquí podrás crear ensayos y funciones.
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCrear}
            >
              <LinearGradient
                colors={[colors.secondary, colors.secondary + 'DD']}
                style={styles.createButtonGradient}
              >
                <MaterialCommunityIcons name="drama-masks" size={20} color="white" />
                <Text style={styles.createButtonText}>Crear Obra</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  grupoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  grupoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.secondary + '10',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  createButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
