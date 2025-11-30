import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GuestHomeScreen from '../screens/guest/GuestHomeScreen';
import GuestShowDetailScreen from '../screens/guest/GuestShowDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

export default function GuestNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuestHome" component={GuestHomeScreen} />
      <Stack.Screen name="GuestShowDetail" component={GuestShowDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
