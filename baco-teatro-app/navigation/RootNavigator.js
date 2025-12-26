import React, { Component, lazy, Suspense } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import GuestNavigator from './GuestNavigator';
import colors from '../theme/colors';

// Lazy load navigators to prevent loading errors on startup
const SuperNavigator = lazy(() => import('./SuperNavigator'));
const DirectorNavigator = lazy(() => import('./DirectorNavigator'));
const ActorNavigator = lazy(() => import('./ActorNavigator'));

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

  const LoadingScreen = () => (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.secondary} />
    </View>
  );

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {user ? (
          <Suspense fallback={<LoadingScreen />}>
            {user.role === 'SUPER' ? <SuperNavigator /> :
             user.role === 'ADMIN' ? <DirectorNavigator /> :
             <ActorNavigator />}
          </Suspense>
        ) : (
          <GuestNavigator />
        )}
      </NavigationContainer>
    </ErrorBoundary>
  );
}
