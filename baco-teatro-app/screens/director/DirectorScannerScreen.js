import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { validateTicket } from '../../api';
import TicketStatusPill from '../../components/TicketStatusPill';

export default function DirectorScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleValidate = async (code) => {
    try {
      const validation = await validateTicket(code);
      setResult(validation);
      if (!validation.ok) {
        Alert.alert('Ticket rechazado', validation.message || 'Motivo no especificado');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo validar');
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    handleValidate(data);
  };

  return (
    <ScreenContainer>
      <SectionCard title="Escanear QR" subtitle="Cualquier admin puede validar">
        {hasPermission === null && <Text style={styles.meta}>Solicitando permiso de cámara...</Text>}
        {hasPermission === false && <Text style={styles.meta}>Sin acceso a cámara. Usá el ingreso manual.</Text>}

        {hasPermission && Platform.OS !== 'web' ? (
          <View style={styles.scannerBox}>
            <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={StyleSheet.absoluteFillObject} />
          </View>
        ) : null}

        <Text style={styles.meta}>Ingreso manual</Text>
        <TextInput
          style={styles.input}
          placeholder="Código de ticket"
          placeholderTextColor={colors.textSoft}
          value={manualCode}
          onChangeText={setManualCode}
        />
        <TouchableOpacity style={styles.button} onPress={() => handleValidate(manualCode)}>
          <Text style={styles.buttonText}>Validar</Text>
        </TouchableOpacity>
      </SectionCard>

      {result && (
        <SectionCard title="Resultado">
          <Text style={styles.resultTitle}>{result.ok ? 'Entrada aprobada ✅' : 'Entrada rechazada ❌'}</Text>
          {result.ticket ? (
            <View style={styles.ticketBox}>
              <Text style={styles.ticketTitle}>{result.ticket.obra}</Text>
              <Text style={styles.meta}>{new Date(result.ticket.fecha).toLocaleString()}</Text>
              <TicketStatusPill estado={result.ticket.estado} />
              <Text style={styles.meta}>Actor: {result.ticket.vendedor_nombre || 'Sin asignar'}</Text>
            </View>
          ) : null}
          <Text style={styles.meta}>{result.message}</Text>
        </SectionCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.textMuted,
  },
  scannerBox: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: colors.black,
    fontWeight: '700',
  },
  resultTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  ticketBox: {
    marginTop: 12,
    gap: 4,
  },
  ticketTitle: {
    color: colors.white,
    fontWeight: '700',
  },
});
