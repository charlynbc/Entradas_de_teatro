import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';

export default function ContactoScreen() {
  const openLinkedIn = () => {
    Linking.openURL('https://www.linkedin.com/in/charlyn-barreiro-curbelo-5684b4240/');
  };

  const openInstagram = () => {
    Linking.openURL('https://www.instagram.com/charly_nbc/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header con gradiente */}
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          style={styles.headerGradient}
        >
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account-circle" size={100} color="#000" />
          </View>
          <Text style={styles.name}>Carlos Barrios</Text>
          <Text style={styles.role}>Desarrollador Full Stack</Text>
        </LinearGradient>

        {/* Sección Sobre Mí */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <MaterialCommunityIcons name="account-details" size={20} color={colors.secondary} /> Sobre mí
          </Text>
          <Text style={styles.bioText}>
            ¿Interesado en tener una página web o aplicación personalizada? 
            Me especializo en crear soluciones digitales profesionales y escalables 
            para tu negocio o proyecto.
          </Text>
        </View>

        {/* Botones de Redes Sociales */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.instagramButton} onPress={openInstagram}>
            <LinearGradient
              colors={['#833AB4', '#FD1D1D', '#FCAF45']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.socialGradient}
            >
              <MaterialCommunityIcons name="instagram" size={28} color="#fff" />
              <Text style={styles.socialText}>@charly_nbc</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkedinButton} onPress={openLinkedIn}>
            <LinearGradient
              colors={['#0077B5', '#0e76a8']}
              style={styles.socialGradient}
            >
              <Ionicons name="logo-linkedin" size={28} color="#fff" />
              <Text style={styles.socialText}>Ver perfil completo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Servicios */}
        <View style={styles.servicesCard}>
          <Text style={styles.cardTitle}>
            <MaterialCommunityIcons name="briefcase" size={20} color={colors.secondary} /> Servicios
          </Text>
          <View style={styles.serviceItem}>
            <MaterialCommunityIcons name="web" size={24} color="#FFD700" />
            <Text style={styles.serviceText}>Desarrollo Web y Móvil</Text>
          </View>
          <View style={styles.serviceItem}>
            <MaterialCommunityIcons name="database" size={24} color="#FFD700" />
            <Text style={styles.serviceText}>Bases de Datos y Backend</Text>
          </View>
          <View style={styles.serviceItem}>
            <MaterialCommunityIcons name="cloud-upload" size={24} color="#FFD700" />
            <Text style={styles.serviceText}>Deploy y Mantenimiento</Text>
          </View>
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
    paddingBottom: 40,
  },
  headerGradient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#000',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  role: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#8B0000',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  socialContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  instagramButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#833AB4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  linkedinButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0077B5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  socialGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  socialText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  servicesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: '#4B0082',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  serviceText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
});
