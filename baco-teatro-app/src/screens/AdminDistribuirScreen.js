import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';
import { getShows, getVendedores, assignTickets } from '../services/api';

export default function AdminDistribuirScreen() {
  const [shows, setShows] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedShow, setSelectedShow] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [showsData, vendedoresData] = await Promise.all([
        getShows(),
        getVendedores(),
      ]);
      setShows(showsData);
      setVendedores(vendedoresData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDistribuir = async () => {
    if (!selectedShow || !selectedVendedor || !cantidad) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0');
      return;
    }

    setSubmitting(true);
    try {
      await assignTickets(selectedShow, selectedVendedor, cantidadNum);
      
      const vendedor = vendedores.find((v) => v.id === parseInt(selectedVendedor));
      const show = shows.find((s) => s.id === parseInt(selectedShow));
      
      Alert.alert(
        '✅ Tickets Asignados',
        `Se asignaron ${cantidadNum} tickets de "${show.titulo}" a ${vendedor.nombre}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCantidad('');
              cargarDatos();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>📦</Text>
          <Text style={styles.title}>Distribuir Tickets</Text>
          <Text style={styles.subtitle}>
            Asigna tickets disponibles a los vendedores
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Función</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedShow}
                onValueChange={(value) => setSelectedShow(value)}
                style={styles.picker}
              >
                <Picker.Item label="Selecciona una función..." value="" />
                {shows.map((show) => (
                  <Picker.Item
                    key={show.id}
                    label={`${show.titulo} - ${show.fecha}`}
                    value={show.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Vendedor</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedVendedor}
                onValueChange={(value) => setSelectedVendedor(value)}
                style={styles.picker}
              >
                <Picker.Item label="Selecciona un vendedor..." value="" />
                {vendedores.map((vendedor) => (
                  <Picker.Item
                    key={vendedor.id}
                    label={vendedor.nombre}
                    value={vendedor.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Cantidad de tickets</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 10"
              keyboardType="number-pad"
              value={cantidad}
              onChangeText={setCantidad}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!selectedShow || !selectedVendedor || !cantidad || submitting) &&
                styles.buttonDisabled,
            ]}
            onPress={handleDistribuir}
            disabled={!selectedShow || !selectedVendedor || !cantidad || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Asignar Tickets</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            • Los tickets asignados pasan de DISPONIBLE a STOCK_VENDEDOR
          </Text>
          <Text style={styles.infoText}>
            • El vendedor podrá reservarlos para clientes
          </Text>
          <Text style={styles.infoText}>
            • Solo puedes asignar tickets que estén disponibles
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
});
