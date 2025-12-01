import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

export default function ContactoScreen() {
  const openLinkedIn = () => {
    Linking.openURL('https://www.linkedin.com/in/charlyn-barreiro-curbelo-5684b4240/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="code-slash" size={64} color={colors.secondary} />
          <Text style={styles.title}>Desarrollador</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.infoSection}>
            <Ionicons name="person" size={24} color={colors.secondary} style={styles.icon} />
            <View style={styles.infoText}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>Carlos Barrios</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Ionicons name="briefcase" size={24} color={colors.secondary} style={styles.icon} />
            <View style={styles.infoText}>
              <Text style={styles.label}>Rol</Text>
              <Text style={styles.value}>Full Stack Developer</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Ionicons name="code-working" size={24} color={colors.secondary} style={styles.icon} />
            <View style={styles.infoText}>
              <Text style={styles.label}>Tecnologías</Text>
              <Text style={styles.value}>React Native • Node.js • PostgreSQL</Text>
            </View>
          </View>
        </View>

        {/* LinkedIn Button */}
        <TouchableOpacity style={styles.linkedinButton} onPress={openLinkedIn}>
          <Ionicons name="logo-linkedin" size={24} color="#fff" />
          <Text style={styles.linkedinText}>Ver perfil en LinkedIn</Text>
        </TouchableOpacity>

        {/* About Project */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Sobre este proyecto</Text>
          <Text style={styles.aboutText}>
            Sistema de gestión de entradas para Baco Teatro, desarrollado con React Native y 
            Node.js. Incluye gestión de usuarios, obras, reservas y validación de tickets mediante QR.
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 12,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  linkedinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0077B5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  linkedinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  aboutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
