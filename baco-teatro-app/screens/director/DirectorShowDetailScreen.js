import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, TextInput, Alert, Share, FlatList, ActivityIndicator } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { listVendors, assignTicketsToActor, markTicketsAsPaid, listDirectorShows, generarReporteObra } from '../../api'; // We might need a specific getShowDetails
import { Ionicons } from '@expo/vector-icons';

export default function DirectorShowDetailScreen({ route, navigation }) {
  const { show } = route.params;
  const [currentShow, setCurrentShow] = useState(show);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal Assign
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [amount, setAmount] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [collecting, setCollecting] = useState(false);

  // Modal Add Actor
  const [addActorModalVisible, setAddActorModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allVendors, allShows] = await Promise.all([
        listVendors(),
        listDirectorShows()
      ]);
      setVendors(allVendors);
      
      // Refresh current show data
      const updatedShow = allShows.find(s => s.id === currentShow.id);
      if (updatedShow) {
        setCurrentShow(updatedShow);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      // Simulated link
      const link = `https://baco-teatro.app/invitacion/${currentShow.id}`;
      await Share.share({
        message: `¡Te invito a ver ${currentShow.obra}!\nFecha: ${new Date(currentShow.fecha).toLocaleString()}\nReserva tu entrada aquí: ${link}`,
      });
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const openAssignModal = (actor) => {
    setSelectedActor(actor);
    setAmount('');
    setModalVisible(true);
  };

  const handleAssign = async () => {
    if (!amount || isNaN(amount)) return;
    setAssigning(true);
    try {
      await assignTicketsToActor({
        showId: currentShow.id,
        actorId: selectedActor.cedula || selectedActor.id, // Handle different ID fields if any
        cantidad: Number(amount)
      });
      Alert.alert('Éxito', `Se asignaron ${amount} entradas a ${selectedActor.name}`);
      setModalVisible(false);
      loadData(); // Reload data instead of going back
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setAssigning(false);
    }
  };

  // Filter actors already in the show
  // Note: currentShow.insights.actores contains the actors with stats
  const assignedActorIds = currentShow.insights?.actores?.map(a => a.id) || [];
  const availableVendors = vendors.filter(v => !assignedActorIds.includes(v.cedula));

  const handleAddActor = (actor) => {
    // To "add" an actor we just assign 0 tickets or use a specific endpoint
    // For now, let's assume assigning tickets adds them.
    // Or we can just open the assign modal directly for them.
    openAssignModal(actor);
    setAddActorModalVisible(false);
  };

  const handleCollect = async (actor) => {
    Alert.alert(
      'Confirmar Cobro',
      `¿Marcar como PAGADAS todas las entradas vendidas por ${actor.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setCollecting(true);
            try {
              const count = await markTicketsAsPaid({
                showId: currentShow.id,
                actorId: actor.id
              });
              Alert.alert('Éxito', `Se cobraron ${count} entradas`);
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setCollecting(false);
            }
          }
        }
      ]
    );
  };

  const handleGenerarReporte = () => {
    Alert.alert(
      'Generar Reporte',
      `¿Generar reporte final de "${currentShow.obra}"? Esto incluirá todas las estadísticas de ventas y vendedores.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            try {
              setLoading(true);
              await generarReporteObra(currentShow.id);
              Alert.alert(
                'Reporte Generado',
                'El reporte se ha generado correctamente. Puedes verlo en la sección "Reportes de Obras".',
                [
                  { text: 'Ver Reportes', onPress: () => navigation.navigate('DirectorReportsObras') },
                  { text: 'Cerrar', style: 'cancel' }
                ]
              );
            } catch (error) {
              Alert.alert('Error', error.message || 'No se pudo generar el reporte');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderActorStat = (actor) => {
    if (!actor) return null;
    return (
      <View key={actor.id} style={styles.actorCard}>
        <View style={styles.actorHeader}>
          <View style={styles.actorInfo}>
            <Text style={styles.actorName}>{actor.name || 'Actor'}</Text>
            <Text style={styles.actorId}>ID: {actor.id}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {actor.vendidas > 0 && (
              <TouchableOpacity 
                style={[styles.assignButton, { backgroundColor: colors.success }]} 
                onPress={() => handleCollect(actor)}
                disabled={collecting}
              >
                <Ionicons name="cash-outline" size={20} color={colors.black} />
                <Text style={styles.assignButtonText}>Cobrar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.assignButton} onPress={() => openAssignModal(actor)}>
              <Ionicons name="ticket-outline" size={20} color={colors.black} />
              <Text style={styles.assignButtonText}>Dar Entradas</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Stock</Text>
            <Text style={styles.statValue}>{actor.stock || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Vendidas</Text>
            <Text style={styles.statValue}>{actor.vendidas || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pagadas</Text>
            <Text style={styles.statValue}>{actor.pagadas || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>$$$</Text>
            <Text style={styles.statValue}>${actor.entregado || 0}</Text>
          </View>
        </View>
        
        {actor.deuda > 0 && (
          <Text style={styles.debtWarning}>Debe rendir: ${actor.deuda}</Text>
        )}
      </View>
    );
  };

  if (!currentShow) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.secondary} size="large" style={{ marginTop: 50 }} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Función</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <SectionCard title={currentShow.obra}>
        <Text style={styles.showId}>ID: {currentShow.id}</Text>
        <Text style={styles.showMeta}>
          {new Date(currentShow.fecha).toLocaleDateString()} {new Date(currentShow.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs
        </Text>
        <Text style={styles.showMeta}>{currentShow.lugar}</Text>
        <View style={styles.capacityBadge}>
          <Text style={styles.capacityText}>Capacidad: {currentShow.capacidad}</Text>
        </View>
      </SectionCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Elenco y Ventas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddActorModalVisible(true)}>
          <Ionicons name="person-add" size={18} color={colors.black} />
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {currentShow.insights?.actores?.map(renderActorStat)}
      
      {(!currentShow.insights?.actores || currentShow.insights.actores.length === 0) && (
        <Text style={styles.emptyText}>Aún no hay actores asignados a esta función.</Text>
      )}

      <TouchableOpacity 
        style={styles.reporteButton}
        onPress={handleGenerarReporte}
        disabled={loading}
      >
        <Ionicons name="document-text" size={20} color={colors.secondary} />
        <Text style={styles.reporteButtonText}>Generar Reporte Final</Text>
      </TouchableOpacity>

      {/* Modal Assign Tickets */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asignar Entradas</Text>
            <Text style={styles.modalSubtitle}>Para: {selectedActor?.name}</Text>
            
            <Text style={styles.label}>Cantidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 10"
              placeholderTextColor={colors.textSoft}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleAssign} disabled={assigning}>
                {assigning ? <ActivityIndicator color={colors.black} /> : <Text style={styles.confirmText}>Asignar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Add Actor */}
      <Modal
        transparent={true}
        visible={addActorModalVisible}
        onRequestClose={() => setAddActorModalVisible(false)}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Actor</Text>
            <FlatList
              data={availableVendors}
              keyExtractor={item => item.cedula}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.vendorItem} onPress={() => handleAddActor(item)}>
                  <Text style={styles.vendorName}>{item.name}</Text>
                  <Ionicons name="add-circle-outline" size={24} color={colors.secondary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay más vendedores disponibles.</Text>}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAddActorModalVisible(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  showId: {
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  showMeta: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: 2,
  },
  capacityBadge: {
    backgroundColor: colors.surfaceAlt,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  capacityText: {
    color: colors.white,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 12,
  },
  actorCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actorName: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  actorId: {
    color: colors.textMuted,
    fontSize: 12,
  },
  assignButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  assignButtonText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    padding: 8,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  statValue: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  debtWarning: {
    color: colors.error,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
  // Modals
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    color: colors.secondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  confirmBtn: {
    backgroundColor: colors.secondary,
  },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  confirmText: { color: colors.black, fontWeight: 'bold' },
  vendorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  vendorName: {
    color: colors.white,
    fontSize: 16,
  },
  closeBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeText: {
    color: colors.textMuted,
  },
  reporteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.secondary + '60',
    gap: 10,
  },
  reporteButtonText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 16,
  },
});
