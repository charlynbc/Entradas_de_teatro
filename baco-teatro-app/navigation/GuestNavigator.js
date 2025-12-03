import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GuestHomeScreen from '../screens/guest/GuestHomeScreen';
import GuestShowDetailScreen from '../screens/guest/GuestShowDetailScreen';
import GuestManualScreen from '../screens/guest/GuestManualScreen';
import ContactoScreen from '../screens/guest/ContactoScreen';
import DeveloperScreen from '../screens/guest/DeveloperScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ObrasPublicScreen from '../screens/guest/ObrasPublicScreen';
import FuncionesPublicScreen from '../screens/guest/FuncionesPublicScreen';

const Stack = createNativeStackNavigator();

export default function GuestNavigator() {
  console.log('GuestNavigator rendering');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuestHome" component={GuestHomeScreen} />
      <Stack.Screen name="ObrasPublic" component={ObrasPublicScreen} />
      <Stack.Screen name="FuncionesPublic" component={FuncionesPublicScreen} />
      <Stack.Screen name="GuestShowDetail" component={GuestShowDetailScreen} />
      <Stack.Screen name="GuestManual" component={GuestManualScreen} />
      <Stack.Screen name="Contacto" component={ContactoScreen} />
      <Stack.Screen name="Developer" component={DeveloperScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
