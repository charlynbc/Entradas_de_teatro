import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Botón teatral reutilizable con gradientes y estética consistente
 * 
 * @param {string} title - Texto del botón
 * @param {function} onPress - Función a ejecutar al presionar
 * @param {string} variant - Estilo del botón: 'primary', 'secondary', 'danger', 'success', 'gold'
 * @param {string} icon - Nombre del ícono de MaterialCommunityIcons
 * @param {boolean} disabled - Si el botón está deshabilitado
 * @param {boolean} loading - Si muestra indicador de carga
 * @param {object} style - Estilos adicionales para el contenedor
 * @param {object} textStyle - Estilos adicionales para el texto
 */
export default function TheatricalButton({ 
  title, 
  onPress, 
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle
}) {
  const getGradientColors = () => {
    switch(variant) {
      case 'primary':
        return ['#8B0000', '#DC143C', '#8B0000']; // Crimson
      case 'secondary':
        return ['#4B0082', '#8A2BE2', '#4B0082']; // Purple
      case 'danger':
        return ['#B22222', '#FF6347', '#B22222']; // Red
      case 'success':
        return ['#228B22', '#32CD32', '#228B22']; // Green
      case 'gold':
        return ['#FFD700', '#FFA500', '#FFD700']; // Gold
      case 'dark':
        return ['#2C1810', '#4A2C1C', '#2C1810']; // Dark brown
      default:
        return ['#8B0000', '#DC143C', '#8B0000'];
    }
  };

  const getIconColor = () => {
    return variant === 'gold' ? '#000' : '#FFD700';
  };

  const getTextColor = () => {
    return variant === 'gold' ? '#000' : '#FFD700';
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      style={[styles.container, style, (disabled || loading) && styles.disabled]}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={getIconColor()} size="small" />
          ) : (
            <>
              {icon && (
                <MaterialCommunityIcons 
                  name={icon} 
                  size={24} 
                  color={getIconColor()} 
                  style={styles.icon}
                />
              )}
              <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
