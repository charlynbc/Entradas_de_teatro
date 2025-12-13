import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';

export default function DeveloperScreen({ navigation }) {
  const openLinkedIn = () => {
    Linking.openURL('https://www.linkedin.com/in/charlyn-barreiro-curbelo-5684b4240/');
  };

  const openInstagram = () => {
    Linking.openURL('https://www.instagram.com/charly_nbc/');
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/charlynbc');
  };

  const openEmail = () => {
    Linking.openURL('mailto:charlyn.barreiro@example.com');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.headerGradient}>
          <MaterialCommunityIcons name="account-circle" size={80} color="#000" />
          <Text style={styles.name}>Carlos Barrios</Text>
          <Text style={styles.role}>Desarrollador</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.bioText}>Construyo software claro y útil. Si te interesa colaborar, envíame un correo.</Text>
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={openEmail}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.ctaGradient}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#000" />
            <Text style={styles.ctaText}>Enviar correo</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('GuestHome')}>
          <LinearGradient colors={['#8B0000', '#DC143C']} style={styles.backGradient}>
            <View style={styles.backContent}>
              <MaterialCommunityIcons name="home-variant" size={28} color="#FFD700" />
              <Text style={styles.backText}>Inicio</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
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
  curtainTop: {
    height: 40,
    flexDirection: 'row',
  },
  curtainLeft: {
    flex: 1,
    backgroundColor: '#8B0000',
    borderBottomRightRadius: 50,
    borderRightWidth: 4,
    borderRightColor: '#FFD700',
  },
  curtainRight: {
    flex: 1,
    backgroundColor: '#8B0000',
    borderBottomLeftRadius: 50,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  headerGradient: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  spotlightContainer: {
    marginBottom: 16,
  },
  spotlight: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#000',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  role: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  card: {
    margin: 20,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8,
  },
  bioText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  socialContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  socialButton: {
    marginBottom: 16,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  socialGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  socialTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  socialLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  socialHandle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  servicesCard: {
    margin: 20,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },
  ctaButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 12,
  },
  backButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  backGradient: {
    padding: 20,
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
