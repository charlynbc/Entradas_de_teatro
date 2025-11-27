import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import colors from '../theme/colors';
import { crearUsuario } from '../api/api';

export default function CrearUsuarioScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('VENDEDOR');
  const [loading, setLoading] = useState(false);

  const handleCrear = async () => {
    if (!phone || !name) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!phone.startsWith('+')) {
      Alert.alert('Error', 'El teléfono debe incluir el código de país (+549...)');
      return;
    }

    setLoading(true);
    try {
      const data = await crearUsuario({
        phone,
        name,
        role,
      });

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert(
        'Usuario creado',
        `Usuario ${name} creado exitosamente.\nDeberá completar su registro en el primer login.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creando usuario:', error);
      Alert.alert('Error', 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Crear Usuario</Text>
        <Text style={styles.subtitle}>
          El usuario deberá completar su contraseña en el primer login
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Teléfono *</Text>
          <TextInput
            style={styles.input}
            placeholder="+5491122334455"
            placeholderTextColor={colors.gray}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan Pérez"
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Rol *</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'VENDEDOR' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('VENDEDOR')}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'VENDEDOR' && styles.roleButtonTextActive,
                ]}
              >
                🎟️ Vendedor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'ADMIN' && styles.roleButtonActive,
              ]}
              onPress={() => setRole('ADMIN')}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'ADMIN' && styles.roleButtonTextActive,
                ]}
              >
                👑 Administrador
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCrear}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createButtonText}>Crear Usuario</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            • El usuario recibirá un SMS con instrucciones{'\n'}
            • En el primer login deberá crear su contraseña{'\n'}
            • Los vendedores solo pueden gestionar sus tickets{'\n'}
            • Los admins tienen acceso completo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: colors.white,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});
