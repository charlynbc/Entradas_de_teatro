import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import colors from '../theme/colors';
import { getTicketsVendedor, registrarVenta, entregarPlata } from '../api/api';

export default function VendedorHome({ user, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [compradorNombre, setCompradorNombre] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getTicketsVendedor(user.id);
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVenderPress = (ticket) => {
    setSelectedTicket(ticket);
    setModalVisible(true);
  };

  const confirmarVenta = async () => {
    if (!compradorNombre) {
      Alert.alert('Error', 'Ingresa el nombre del comprador');
      return;
    }
    
    const res = await registrarVenta(selectedTicket.id, compradorNombre);
    if (res.success) {
      Alert.alert('Éxito', 'Venta registrada');
      setModalVisible(false);
      setCompradorNombre('');
      loadTickets();
    } else {
      Alert.alert('Error', res.error);
    }
  };

  const handleEntregarPlata = async (ticket) => {
    Alert.alert(
      'Confirmar Entrega',
      '¿Confirmas que entregaste el dinero al administrador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, Entregué', 
          onPress: async () => {
            const res = await entregarPlata(ticket.id);
            if (res.success) {
              loadTickets();
            } else {
              Alert.alert('Error', res.error);
            }
          }
        }
      ]
    );
  };

  const renderTicket = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.showTitle}>{item.showNombre}</Text>
        <Text style={[styles.badge, getBadgeStyle(item.estado)]}>
          {formatEstado(item.estado)}
        </Text>
      </View>
      
      <Text style={styles.detail}>📅 {item.showFecha}</Text>
      <Text style={styles.detail}>💰 ${item.precio}</Text>
      <Text style={styles.detail}>🎟️ {item.id}</Text>
      
      {item.comprador && (
        <Text style={styles.comprador}>👤 {item.comprador}</Text>
      )}

      <View style={styles.actions}>
        {item.estado === 'EN_PODER' && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleVenderPress(item)}
          >
            <Text style={styles.buttonText}>Vender</Text>
          </TouchableOpacity>
        )}

        {item.estado === 'VENDIDA_NO_PAGADA' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.payButton]} 
            onPress={() => handleEntregarPlata(item)}
          >
            <Text style={styles.buttonText}>Entregar Plata</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hola, {user.nombre}</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTickets} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tienes tickets asignados</Text>
        }
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Venta</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTicket?.showNombre} - ${selectedTicket?.precio}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre del Comprador"
              value={compradorNombre}
              onChangeText={setCompradorNombre}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmarVenta}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const formatEstado = (estado) => {
  const map = {
    'EN_PODER': 'Disponible',
    'VENDIDA_NO_PAGADA': 'Vendida (Debe)',
    'VENDIDA_PAGADA': 'Pagada',
    'USADA': 'Usada'
  };
  return map[estado] || estado;
};

const getBadgeStyle = (estado) => {
  switch (estado) {
    case 'EN_PODER': return { backgroundColor: '#3498db', color: 'white' };
    case 'VENDIDA_NO_PAGADA': return { backgroundColor: '#f39c12', color: 'white' };
    case 'VENDIDA_PAGADA': return { backgroundColor: '#27ae60', color: 'white' };
    case 'USADA': return { backgroundColor: '#95a5a6', color: 'white' };
    default: return {};
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: colors.primary, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  logoutText: { color: 'white', fontSize: 16 },
  list: { padding: 15 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  showTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  badge: { padding: 5, borderRadius: 4, fontSize: 12, overflow: 'hidden', alignSelf: 'flex-start' },
  detail: { fontSize: 14, color: '#666', marginBottom: 4 },
  comprador: { fontSize: 16, fontWeight: 'bold', marginTop: 5, color: '#333' },
  actions: { flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end' },
  actionButton: { backgroundColor: colors.primary, padding: 10, borderRadius: 6, marginLeft: 10 },
  payButton: { backgroundColor: '#27ae60' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#eee', marginRight: 10 },
  confirmButton: { backgroundColor: colors.primary, marginLeft: 10 },
  cancelText: { color: '#333', fontWeight: 'bold' }
});
    });

    return counts;
  };

  const counts = getEstadoCounts();
  const filteredTickets = getTicketsByEstado();

  // Si no hay navigation, mostrar pantalla simple para web
  if (!navigation) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎭 Baco Teatro</Text>
          <Text style={styles.headerSubtitle}>Panel de Vendedor</Text>
        </View>

        <View style={styles.userCard}>
          <Text style={styles.cardTitle}>✅ Login Exitoso</Text>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{userName}</Text>
          <Text style={styles.label}>Rol:</Text>
          <Text style={styles.value}>Vendedor</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funcionalidades disponibles:</Text>
          
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>🎫</Text>
            <Text style={styles.menuText}>Ver mis tickets asignados</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>📝</Text>
            <Text style={styles.menuText}>Reservar tickets para clientes</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>Reportar ventas realizadas</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>📱</Text>
            <Text style={styles.menuText}>Mostrar códigos QR de tickets</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          ✅ Sistema funcionando correctamente{'\n'}
          Backend conectado{'\n'}
          Próximo paso: Implementar navegación completa para móvil
        </Text>
      </ScrollView>
    );
  }

  const renderTicket = ({ item }) => (
    <TicketCard
      ticket={item}
      onPress={() => {
        if (item.estado === 'STOCK_VENDEDOR') {
          navigation.navigate('Reservar', { ticket: item });
        } else if (item.estado === 'RESERVADO') {
          navigation.navigate('ReportarVenta', { ticket: item });
        } else if (['REPORTADA_VENDIDA', 'PAGADO'].includes(item.estado)) {
          navigation.navigate('TicketQR', { ticket: item });
        }
      }}
      userRole="VENDEDOR"
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.role}>Vendedor</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de función */}
      <View style={styles.showPickerContainer}>
        <Picker
          selectedValue={selectedShow}
          onValueChange={setSelectedShow}
          style={styles.showPicker}
        >
          <Picker.Item label="📋 Todas las funciones" value="all" />
          {shows.map((show) => (
            <Picker.Item
              key={show.id}
              label={`${show.obra} - ${new Date(show.fecha).toLocaleDateString('es-AR')}`}
              value={show.id.toString()}
            />
          ))}
        </Picker>
      </View>

      {/* Tabs de estado */}
      <View style={styles.tabs}>
        {estados.map((estado) => (
          <TouchableOpacity
            key={estado.key}
            style={[
              styles.tab,
              selectedEstado === estado.key && styles.tabActive,
            ]}
            onPress={() => setSelectedEstado(estado.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedEstado === estado.key && styles.tabTextActive,
              ]}
            >
              {estado.label}
            </Text>
            <Text
              style={[
                styles.tabCount,
                selectedEstado === estado.key && styles.tabCountActive,
              ]}
            >
              {counts[estado.key] || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de tickets */}
      <FlatList
        data={filteredTickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.code}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTickets} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedEstado === 'all'
                ? 'No tienes tickets asignados'
                : `No hay tickets en estado "${estados.find((e) => e.key === selectedEstado)?.label}"`}
            </Text>
          </View>
        }
        contentContainerStyle={
          filteredTickets.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  role: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.white,
    fontWeight: '600',
  },
  showPickerContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  showPicker: {
    height: 50,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray,
    marginTop: 4,
  },
  tabCountActive: {
    color: colors.primary,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos para pantalla simple sin navigation
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  userCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 12,
    padding: 24,
    lineHeight: 18,
  },
});
