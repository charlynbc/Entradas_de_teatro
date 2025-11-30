import React, { useEffect, useState } from 'react';
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
import colors from '../theme/colors';
import {
  crearShow,
  getShows,
  getVendedores,
  asignarTickets,
  getReporteGeneral,
  validarTicket,
} from '../api/api';

function TabButton({ active, label, emoji, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {emoji} {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function AdminHome({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('shows');
  const [shows, setShows] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ obra: '', fecha: '', capacidad: '', precio: '' });
  const [assignForm, setAssignForm] = useState({ showId: '', vendedorId: '', cantidad: '' });
  const [scannerCode, setScannerCode] = useState('');
  const [scannerResult, setScannerResult] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [showsData, sellersData, reportData] = await Promise.all([
        getShows(),
        getVendedores(),
        getReporteGeneral(),
      ]);
      setShows(showsData);
      setVendedores(sellersData);
      setReportes(reportData);
    } catch (error) {
      console.error('Error cargando datos admin:', error);
      Alert.alert('Error', 'No se pudo cargar los datos del panel');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShow = async () => {
    if (!form.obra || !form.capacidad) {
      Alert.alert('Error', 'Completa nombre y capacidad');
      return;
    }
    try {
      const response = await crearShow({
        nombre: form.obra,
        fecha: form.fecha,
        cantidadTickets: parseInt(form.capacidad) || 0,
        precio: parseFloat(form.precio) || 0,
      });
      if (response.success) {
        Alert.alert('Éxito', 'Función creada y tickets generados');
        setForm({ obra: '', fecha: '', capacidad: '', precio: '' });
        loadAll();
      } else if (response.error) {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Error creando función:', error);
      Alert.alert('Error', 'No se pudo crear la función');
    }
  };

  const handleAssignTickets = async () => {
    if (!assignForm.showId || !assignForm.vendedorId || !assignForm.cantidad) {
      Alert.alert('Error', 'Completa los campos de asignación');
      return;
    }
    try {
      const response = await asignarTickets(assignForm.showId, assignForm.vendedorId, parseInt(assignForm.cantidad));
      if (response.success) {
        Alert.alert('Éxito', `${response.asignados} tickets asignados`);
        setAssignForm({ showId: '', vendedorId: '', cantidad: '' });
        loadAll();
      } else if (response.error) {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Error asignando tickets:', error);
      Alert.alert('Error', 'No se pudo asignar tickets');
    }
  };

  const handleValidateTicket = async () => {
    if (!scannerCode) {
      Alert.alert('Error', 'Ingresa un código QR o usa el simulador');
      return;
    }
    try {
      const result = await validarTicket(scannerCode);
      setScannerResult(result);
    } catch (error) {
      console.error('Error validando ticket:', error);
      Alert.alert('Error', 'No se pudo validar el ticket');
    }
  };

  const renderShowsTab = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Crear función + generar entradas</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de la obra"
        value={form.obra}
        onChangeText={(value) => setForm({ ...form, obra: value })}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha (YYYY-MM-DD HH:mm)"
        value={form.fecha}
        onChangeText={(value) => setForm({ ...form, fecha: value })}
      />
      <TextInput
        style={styles.input}
        placeholder="Cantidad de tickets"
        value={form.capacidad}
        onChangeText={(value) => setForm({ ...form, capacidad: value })}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Precio base"
        value={form.precio}
        onChangeText={(value) => setForm({ ...form, precio: value })}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleCreateShow}>
        <Text style={styles.primaryButtonText}>Generar entradas</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAssignTab = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Asignar entradas a vendedor</Text>
      <TextInput
        style={styles.input}
        placeholder="ID de función"
        value={assignForm.showId}
        onChangeText={(value) => setAssignForm({ ...assignForm, showId: value })}
      />
      <TextInput
        style={styles.input}
        placeholder="Cédula del vendedor"
        value={assignForm.vendedorId}
        onChangeText={(value) => setAssignForm({ ...assignForm, vendedorId: value })}
      />
      <TextInput
        style={styles.input}
        placeholder="Cantidad"
        value={assignForm.cantidad}
        onChangeText={(value) => setAssignForm({ ...assignForm, cantidad: value })}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleAssignTickets}>
        <Text style={styles.primaryButtonText}>Asignar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScannerTab = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Escaneo / validación</Text>
      <TextInput
        style={styles.input}
        placeholder="Código QR"
        value={scannerCode}
        onChangeText={setScannerCode}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleValidateTicket}>
        <Text style={styles.primaryButtonText}>Validar entrada</Text>
      </TouchableOpacity>
      {scannerResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{scannerResult.success ? '✅ Ticket válido' : '❌ Error'}</Text>
          <Text>{scannerResult.message || scannerResult.error}</Text>
        </View>
      )}
    </View>
  );

  const renderReportTab = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Reporte de ventas por vendedor</Text>
      {reportes.length === 0 ? (
        <Text>No hay datos aún</Text>
      ) : (
        reportes.map((item) => (
          <View key={item.vendedorId} style={styles.reportRow}>
            <Text style={styles.reportName}>{item.vendedorNombre}</Text>
            <Text>{item.cantidadVendida} tickets</Text>
            <Text>${item.montoTotal}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panel Admin</Text>
          <Text style={styles.headerSubtitle}>Supremo / Admin</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.primary} size="large" />}

      <View style={styles.tabBar}>
        <TabButton active={activeTab === 'shows'} emoji="🎭" label="Funciones" onPress={() => setActiveTab('shows')} />
        <TabButton active={activeTab === 'assign'} emoji="📦" label="Asignar" onPress={() => setActiveTab('assign')} />
        <TabButton active={activeTab === 'scanner'} emoji="📷" label="Escaner" onPress={() => setActiveTab('scanner')} />
        <TabButton active={activeTab === 'report'} emoji="📊" label="Reportes" onPress={() => setActiveTab('report')} />
      </View>

      {activeTab === 'shows' && renderShowsTab()}
      {activeTab === 'assign' && renderAssignTab()}
      {activeTab === 'scanner' && renderScannerTab()}
      {activeTab === 'report' && renderReportTab()}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Funciones registradas</Text>
        {shows.length === 0 ? (
          <Text>No hay funciones creadas todavía</Text>
        ) : (
          shows.map((show) => (
            <View key={show.id} style={styles.showRow}>
              <Text style={styles.showName}>{show.obra}</Text>
              <Text style={styles.showMeta}>{new Date(show.fecha).toLocaleString()}</Text>
              <Text style={styles.showMeta}>Tickets: {show.totalTickets}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: colors.gray },
  logoutButton: { padding: 10, backgroundColor: colors.error, borderRadius: 8 },
  logoutText: { color: 'white', fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' },
  tabButton: {
    padding: 8,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  tabButtonText: { color: colors.gray, fontWeight: '600' },
  tabButtonTextActive: { color: 'white' },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: { color: 'white', fontWeight: 'bold' },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportName: { fontWeight: 'bold' },
  resultCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  resultTitle: { fontWeight: 'bold', marginBottom: 4 },
  showRow: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
  showName: { fontWeight: 'bold' },
  showMeta: { color: colors.gray, fontSize: 12 },
});
