import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

export default function GuestManualScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual de Usuario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Ionicons name="ticket-outline" size={32} color={colors.secondary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Cómo Reservar Entradas</Text>
          <Text style={styles.text}>
            1. Navega por las funciones disponibles en la pantalla principal.{'\n'}
            2. Selecciona la función que te interesa.{'\n'}
            3. Elige un vendedor disponible.{'\n'}
            4. Completa tus datos de contacto.{'\n'}
            5. Confirma tu reserva.{'\n'}
            6. Recibirás un código QR que deberás presentar en la entrada.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Ionicons name="qr-code-outline" size={32} color={colors.secondary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Tu Código QR</Text>
          <Text style={styles.text}>
            Una vez confirmada tu reserva, recibirás un código QR único.{'\n\n'}
            Guarda este código y preséntalo en el teatro antes de la función.{'\n\n'}
            El código será escaneado a la entrada para validar tu ingreso.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Ionicons name="information-circle-outline" size={32} color={colors.secondary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Información Importante</Text>
          <Text style={styles.text}>
            • Las reservas deben confirmarse con al menos 2 horas de anticipación.{'\n'}
            • Llega al teatro 15 minutos antes del inicio.{'\n'}
            • El código QR es personal e intransferible.{'\n'}
            • En caso de problemas, contacta al vendedor directamente.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Ionicons name="people-outline" size={32} color={colors.secondary} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>¿Eres del Elenco?</Text>
          <Text style={styles.text}>
            Si formas parte del equipo de Baco Teatro, puedes acceder con tus credenciales.{'\n\n'}
            Usa el botón "Soy del elenco" en la pantalla principal para iniciar sesión.
          </Text>
        </View>

        <View style={styles.aboutSection}>
          <Ionicons name="theater" size={40} color={colors.secondary} />
          <Text style={styles.aboutTitle}>Baco Teatro</Text>
          <Text style={styles.aboutText}>
            Compañía teatral uruguaya con más de 25 años de trayectoria.{'\n'}
            Dirigida por Gustavo Bouzas y Horacio Nieves.{'\n'}
            Afiliados a F.U.T.I., S.U.A., AGADU.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionIcon: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: 32,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSoft,
    textAlign: 'center',
  },
});
