import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { validateTicket } from '../../api';
import TicketStatusPill from '../../components/TicketStatusPill';

export default function DirectorScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (permission && permission.status === 'undetermined') {
        requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <ScreenContainer>
        <SectionCard title="Permiso de cámara">
          <Text style={styles.meta}>Necesitamos permiso para usar la cámara y escanear entradas.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Dar permiso</Text>
          </TouchableOpacity>
        </SectionCard>
      </ScreenContainer>
    );
  }

  const handleValidate = async (code) => {
    setScanned(true);
    try {
      const validation = await validateTicket(code);
      setResult(validation);
      if (!validation.ok) {
        if (Platform.OS === 'web') {
           alert(`Ticket rechazado: ${validation.message || 'Motivo no especificado'}`);
        } else {
           Alert.alert('Ticket rechazado', validation.message || 'Motivo no especificado');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
         alert(`Error: ${error.message || 'No se pudo validar'}`);
      } else {
         Alert.alert('Error', error.message || 'No se pudo validar');
      }
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    handleValidate(data);
  };

  const resetScanner = () => {
    setScanned(false);
    setResult(null);
    setManualCode('');
  };

  return (
    <ScreenContainer>
      <SectionCard title="Escanear QR" subtitle="Apunta la cámara al código">
        <View style={styles.scannerContainer}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
            {scanned && (
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.scanAgainButton} onPress={resetScanner}>
                        <Text style={styles.scanAgainText}>Escanear otro</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>

        <Text style={styles.label}>O ingresa el código manual:</Text>
        <View style={styles.inputRow}>
            <TextInput
            style={styles.input}
            placeholder="Código..."
            placeholderTextColor={colors.textSoft}
            value={manualCode}
            onChangeText={setManualCode}
            />
            <TouchableOpacity style={styles.validateButton} onPress={() => handleValidate(manualCode)}>
            <Text style={styles.validateButtonText}>Validar</Text>
            </TouchableOpacity>
        </View>
      </SectionCard>

      {result && (
        <SectionCard title="Resultado de validación">
          <View style={[styles.resultBox, result.ok ? styles.successBox : styles.errorBox]}>
              <Text style={styles.resultEmoji}>{result.ok ? '✅' : '❌'}</Text>
              <Text style={styles.resultTitle}>{result.ok ? 'APROBADA' : 'RECHAZADA'}</Text>
          </View>
          
          {result.ticket ? (
            <View style={styles.ticketDetails}>
              <Text style={styles.ticketObra}>{result.ticket.obra}</Text>
              <Text style={styles.ticketDate}>{new Date(result.ticket.fecha).toLocaleString()}</Text>
              <View style={styles.pillContainer}>
                  <TicketStatusPill estado={result.ticket.estado} />
              </View>
              <Text style={styles.ticketActor}>Vendedor: {result.ticket.vendedor_nombre || 'Sin asignar'}</Text>
            </View>
          ) : null}
          <Text style={styles.resultMessage}>{result.message}</Text>
        </SectionCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.textMuted,
    marginBottom: 10,
  },
  scannerContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  scanAgainText: {
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  validateButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  successBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  errorBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  resultEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  resultTitle: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 1,
  },
  ticketDetails: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  ticketObra: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  ticketDate: {
    color: colors.text,
    fontSize: 14,
  },
  pillContainer: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  ticketActor: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  resultMessage: {
    color: colors.textSoft,
    marginTop: 10,
    textAlign: 'center',
  },
});
