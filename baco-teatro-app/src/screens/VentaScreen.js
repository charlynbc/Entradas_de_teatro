import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { getTicket, sellTicket, getVendedores } from '../services/api';

export default function VentaScreen() {
  const [ticketCode, setTicketCode] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  
  // Datos de la venta
  const [vendedorId, setVendedorId] = useState('');
  const [compradorNombre, setCompradorNombre] = useState('');
  const [compradorContacto, setCompradorContacto] = useState('');
  const [medioPago, setMedioPago] = useState('EFECTIVO');
  const [monto, setMonto] = useState('');

  const mediosPago = ['EFECTIVO', 'TRANSFERENCIA', 'PREX', 'OTRO'];

  React.useEffect(() => {
    loadVendedores();
  }, []);

  const loadVendedores = async () => {
    try {
      const data = await getVendedores();
      setVendedores(data.filter(v => v.activo));
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  };

  const buscarTicket = async () => {
    if (!ticketCode.trim()) {
      Alert.alert('Error', 'Ingresá un código de ticket');
      return;
    }

    setLoading(true);
    try {
      const data = await getTicket(ticketCode.trim());
      
      if (data.estado === 'USADO') {
        Alert.alert('Ticket ya usado', 'Este ticket ya fue utilizado');
        return;
      }
      
      if (data.estado === 'PAGADO') {
        Alert.alert('Ticket ya vendido', 'Este ticket ya está marcado como pagado');
        return;
      }

      setTicket(data);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se encontró el ticket');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const registrarVenta = async () => {
    if (!ticket) return;

    if (!vendedorId) {
      Alert.alert('Error', 'Seleccioná un vendedor');
      return;
    }

    if (!compradorNombre.trim()) {
      Alert.alert('Error', 'Ingresá el nombre del comprador');
      return;
    }

    if (!monto || parseFloat(monto) <= 0) {
      Alert.alert('Error', 'Ingresá un monto válido');
      return;
    }

    setLoading(true);
    try {
      await sellTicket(ticket.code, {
        vendedorId: parseInt(vendedorId),
        compradorNombre: compradorNombre.trim(),
        compradorContacto: compradorContacto.trim() || null,
        medioPago,
        monto: parseFloat(monto),
      });

      Alert.alert(
        '✅ Venta registrada',
        `Ticket ${ticket.code} vendido exitosamente`,
        [{ text: 'OK', onPress: limpiarFormulario }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setTicketCode('');
    setTicket(null);
    setVendedorId('');
    setCompradorNombre('');
    setCompradorContacto('');
    setMedioPago('EFECTIVO');
    setMonto('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Registrar Venta</Text>
          <Text style={styles.subtitle}>
            Busca el ticket y completa los datos de la venta
          </Text>

          {/* Buscar ticket */}
          <View style={styles.section}>
            <Text style={styles.label}>Código del ticket</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.input, styles.searchInput]}
                placeholder="T-ABC12345"
                placeholderTextColor={colors.placeholder}
                value={ticketCode}
                onChangeText={setTicketCode}
                autoCapitalize="characters"
                editable={!loading && !ticket}
              />
              <TouchableOpacity
                style={[styles.searchButton, ticket && styles.buttonDisabled]}
                onPress={buscarTicket}
                disabled={loading || ticket}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Info del ticket encontrado */}
          {ticket && (
            <>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketInfoTitle}>✅ Ticket encontrado</Text>
                <Text style={styles.ticketInfoText}>Código: {ticket.code}</Text>
                <Text style={styles.ticketInfoText}>Función ID: {ticket.showId}</Text>
                <Text style={styles.ticketInfoText}>Estado: {ticket.estado}</Text>
              </View>

              {/* Formulario de venta */}
              <View style={styles.section}>
                <Text style={styles.label}>Vendedor *</Text>
                <View style={styles.pickerContainer}>
                  {vendedores.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.pickerOption,
                        vendedorId === v.id.toString() && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setVendedorId(v.id.toString())}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          vendedorId === v.id.toString() && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {v.nombre} {v.alias && `(${v.alias})`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Nombre del comprador *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan Pérez"
                  placeholderTextColor={colors.placeholder}
                  value={compradorNombre}
                  onChangeText={setCompradorNombre}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Contacto (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono o email"
                  placeholderTextColor={colors.placeholder}
                  value={compradorContacto}
                  onChangeText={setCompradorContacto}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Medio de pago *</Text>
                <View style={styles.pickerContainer}>
                  {mediosPago.map((medio) => (
                    <TouchableOpacity
                      key={medio}
                      style={[
                        styles.pickerOption,
                        medioPago === medio && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setMedioPago(medio)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          medioPago === medio && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {medio}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Monto ($) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="400"
                  placeholderTextColor={colors.placeholder}
                  value={monto}
                  onChangeText={setMonto}
                  keyboardType="numeric"
                />
              </View>

              {/* Botones */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={limpiarFormulario}
                  disabled={loading}
                >
                  <Text style={styles.buttonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                  onPress={registrarVenta}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={styles.buttonPrimaryText}>Registrar Venta</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  ticketInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  ticketInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  ticketInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAFA',
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  pickerOptionTextSelected: {
    color: colors.background,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
