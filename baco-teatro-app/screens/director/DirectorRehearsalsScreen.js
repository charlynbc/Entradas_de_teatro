import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { listRehearsals, createRehearsal, deleteRehearsal, listDirectorShows } from '../../api';

export default function DirectorRehearsalsScreen({ navigation }) {
  const [rehearsals, setRehearsals] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [form, setForm] = useState({
    title: '',
    date: new Date(),
    location: '',
    notes: '',
    showId: null,
  });

  // Date picker state (simplified for now, using text input or simple logic)
  // Ideally use a library or the same logic as DirectorShowsScreen

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rehearsalsData, showsData] = await Promise.all([
        listRehearsals(),
        listDirectorShows()
      ]);
      setRehearsals(rehearsalsData);
      setShows(showsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.location) {
      Alert.alert('Error', 'Titulo y lugar son obligatorios');
      return;
    }
    setCreating(true);
    try {
      await createRehearsal({
        ...form,
        fecha: form.date.toISOString(), // Map date to fecha as per mock
        lugar: form.location, // Map location to lugar
      });
      setModalVisible(false);
      setForm({ title: '', date: new Date(), location: '', notes: '', showId: null });
      loadData();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirmar', '¿Borrar ensayo?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Borrar', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await deleteRehearsal(id);
            loadData();
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const show = shows.find(s => s.id === item.showId);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title || 'Ensayo'}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.date || item.fecha).toLocaleString()}
        </Text>
        <Text style={styles.cardLocation}>{item.location || item.lugar}</Text>
        {show && <Text style={styles.cardShow}>Obra: {show.obra}</Text>}
        {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Ensayos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={colors.black} />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} />
      ) : (
        <FlatList
          data={rehearsals}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay ensayos programados</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Ensayo</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Titulo (ej. Lectura)"
              value={form.title}
              onChangeText={t => setForm(prev => ({ ...prev, title: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Lugar (ej. Sala 1)"
              value={form.location}
              onChangeText={t => setForm(prev => ({ ...prev, location: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Notas"
              value={form.notes}
              onChangeText={t => setForm(prev => ({ ...prev, notes: t }))}
            />
            
            <Text style={styles.label}>Fecha y Hora</Text>
            <View style={styles.dateRow}>
              {Platform.OS === 'web' ? (
                <input
                  type="datetime-local"
                  value={form.date.toISOString().slice(0, 16)}
                  onChange={(e) => setForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    width: '100%',
                    marginBottom: 12,
                    fontFamily: 'system-ui'
                  }}
                />
              ) : (
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{form.date.toLocaleString()}</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={form.date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(form.date.getHours());
                    newDate.setMinutes(form.date.getMinutes());
                    setForm(prev => ({ ...prev, date: newDate }));
                    // Optionally show time picker next
                    setTimeout(() => setShowTimePicker(true), 100);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={form.date}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) {
                    const newDate = new Date(form.date);
                    newDate.setHours(selectedDate.getHours());
                    newDate.setMinutes(selectedDate.getMinutes());
                    setForm(prev => ({ ...prev, date: newDate }));
                  }
                }}
              />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveButtonText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardDate: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardShow: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  cardNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textSoft,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: colors.error,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
});
