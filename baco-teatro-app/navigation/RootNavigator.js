import React, { Component } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import GuestNavigator from './GuestNavigator';
import SuperNavigator from './SuperNavigator';
import DirectorNavigator from './DirectorNavigator';
import ActorNavigator from './ActorNavigator';
import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Navigation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#12090D', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#F48C06', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
          <Text style={{ color: '#F5F1ED', fontSize: 16, textAlign: 'center' }}>
            {this.state.error?.message || 'Algo salió mal'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootNavigator() {
  const { user } = useAuth();
  console.log('RootNavigator rendering, user:', user);

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {user ? (
          <>
            {user.role === 'SUPER' ? <SuperNavigator /> :
             user.role === 'ADMIN' ? <DirectorNavigator /> :
             <ActorNavigator />}
          </>
        ) : (
          <GuestNavigator />
        )}
      </NavigationContainer>
    </ErrorBoundary>
  );
}
