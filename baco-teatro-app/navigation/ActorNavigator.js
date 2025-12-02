import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ActorStockScreen from '../screens/actor/ActorStockScreen';
import ActorTransferScreen from '../screens/actor/ActorTransferScreen';
import ActorHistoryScreen from '../screens/actor/ActorHistoryScreen';
import ActorRehearsalsScreen from '../screens/actor/ActorRehearsalsScreen';
import MiembrosScreen from '../screens/shared/MiembrosScreen';
import EnsayosGeneralesScreen from '../screens/shared/EnsayosGeneralesScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ManualScreen from '../screens/shared/ManualScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  'Mis Entradas': 'ticket-outline',
  Transferir: 'swap-horizontal-outline',
  Historial: 'time-outline',
  Miembros: 'people-outline',
  Ensayos: 'calendar-outline',
  Perfil: 'person-circle-outline',
};

function ActorTabs() {
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
      <Tab.Screen name="Mis Entradas" component={ActorStockScreen} />
      <Tab.Screen name="Transferir" component={ActorTransferScreen} />
      <Tab.Screen name="Miembros" component={MiembrosScreen} />
      <Tab.Screen name="Ensayos" component={EnsayosGeneralesScreen} />
      <Tab.Screen name="Historial" component={ActorHistoryScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function ActorNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ActorTabs')}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="home" size={24} color={colors.secondary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="ActorTabs" component={ActorTabs} />
      <Stack.Screen 
        name="Manual" 
        component={ManualScreen}
        options={{ headerShown: true, title: 'Manual de Usuario' }}
      />
    </Stack.Navigator>
  );
}
