import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Toast({ visible, message, type = 'success', onHide }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, slideAnim, onHide]);

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#2ECC71', '#27AE60', '#229954'],
          icon: 'check-circle',
          borderColor: '#FFD700',
        };
      case 'error':
        return {
          colors: ['#E74C3C', '#C0392B', '#922B21'],
          icon: 'alert-circle',
          borderColor: '#FF6B6B',
        };
      case 'warning':
        return {
          colors: ['#F39C12', '#E67E22', '#D68910'],
          icon: 'alert',
          borderColor: '#FFD700',
        };
      case 'info':
        return {
          colors: ['#3498DB', '#2E86C1', '#2471A3'],
          icon: 'information',
          borderColor: '#5DADE2',
        };
      default:
        return {
          colors: ['#2ECC71', '#27AE60', '#229954'],
          icon: 'check-circle',
          borderColor: '#FFD700',
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.toast, { borderColor: config.borderColor }]}
      >
        <MaterialCommunityIcons name={config.icon} size={28} color="#FFF" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
