import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Image, Modal, TextInput, Alert } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import colors from '../../theme/colors';
import { getPublicShowDetails, guestReserveTicket } from '../../api';
import { Ionicons } from '@expo/vector-icons';

export default function GuestShowDetailScreen({ route, navigation }) {
  const { showId, title } = route.params;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Reservation Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getPublicShowDetails(showId);
      setDetails(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActor = (actor) => {
    setSelectedActor(actor);
    setModalVisible(true);
  };

  const handleReserve = async () => {
    if (!guestName || !guestPhone) {
      Alert.alert('Faltan datos', 'Por favor ingresa tu nombre y teléfono para que el vendedor te contacte.');
      return;
    }
    setReserving(true);
    try {
      await guestReserveTicket({
        showId,
        actorId: selectedActor.id,
        nombre: guestName,
        telefono: guestPhone
      });
      setModalVisible(false);
      Alert.alert('¡Reserva Exitosa!', 'Tu entrada ha sido reservada. El vendedor se pondrá en contacto contigo.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo reservar');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 50 }} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.white} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{details.obra}</Text>
      <Text style={styles.subtitle}>
        {new Date(details.fecha).toLocaleDateString()} · {new Date(details.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs
      </Text>
      <Text style={styles.location}>{details.lugar}</Text>

      <Text style={styles.sectionTitle}>Elegí a tu vendedor</Text>
      <Text style={styles.helper}>Seleccioná a quien quieras comprarle la entrada:</Text>

      <FlatList
        data={details.actores}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.actorCard} onPress={() => handleSelectActor(item)}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.actorInfo}>
              <Text style={styles.actorName}>{item.name}</Text>
              <Text style={styles.stockText}>{item.stock} entradas disponibles</Text>
            </View>
            <Ionicons name="ticket-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reservar Entrada</Text>
            <Text style={styles.modalSubtitle}>
              Estás reservando una entrada con {selectedActor?.name}.
            </Text>

            <Text style={styles.label}>Tu Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={colors.textSoft}
              value={guestName}
              onChangeText={setGuestName}
            />

            <Text style={styles.label}>Tu Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 099 123 456"
              placeholderTextColor={colors.textSoft}
              keyboardType="phone-pad"
              value={guestPhone}
              onChangeText={setGuestPhone}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleReserve}
                disabled={reserving}
              >
                {reserving ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text style={styles.saveButtonText}>Confirmar Reserva</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backText: {
    color: colors.white,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.white,
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  helper: {
    color: colors.textMuted,
    marginBottom: 16,
  },
  actorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: colors.surfaceAlt,
  },
  actorInfo: {
    flex: 1,
  },
  actorName: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  stockText: {
    color: colors.success,
    fontSize: 12,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: colors.secondary,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  saveButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
});
