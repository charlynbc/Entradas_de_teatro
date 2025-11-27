import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../theme/colors';
import { createShow } from '../api/api';

export default function CrearShowScreen({ navigation }) {
  const [obra, setObra] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [capacidad, setCapacidad] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCrear = async () => {
    if (!obra || !capacidad || !basePrice) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const capacidadNum = parseInt(capacidad);
    const priceNum = parseFloat(basePrice);

    if (capacidadNum <= 0 || capacidadNum > 500) {
      Alert.alert('Error', 'La capacidad debe estar entre 1 y 500');
      return;
    }

    if (priceNum <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const data = await createShow({
        obra,
        fecha: fecha.toISOString(),
        capacidad: capacidadNum,
        base_price: priceNum,
      });

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert(
        'Función creada',
        `Se creó la función "${obra}" con ${capacidadNum} tickets.\nLos tickets fueron generados automáticamente.`,
        [
          {
            text: 'Ver funciones',
            onPress: () => navigation.navigate('AdminHome'),
          },
          {
            text: 'Asignar tickets',
            onPress: () =>
              navigation.replace('AsignarTickets', { show: data }),
          },
        ]
      );
    } catch (error) {
      console.error('Error creando show:', error);
      Alert.alert('Error', 'No se pudo crear la función');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFecha(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Crear Función</Text>
        <Text style={styles.subtitle}>
          Los tickets se generarán automáticamente con códigos QR
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre de la obra *</Text>
          <TextInput
            style={styles.input}
            placeholder="Esperando a Godot"
            placeholderTextColor={colors.gray}
            value={obra}
            onChangeText={setObra}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Fecha y hora *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              📅 {fecha.toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={fecha}
              mode="datetime"
              is24Hour={true}
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <Text style={styles.label}>Capacidad *</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            placeholderTextColor={colors.gray}
            value={capacidad}
            onChangeText={setCapacidad}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Precio base *</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="5000"
              placeholderTextColor={colors.gray}
              value={basePrice}
              onChangeText={setBasePrice}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCrear}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createButtonText}>
                Crear Función y Generar Tickets
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🎭 ¿Qué sucederá?</Text>
          <Text style={styles.infoText}>
            1. Se crea la función con los datos ingresados{'\n'}
            2. Se generan automáticamente {capacidad || 'N'} tickets{'\n'}
            3. Cada ticket tiene un código único y QR{'\n'}
            4. Los tickets quedan en estado DISPONIBLE{'\n'}
            5. Luego debes asignarlos a vendedores
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
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  dateButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
});
