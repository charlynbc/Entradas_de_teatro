import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SuperDashboardScreen from '../screens/super/SuperDashboardScreen';
import DirectorsScreen from '../screens/super/DirectorsScreen';
import ProductionsScreen from '../screens/super/ProductionsScreen';
// Importar funcionalidades de director
import DirectorShowsScreen from '../screens/director/DirectorShowsScreen';
import DirectorShowDetailScreen from '../screens/director/DirectorShowDetailScreen';
import DirectorReportsScreen from '../screens/director/DirectorReportsScreen';
import DirectorReportsObrasScreen from '../screens/director/DirectorReportsObrasScreen';
import DirectorVendorsScreen from '../screens/director/DirectorVendorsScreen';
import DirectorScannerScreen from '../screens/director/DirectorScannerScreen';
// Importar funcionalidades de vendedor (actor)
import ActorStockScreen from '../screens/actor/ActorStockScreen';
import ActorTransferScreen from '../screens/actor/ActorTransferScreen';
import ActorHistoryScreen from '../screens/actor/ActorHistoryScreen';
import MiembrosScreen from '../screens/shared/MiembrosScreen';
import EnsayosGeneralesScreen from '../screens/shared/EnsayosGeneralesScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ManualScreen from '../screens/shared/ManualScreen';
import GruposScreen from '../screens/director/GruposScreen';
import GrupoDetailScreen from '../screens/director/GrupoDetailScreen';
import ObraDetailScreen from '../screens/director/ObraDetailScreen';
import CrearObraScreen from '../screens/director/CrearObraScreen';
import CrearEnsayoScreen from '../screens/director/CrearEnsayoScreen';
import EnsayosScreen from '../screens/director/EnsayosScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  Dashboard: 'speedometer-outline',
  'Crear usuario': 'person-add-outline',
  Producciones: 'color-palette-outline',
  Funciones: 'calendar-outline',
  'Mis Entradas': 'ticket-outline',
  Miembros: 'people-outline',
  Grupos: 'people-circle-outline',
  Ensayos: 'time-outline',
  Reportes: 'bar-chart-outline',
  Perfil: 'person-circle-outline',
};

function SuperTabs() {
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
          fontSize: 10,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={SuperDashboardScreen} />
      <Tab.Screen name="Crear usuario" component={DirectorsScreen} />
      <Tab.Screen name="Funciones" component={DirectorShowsScreen} />
      <Tab.Screen name="Mis Entradas" component={ActorStockScreen} options={{ title: 'Mis Entradas' }} />
      <Tab.Screen name="Miembros" component={MiembrosScreen} />
      <Tab.Screen name="Grupos" component={GruposScreen} />
      <Tab.Screen name="Ensayos" component={EnsayosScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function SuperNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('SuperTabs')}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="home" size={24} color={colors.secondary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="SuperTabs" component={SuperTabs} />
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
        name="DirectorVendors" 
        component={DirectorVendorsScreen} 
        options={{ headerShown: true, title: 'Gestionar Vendedores' }}
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
        name="Productions" 
        component={ProductionsScreen} 
        options={{ headerShown: true, title: 'Todas las Producciones' }}
      />
      <Stack.Screen 
        name="Manual" 
        component={ManualScreen}
        options={{ headerShown: true, title: 'Manual de Usuario' }}
      />
      <Stack.Screen 
        name="GrupoDetail" 
        component={GrupoDetailScreen} 
        options={{ headerShown: true, title: 'Detalle del Grupo' }}
      />
      <Stack.Screen 
        name="ObraDetail" 
        component={ObraDetailScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CrearObra" 
        component={CrearObraScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CrearEnsayo" 
        component={CrearEnsayoScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
