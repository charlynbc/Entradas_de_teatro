import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ActorStockScreen from '../screens/actor/ActorStockScreen';
import ActorTransferScreen from '../screens/actor/ActorTransferScreen';
import ActorHistoryScreen from '../screens/actor/ActorHistoryScreen';
import ActorRehearsalsScreen from '../screens/actor/ActorRehearsalsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ManualScreen from '../screens/shared/ManualScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  'Mis Entradas': 'ticket-outline',
  Transferir: 'swap-horizontal-outline',
  Historial: 'time-outline',
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
      <Tab.Screen name="Ensayos" component={ActorRehearsalsScreen} />
      <Tab.Screen name="Historial" component={ActorHistoryScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function ActorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActorTabs" component={ActorTabs} />
      <Stack.Screen name="Manual" component={ManualScreen} />
    </Stack.Navigator>
  );
}
