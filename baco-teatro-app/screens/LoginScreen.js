import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import { login } from '../api/api';

export default function LoginScreen({ onLogin }) {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!cedula || !password) {
      Alert.alert('Error', 'Por favor ingresa cédula y contraseña');
      return;
    }

    setLoading(true);
    console.log('Iniciando login...');
    console.log('Cédula:', cedula);
    
    try {
      const data = await login(cedula, password);
      console.log('Datos recibidos:', data);

      if (data.error) {
        console.error('Error del servidor:', data.error);
        Alert.alert('Error', data.error);
        setLoading(false);
        return;
      }

      // El backend devuelve: { token, usuario: { id, nombre, rol, ... } }
      if (data.token && data.usuario) {
        console.log('Login exitoso, usuario:', data.usuario);
        await onLogin(data.usuario, data.token);
      } else {
        console.error('Respuesta inválida:', data);
        Alert.alert('Error', 'Respuesta inválida del servidor');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error en login:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'No se pudo conectar con el servidor: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo o título */}
        <View style={styles.header}>
          <Text style={styles.title}>🎭</Text>
          <Text style={styles.subtitle}>Baco Teatro</Text>
          <Text style={styles.version}>Sistema de Tickets v3.0</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.label}>Cédula</Text>
          <TextInput
            style={styles.input}
            placeholder="12345678"
            placeholderTextColor={colors.gray}
            value={cedula}
            onChangeText={setCedula}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Sistema de gestión de entradas {'\n'}
          para teatro independiente
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: colors.gray,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 12,
    lineHeight: 18,
  },
});
