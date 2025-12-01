import React from 'react';
import { Alert, StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';

function ActionButton({ icon, label, onPress, variant = 'primary' }) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' && styles.secondaryButton]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={16}
        color={variant === 'secondary' ? colors.white : colors.black}
      />
      <Text
        style={[styles.buttonText, variant === 'secondary' && styles.secondaryText]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function GlobalActions() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Confirmás que querés salir?')) {
        logout();
      }
    } else {
      Alert.alert('Cerrar sesión', '¿Confirmás que querés salir?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const handleSupport = () => {
    if (Platform.OS === 'web') {
      alert('Soporte Baco Teatro\n\nDesarrollado por Carlos Barrios.\nLinkedIn: www.linkedin.com/in/carlos-barrios-10474720b');
    } else {
      Alert.alert(
        'Soporte Baco Teatro',
        'Desarrollado por Carlos Barrios.\nLinkedIn: www.linkedin.com/in/carlos-barrios-10474720b'
      );
    }
  };

  const goProfile = () => {
    navigation.navigate('Perfil');
  };

  const goManual = () => {
    navigation.navigate('Manual');
  };

  return (
    <View style={styles.bar}>
      <ActionButton icon="person-circle-outline" label="Mi perfil" onPress={goProfile} variant="secondary" />
      <ActionButton icon="book-outline" label="Manual" onPress={goManual} variant="secondary" />
      <ActionButton icon="chatbubbles-outline" label="Soporte" onPress={handleSupport} variant="secondary" />
      <ActionButton icon="log-out-outline" label="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.black,
    fontWeight: '700',
  },
  secondaryText: {
    color: colors.white,
  },
});
