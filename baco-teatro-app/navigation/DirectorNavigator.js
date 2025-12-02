import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DirectorDashboardScreen from '../screens/director/DirectorDashboardScreen';
import DirectorShowsScreen from '../screens/director/DirectorShowsScreen';
import DirectorShowDetailScreen from '../screens/director/DirectorShowDetailScreen';
import DirectorScannerScreen from '../screens/director/DirectorScannerScreen';
import DirectorReportsScreen from '../screens/director/DirectorReportsScreen';
import DirectorReportsObrasScreen from '../screens/director/DirectorReportsObrasScreen';
import DirectorVendorsScreen from '../screens/director/DirectorVendorsScreen';
import DirectorRehearsalsScreen from '../screens/director/DirectorRehearsalsScreen';
// Importar pantallas de vendedor (actor) para que director pueda usarlas
import ActorStockScreen from '../screens/actor/ActorStockScreen';
import ActorTransferScreen from '../screens/actor/ActorTransferScreen';
import ActorHistoryScreen from '../screens/actor/ActorHistoryScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ManualScreen from '../screens/shared/ManualScreen';
import MiembrosScreen from '../screens/shared/MiembrosScreen';
import EnsayosGeneralesScreen from '../screens/shared/EnsayosGeneralesScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  Resumen: 'analytics-outline',
  Funciones: 'calendar-outline',
  'Mis Entradas': 'ticket-outline',
  Miembros: 'people-outline',
  Ensayos: 'time-outline',
  Vendedores: 'people-outline',
  Escaner: 'qr-code-outline',
  Reportes: 'bar-chart-outline',
  Perfil: 'person-circle-outline',
};

function DirectorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconMap[route.name]} size={size} color={color} />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
        },
      })}
    >
      <Tab.Screen name="Resumen" component={DirectorDashboardScreen} />
      <Tab.Screen name="Funciones" component={DirectorShowsScreen} />
      <Tab.Screen name="Mis Entradas" component={ActorStockScreen} options={{ title: 'Mis Entradas' }} />
      <Tab.Screen name="Miembros" component={MiembrosScreen} />
      <Tab.Screen name="Ensayos" component={EnsayosGeneralesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function DirectorNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('DirectorTabs')}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="home" size={24} color={colors.secondary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="DirectorTabs" component={DirectorTabs} />
      <Stack.Screen 
        name="DirectorShowDetail" 
        component={DirectorShowDetailScreen} 
        options={{ headerShown: true, title: 'Detalle de Función' }}
      />
      <Stack.Screen 
        name="DirectorReportsObras" 
        component={DirectorReportsObrasScreen} 
        options={{ headerShown: true, title: 'Reportes de Obras' }}
      />
      <Stack.Screen 
        name="DirectorScanner" 
        component={DirectorScannerScreen} 
        options={{ headerShown: true, title: 'Validar QR' }}
      />
      <Stack.Screen 
        name="ActorTransfer" 
        component={ActorTransferScreen} 
        options={{ headerShown: true, title: 'Transferir Entradas' }}
      />
      <Stack.Screen 
        name="ActorHistory" 
        component={ActorHistoryScreen} 
        options={{ headerShown: true, title: 'Historial de Ventas' }}
      />
      <Stack.Screen 
        name="DirectorEnsayos" 
        component={DirectorRehearsalsScreen} 
        options={{ headerShown: true, title: 'Ensayos' }}
      />
      <Stack.Screen 
        name="DirectorVendors" 
        component={DirectorVendorsScreen} 
        options={{ headerShown: true, title: 'Gestionar Vendedores' }}
      />
      <Stack.Screen 
        name="DirectorReports" 
        component={DirectorReportsScreen} 
        options={{ headerShown: true, title: 'Reportes' }}
      />
      <Stack.Screen 
        name="Manual" 
        component={ManualScreen} 
        options={{ headerShown: true, title: 'Manual de Usuario' }}
      />
    </Stack.Navigator>
  );
}
