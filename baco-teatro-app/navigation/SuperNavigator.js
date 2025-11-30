import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SuperDashboardScreen from '../screens/super/SuperDashboardScreen';
import DirectorsScreen from '../screens/super/DirectorsScreen';
import ProductionsScreen from '../screens/super/ProductionsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();

const iconMap = {
  Dashboard: 'speedometer-outline',
  Directores: 'people-circle-outline',
  Producciones: 'color-palette-outline',
  Perfil: 'person-circle-outline',
};

export default function SuperNavigator() {
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
      <Tab.Screen name="Dashboard" component={SuperDashboardScreen} />
      <Tab.Screen name="Directores" component={DirectorsScreen} />
      <Tab.Screen name="Producciones" component={ProductionsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
