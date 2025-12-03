import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';

export default function DeveloperScreen({ navigation }) {
  const openLinkedIn = () => {
    Linking.openURL('https://www.linkedin.com/in/carlos-barrios-10474720b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app');
  };

  const openInstagram = () => {
    Linking.openURL('https://www.instagram.com/charly_nbc/');
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/charlynbc');
  };

  const openEmail = () => {
    Linking.openURL('mailto:charly_nbc@icloud.com');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.content}>
        {/* Cortinas teatrales superior */}
        <View style={styles.curtainTop}>
          <View style={styles.curtainLeft} />
          <View style={styles.curtainRight} />
        </View>

        {/* Header con spotlight */}
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          style={styles.headerGradient}
        >
          <View style={styles.spotlightContainer}>
            <View style={styles.spotlight}>
              <MaterialCommunityIcons name="account-circle" size={80} color="#000" />
            </View>
          </View>
          <Text style={styles.name}>Carlos Barrios</Text>
          <Text style={styles.role}>💻 Desarrollador Full Stack</Text>
          <Text style={styles.tagline}>Creando experiencias digitales únicas</Text>
        </LinearGradient>

        {/* Sección Sobre Mí */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="drama-masks" size={24} color={colors.secondary} />
            <Text style={styles.cardTitle}>Sobre el Desarrollador</Text>
          </View>
          <Text style={styles.bioText}>
            Especialista en desarrollo web y móvil con pasión por crear soluciones 
            digitales profesionales y escalables. Transformo ideas en aplicaciones 
            funcionales y elegantes.
          </Text>
        </View>

        {/* Botones de Redes Sociales Teatrales */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={openInstagram}>
            <LinearGradient
              colors={['#833AB4', '#FD1D1D', '#FCAF45']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.socialGradient}
            >
              <MaterialCommunityIcons name="instagram" size={32} color="#fff" />
              <View style={styles.socialTextContainer}>
                <Text style={styles.socialLabel}>Instagram</Text>
                <Text style={styles.socialHandle}>@charly_nbc</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} onPress={openLinkedIn}>
            <LinearGradient
              colors={['#0077B5', '#0e76a8']}
              style={styles.socialGradient}
            >
              <Ionicons name="logo-linkedin" size={32} color="#fff" />
              <View style={styles.socialTextContainer}>
                <Text style={styles.socialLabel}>LinkedIn</Text>
                <Text style={styles.socialHandle}>Ver perfil profesional</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} onPress={openGitHub}>
            <LinearGradient
              colors={['#24292e', '#1a1d21']}
              style={styles.socialGradient}
            >
              <Ionicons name="logo-github" size={32} color="#fff" />
              <View style={styles.socialTextContainer}>
                <Text style={styles.socialLabel}>GitHub</Text>
                <Text style={styles.socialHandle}>Proyectos y código</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Servicios con iconos teatrales */}
        <View style={styles.servicesCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="briefcase" size={24} color={colors.secondary} />
            <Text style={styles.cardTitle}>Servicios Profesionales</Text>
          </View>
          
          <View style={styles.serviceItem}>
            <LinearGradient
              colors={['#4B0082', '#8A2BE2']}
              style={styles.serviceIcon}
            >
              <MaterialCommunityIcons name="web" size={28} color="#FFD700" />
            </LinearGradient>
            <View style={styles.serviceTextContainer}>
              <Text style={styles.serviceTitle}>Desarrollo Web & Móvil</Text>
              <Text style={styles.serviceDesc}>Apps nativas y web responsivas</Text>
            </View>
          </View>

          <View style={styles.serviceItem}>
            <LinearGradient
              colors={['#8B0000', '#DC143C']}
              style={styles.serviceIcon}
            >
              <MaterialCommunityIcons name="database" size={28} color="#FFD700" />
            </LinearGradient>
            <View style={styles.serviceTextContainer}>
              <Text style={styles.serviceTitle}>Backend & Bases de Datos</Text>
              <Text style={styles.serviceDesc}>APIs RESTful y PostgreSQL</Text>
            </View>
          </View>

          <View style={styles.serviceItem}>
            <LinearGradient
              colors={['#228B22', '#32CD32']}
              style={styles.serviceIcon}
            >
              <MaterialCommunityIcons name="cloud-upload" size={28} color="#FFD700" />
            </LinearGradient>
            <View style={styles.serviceTextContainer}>
              <Text style={styles.serviceTitle}>Deploy & Mantenimiento</Text>
              <Text style={styles.serviceDesc}>Hosting, CI/CD y soporte</Text>
            </View>
          </View>

          <View style={styles.serviceItem}>
            <LinearGradient
              colors={['#FF8C00', '#FFD700']}
              style={styles.serviceIcon}
            >
              <MaterialCommunityIcons name="chart-line" size={28} color="#000" />
            </LinearGradient>
            <View style={styles.serviceTextContainer}>
              <Text style={styles.serviceTitle}>Consultoría & Optimización</Text>
              <Text style={styles.serviceDesc}>Mejora de rendimiento</Text>
            </View>
          </View>
        </View>

        {/* CTA Contacto */}
        <TouchableOpacity style={styles.ctaButton} onPress={openEmail}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FFD700']}
            style={styles.ctaGradient}
          >
            <MaterialCommunityIcons name="email-outline" size={28} color="#000" />
            <Text style={styles.ctaText}>Contactar para Proyectos</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Botón Volver a Inicio - Teatral */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('GuestHome')}
        >
          <LinearGradient
            colors={['#8B0000', '#DC143C', '#8B0000']}
            style={styles.backGradient}
          >
            <View style={styles.backContent}>
              <MaterialCommunityIcons name="home-variant" size={32} color="#FFD700" />
              <Text style={styles.backText}>Volver al Inicio</Text>
              <MaterialCommunityIcons name="arrow-left-circle" size={24} color="#FFD700" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer decorativo */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="theater" size={24} color={colors.secondary} />
          <Text style={styles.footerText}>Hecho con pasión por el código</Text>
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
