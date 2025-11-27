import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { colors } from '../theme/colors';
import { validateTicket, getTicket } from '../services/api';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // El QR puede contener solo el código o una URL
      // Intentamos extraer el código si es una URL
      let code = data;
      if (data.includes('/')) {
        const parts = data.split('/');
        code = parts[parts.length - 1];
      }
      
      // Extraer código si tiene parámetros
      if (code.includes('?')) {
        const match = code.match(/code=([^&]+)/);
        if (match) {
          code = match[1];
        }
      }

      console.log('Código escaneado:', code);

      // Primero obtenemos info del ticket
      const ticketInfo = await getTicket(code);
      
      // Crear mensaje según el estado
      let mensaje = `Código: ${ticketInfo.code}\n` +
        `Función: ${ticketInfo.tituloShow}\n` +
        `Fecha: ${ticketInfo.fechaShow} - ${ticketInfo.horaShow}\n` +
        `Estado: ${ticketInfo.estado}\n`;
      
      if (ticketInfo.nombreComprador) {
        mensaje += `Comprador: ${ticketInfo.nombreComprador}\n`;
      }

      // Si no está pagado, mostrar mensaje específico
      if (ticketInfo.estado !== 'PAGADO' && ticketInfo.estado !== 'USADO') {
        const estadoMensaje = {
          'DISPONIBLE': '⚠️ Este ticket aún no fue asignado a ningún vendedor',
          'STOCK_VENDEDOR': '⚠️ Este ticket está en stock del vendedor pero no fue reservado',
          'RESERVADO': '⚠️ Este ticket está RESERVADO pero NO PAGADO. El comprador debe pagar primero.',
        };

        Alert.alert(
          '❌ No se puede validar',
          mensaje + '\n' + (estadoMensaje[ticketInfo.estado] || 'Estado no válido'),
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              },
            },
          ]
        );
        return;
      }

      // Si ya fue usado
      if (ticketInfo.estado === 'USADO') {
        Alert.alert(
          '⚠️ Ticket ya usado',
          mensaje + '\n❌ Este ticket ya fue validado anteriormente.',
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              },
            },
          ]
        );
        return;
      }

      // Si está pagado, confirmar validación
      Alert.alert(
        '✅ Ticket pagado',
        mensaje + '\n¿Confirmar ingreso?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
          {
            text: 'Validar ingreso',
            onPress: () => validarTicket(code),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo leer el código');
      setScanned(false);
      setLoading(false);
    }
  };

  const validarTicket = async (code) => {
    try {
      const result = await validateTicket(code);
      
      Alert.alert(
        '✅ Ticket válido',
        result.mensaje || 'Ticket validado correctamente. ¡Bienvenido!',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        '❌ Ticket no válido',
        error.message,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setLoading(false);
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
        <Text style={styles.message}>
          No tenés permiso para usar la cámara. Por favor, habilitalo en configuración.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Solicitar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay con instrucciones */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.instructionText}>
            Apuntá la cámara al código QR del ticket
          </Text>
        </View>

        {/* Marco de escaneo */}
        <View style={styles.scanAreaContainer}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </View>

        <View style={styles.bottomOverlay}>
          {scanned && (
            <>
              {loading && (
                <ActivityIndicator size="large" color={colors.background} />
              )}
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={handleScanAgain}
                disabled={loading}
              >
                <Text style={styles.scanAgainButtonText}>
                  {loading ? 'Validando...' : 'Escanear otro'}
                </Text>
              </TouchableOpacity>
            </>
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
    fontSize: 16,
    color: colors.background,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: colors.background,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  scanAgainButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  scanAgainButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
