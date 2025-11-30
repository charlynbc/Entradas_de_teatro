import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SuperNavigator from './SuperNavigator';
import DirectorNavigator from './DirectorNavigator';
import ActorNavigator from './ActorNavigator';
import GuestNavigator from './GuestNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? (
        user.role === 'SUPER' ? <SuperNavigator /> :
        user.role === 'ADMIN' ? <DirectorNavigator /> :
        <ActorNavigator />
      ) : (
        <GuestNavigator />
      )}
    </NavigationContainer>
  );
}
