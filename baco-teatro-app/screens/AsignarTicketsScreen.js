import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import colors from '../theme/colors';
import { getShows, listarVendedores, assignTickets } from '../api/api';

export default function AsignarTicketsScreen({ route, navigation }) {
  const [shows, setShows] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    if (route.params?.show) {
      setSelectedShow(route.params.show);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [showsData, vendedoresData] = await Promise.all([
        getShows(),
        listarVendedores(),
      ]);
      setShows(showsData);
      setVendedores(vendedoresData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedShow || !selectedVendedor || !cantidad) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const cantidadNum = parseInt(cantidad);
    if (cantidadNum <= 0 || cantidadNum > 100) {
      Alert.alert('Error', 'La cantidad debe estar entre 1 y 100');
      return;
    }

    setLoading(true);
    try {
      const data = await assignTickets(
        selectedShow.id,
        selectedVendedor,
        cantidadNum
      );

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert(
        'Tickets asignados',
        `Se asignaron ${cantidadNum} tickets a ${
          vendedores.find((v) => v.phone === selectedVendedor)?.name
        }`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCantidad('');
              loadData();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error asignando tickets:', error);
      Alert.alert('Error', 'No se pudieron asignar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const renderShowItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.showCard,
        selectedShow?.id === item.id && styles.showCardSelected,
      ]}
      onPress={() => setSelectedShow(item)}
    >
      <Text style={styles.showObra}>{item.obra}</Text>
      <Text style={styles.showFecha}>
        {new Date(item.fecha).toLocaleString('es-AR')}
      </Text>
      <Text style={styles.showInfo}>
        Capacidad: {item.capacidad} | Precio: ${item.base_price}
      </Text>
    </TouchableOpacity>
  );

  if (loading && shows.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asignar Tickets a Vendedor</Text>

      {!selectedShow && (
        <View style={styles.section}>
          <Text style={styles.label}>1. Selecciona una función</Text>
          <FlatList
            data={shows}
            renderItem={renderShowItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.showsList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No hay funciones disponibles
              </Text>
            }
          />
        </View>
      )}

      {selectedShow && (
        <>
          <View style={styles.selectedShowContainer}>
            <Text style={styles.selectedShowLabel}>Función seleccionada:</Text>
            <View style={styles.selectedShowCard}>
              <Text style={styles.selectedShowObra}>{selectedShow.obra}</Text>
              <Text style={styles.selectedShowFecha}>
                {new Date(selectedShow.fecha).toLocaleString('es-AR')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setSelectedShow(null)}
            >
              <Text style={styles.changeButtonText}>Cambiar función</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>2. Selecciona un vendedor</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedVendedor}
                onValueChange={setSelectedVendedor}
                style={styles.picker}
              >
                <Picker.Item label="-- Seleccionar vendedor --" value="" />
                {vendedores.map((v) => (
                  <Picker.Item
                    key={v.phone}
                    label={`${v.name} (${v.phone})`}
                    value={v.phone}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>3. Cantidad de tickets</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={colors.gray}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[styles.assignButton, loading && styles.buttonDisabled]}
              onPress={handleAsignar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.assignButtonText}>
                  Asignar {cantidad || 'N'} Tickets
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.gray,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  section: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  showsList: {
    flex: 1,
  },
  showCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },
  showCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3E0',
  },
  showObra: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  showFecha: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  showInfo: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  selectedShowContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  selectedShowLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 8,
  },
  selectedShowCard: {
    marginBottom: 12,
  },
  selectedShowObra: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedShowFecha: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  changeButton: {
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  assignButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  assignButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 16,
    marginTop: 24,
  },
});
