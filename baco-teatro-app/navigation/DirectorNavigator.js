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
import DirectorVendorsScreen from '../screens/director/DirectorVendorsScreen';
import DirectorRehearsalsScreen from '../screens/director/DirectorRehearsalsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ManualScreen from '../screens/shared/ManualScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  Resumen: 'analytics-outline',
  Funciones: 'calendar-outline',
  Vendedores: 'people-outline',
  Escaner: 'qr-code-outline',
  Reportes: 'bar-chart-outline',
  Ensayos: 'time-outline',
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
      })}
    >
      <Tab.Screen name="Resumen" component={DirectorDashboardScreen} />
      <Tab.Screen name="Funciones" component={DirectorShowsScreen} />
      <Tab.Screen name="Ensayos" component={DirectorRehearsalsScreen} />
      <Tab.Screen name="Vendedores" component={DirectorVendorsScreen} />
      <Tab.Screen name="Escaner" component={DirectorScannerScreen} />
      <Tab.Screen name="Reportes" component={DirectorReportsScreen} />
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
        name="Manual" 
        component={ManualScreen} 
        options={{ headerShown: true, title: 'Manual de Usuario' }}
      />
    </Stack.Navigator>
  );
}
