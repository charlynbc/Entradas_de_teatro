import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import TransferTimeline from '../../components/TransferTimeline';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import colors from '../../theme/colors';
import { transferTicket, getActorTransfers } from '../../api';

const initialForm = { ticketCode: '', destino: '', motivo: '' };

export default function ActorTransferScreen() {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getActorTransfers();
      setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleTransfer = async () => {
    if (!form.ticketCode || !form.destino) {
      showError('Ingresá código y cédula destino');
      return;
    }
    setLoading(true);
    try {
      await transferTicket(form);
      setForm(initialForm);
      loadHistory();
      showSuccess('⚡ Transferencia registrada con éxito');
    } catch (error) {
      showError(error.message || 'No se pudo transferir el ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <SectionCard title="Pasar entradas" subtitle="También podés transferir sin recibir nada">
        {['ticketCode', 'destino', 'motivo'].map((field) => (
          <TextInput
            key={field}
            style={[styles.input, field === 'motivo' && styles.multiline]}
            placeholder={field === 'ticketCode' ? 'Código de ticket' : field === 'destino' ? 'Cédula actor destino' : 'Motivo (opcional)'}
            placeholderTextColor={colors.textSoft}
            value={form[field]}
            onChangeText={(value) => setForm((prev) => ({ ...prev, [field]: value }))}
            multiline={field === 'motivo'}
          />
        ))}
        <TouchableOpacity style={styles.button} onPress={handleTransfer} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.black} /> : <Text style={styles.buttonText}>Registrar transferencia</Text>}
        </TouchableOpacity>
      </SectionCard>

      <SectionCard title="Historial" subtitle="Últimos movimientos">
        {historyLoading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          <TransferTimeline events={history} />
        )}
      </SectionCard>
      
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type}
        onHide={hideToast}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.black,
    fontWeight: '700',
  },
});
