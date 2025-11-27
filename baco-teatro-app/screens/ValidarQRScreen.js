import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import colors from '../theme/colors';
import { validateTicket } from '../api/api';

export default function ValidarQRScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      // Extraer código del QR (puede ser URL o código directo)
      let code = data;
      
      // Si es URL, extraer el código
      if (data.includes('/validar/')) {
        const parts = data.split('/validar/');
        code = parts[parts.length - 1];
      }

      const result = await validateTicket(code);

      if (result.error) {
        Alert.alert('❌ Error', result.error, [
          { text: 'Escanear otro', onPress: () => setScanned(false) },
        ]);
        return;
      }

      Alert.alert(
        '✅ Ticket Válido',
        `Código: ${result.code}\nObra: ${result.obra}\nComprador: ${result.comprador_nombre}\n\n¡Entrada validada!`,
        [
          {
            text: 'Escanear otro',
            onPress: () => setScanned(false),
          },
        ]
      );
    } catch (error) {
      console.error('Error validando ticket:', error);
      Alert.alert('Error', 'No se pudo validar el ticket', [
        { text: 'Reintentar', onPress: () => setScanned(false) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          📸 No hay acceso a la cámara
        </Text>
        <Text style={styles.errorSubtext}>
          Por favor habilita los permisos de cámara en la configuración
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleOverlay}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.instructions}>
            {scanned
              ? loading
                ? '⏳ Validando...'
                : 'Ticket escaneado'
              : '📸 Apunta la cámara al código QR'}
          </Text>
          {scanned && !loading && (
            <Text
              style={styles.scanAgain}
              onPress={() => setScanned(false)}
            >
              Tocar para escanear otro
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    color: colors.white,
    fontSize: 16,
  },
  errorText: {
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 300,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  instructions: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scanAgain: {
    marginTop: 16,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
});
