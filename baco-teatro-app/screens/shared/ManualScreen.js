import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

const MANUAL_CONTENT = {
  ADMIN: [
    {
      title: 'Gestión de Funciones',
      steps: [
        'Ve a la pestaña "Funciones" y toca "Nueva" para crear un espectáculo.',
        'Define obra, fecha, lugar y capacidad. Al guardar, se generan los tickets.',
        'Entra al detalle de la función para asignar entradas a los actores ("Dar Entradas").'
      ]
    },
    {
      title: 'Control de Caja (Cobros)',
      steps: [
        'El flujo es: Actor Vende -> Director Cobra -> Entrada Válida.',
        'En el detalle de la función, busca actores con ventas pendientes.',
        'Toca el botón verde "Cobrar" cuando recibas el dinero.',
        'Solo las entradas cobradas (PAGADA) pasan el scanner.'
      ]
    },
    {
      title: 'Scanner y Puerta',
      steps: [
        'Usa la pestaña "Escaner" para validar ingresos.',
        'En el celular, usa la cámara para escanear el QR de la entrada.',
        'Si estás en PC, puedes ingresar el código manualmente.',
        'Luz Verde = Pase. Luz Roja = Rechazado.'
      ]
    }
  ],
  VENDEDOR: [
    {
      title: 'Tu Stock y Ventas',
      steps: [
        'En "Stock" ves las entradas que te asignaron.',
        'Para vender: Toca una entrada "No vendida" y marca "Marcar como Vendida".',
        'Ingresa los datos del comprador (Nombre y Teléfono) para tener un registro.'
      ]
    },
    {
      title: 'Enviar Entrada (WhatsApp)',
      steps: [
        'Una vez que la entrada está VENDIDA o PAGADA, verás el icono de WhatsApp.',
        'Tócalo para generar la "Entrada Dorada" en PDF.',
        'Se abrirá WhatsApp automáticamente para enviarla a tu comprador.',
        '¡Es importante enviar el PDF para que tengan el QR!'
      ]
    },
    {
      title: 'Regla de Oro: El Pago',
      steps: [
        'Cuando marcas una entrada como "Vendida", aún NO es válida para entrar.',
        'Debes entregar el dinero al Director.',
        'Cuando el Director registre el cobro, la entrada pasará a estado "PAGADA" y servirá para entrar.',
        'Avisa siempre a tus compradores de esto.'
      ]
    },
    {
      title: 'Transferencias',
      steps: [
        'Si te sobran entradas, usa la pestaña "Transferir".',
        'Puedes pasar stock a otro compañero vendedor al instante.'
      ]
    }
  ],
  SUPER: [
    {
      title: 'Superusuario',
      steps: [
        'Tienes acceso total a todas las funciones de Director.',
        'Puedes gestionar usuarios (crear directores, actores).',
        'Puedes ver métricas globales de todo el teatro.'
      ]
    }
  ]
};

export default function ManualScreen({ navigation }) {
  const { user } = useAuth();
  const role = user?.role || 'VENDEDOR';
  const content = MANUAL_CONTENT[role] || MANUAL_CONTENT.VENDEDOR;

  const getRoleTitle = () => {
    if (role === 'ADMIN') return 'Manual del Director';
    if (role === 'SUPER') return 'Manual de Superusuario';
    return 'Manual del Actor';
  };

  return (
    <ScreenContainer>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getRoleTitle()}</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.intro}>
          Bienvenido, {user?.nombre}. Aquí tienes la guía rápida para usar la aplicación según tu rol.
        </Text>

        {content.map((section, index) => (
          <SectionCard key={index} title={`${index + 1}. ${section.title}`}>
            {section.steps.map((step, stepIndex) => (
              <View key={stepIndex} style={styles.stepRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </SectionCard>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Baco Teatro App v1.0</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  intro: {
    color: colors.textMuted,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 10,
  },
  bullet: {
    color: colors.secondary,
    fontSize: 18,
    marginRight: 10,
    marginTop: -2,
  },
  stepText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
