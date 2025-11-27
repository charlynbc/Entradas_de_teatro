import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import colors from '../theme/colors';
import { getQR } from '../api/api';

export default function TicketQRScreen({ route }) {
  const { ticket } = route.params;
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQR();
  }, []);

  const loadQR = async () => {
    try {
      const data = await getQR(ticket.code);
      if (data.qr) {
        setQrData(data.qr);
      } else {
        Alert.alert('Error', 'No se pudo cargar el código QR');
      }
    } catch (error) {
      console.error('Error cargando QR:', error);
      Alert.alert('Error', 'No se pudo cargar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!qrData) {
      Alert.alert('Error', 'No hay código QR para compartir');
      return;
    }

    try {
      // Convertir base64 a archivo temporal
      const base64Code = qrData.split('data:image/png;base64,')[1];
      const filename = FileSystem.documentDirectory + `ticket_${ticket.code}.png`;
      
      await FileSystem.writeAsStringAsync(filename, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Compartir archivo
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filename, {
          mimeType: 'image/png',
          dialogTitle: `Ticket ${ticket.code}`,
        });
      } else {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error compartiendo QR:', error);
      Alert.alert('Error', 'No se pudo compartir el código QR');
    }
  };

  const getEstadoBadge = () => {
    const badges = {
      REPORTADA_VENDIDA: {
        text: 'Esperando aprobación',
        color: colors.warning,
        icon: '⏳',
      },
      PAGADO: {
        text: 'Pagado y confirmado',
        color: colors.success,
        icon: '✅',
      },
      USADO: {
        text: 'Ya usado',
        color: colors.gray,
        icon: '🎭',
      },
    };

    return badges[ticket.estado] || { text: ticket.estado, color: colors.gray, icon: '' };
  };

  const badge = getEstadoBadge();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generando código QR...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Estado badge */}
        <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
          <Text style={styles.statusText}>
            {badge.icon} {badge.text}
          </Text>
        </View>

        {/* Información del ticket */}
        <View style={styles.ticketCard}>
          <Text style={styles.ticketCode}>{ticket.code}</Text>
          <Text style={styles.ticketObra}>{ticket.obra}</Text>
          <Text style={styles.ticketFecha}>
            {new Date(ticket.fecha).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Código QR */}
        {qrData && (
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: qrData }}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.qrLabel}>
              Escanea este código en la entrada
            </Text>
          </View>
        )}

        {/* Datos del comprador */}
        {ticket.comprador_nombre && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>👤 Comprador</Text>
            <Text style={styles.infoValue}>{ticket.comprador_nombre}</Text>
            {ticket.comprador_contacto && (
              <Text style={styles.infoContact}>{ticket.comprador_contacto}</Text>
            )}
          </View>
        )}

        {/* Precio */}
        {ticket.precio && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💰 Precio</Text>
            <Text style={styles.priceValue}>${ticket.precio}</Text>
          </View>
        )}

        {/* Botón compartir */}
        {ticket.estado === 'PAGADO' && (
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>
              📤 Compartir QR con comprador
            </Text>
          </TouchableOpacity>
        )}

        {/* Mensajes informativos */}
        {ticket.estado === 'REPORTADA_VENDIDA' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⏳ Esperando aprobación</Text>
            <Text style={styles.warningText}>
              El administrador debe aprobar el pago para que el ticket quede confirmado.
              Una vez aprobado, podrás compartir el QR con el comprador.
            </Text>
          </View>
        )}

        {ticket.estado === 'PAGADO' && (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>✅ Ticket listo</Text>
            <Text style={styles.successText}>
              El ticket está confirmado y pagado. El comprador puede usar este QR
              para ingresar a la función. Guarda una captura o compártelo directamente.
            </Text>
          </View>
        )}

        {ticket.estado === 'USADO' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>🎭 Ticket usado</Text>
            <Text style={styles.infoBoxText}>
              Este ticket ya fue validado y usado para ingresar a la función.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.gray,
    fontSize: 16,
  },
  content: {
    padding: 24,
  },
  statusBadge: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  ticketObra: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  ticketFecha: {
    fontSize: 14,
    color: colors.gray,
  },
  qrContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrImage: {
    width: 280,
    height: 280,
    marginBottom: 16,
  },
  qrLabel: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  infoContact: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.gray,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
});
