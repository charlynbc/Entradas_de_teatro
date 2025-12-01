import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SuperDashboardScreen from '../screens/super/SuperDashboardScreen';
import DirectorsScreen from '../screens/super/DirectorsScreen';
import ProductionsScreen from '../screens/super/ProductionsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ManualScreen from '../screens/shared/ManualScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  Dashboard: 'speedometer-outline',
  Directores: 'people-circle-outline',
  Producciones: 'color-palette-outline',
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
      })}
    >
      <Tab.Screen name="Dashboard" component={SuperDashboardScreen} />
      <Tab.Screen name="Directores" component={DirectorsScreen} />
      <Tab.Screen name="Producciones" component={ProductionsScreen} />
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
        name="Manual" 
        component={ManualScreen}
        options={{ headerShown: true, title: 'Manual de Usuario' }}
      />
    </Stack.Navigator>
  );
}
