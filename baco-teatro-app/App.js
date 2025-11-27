import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar pantallas existentes
import LoginScreen from './screens/LoginScreen';
import AdminHome from './screens/AdminHome';
import VendedorHome from './screens/VendedorHome';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.log('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <NavigationContainer>
        <LoginScreen onLogin={(userData) => setUser(userData)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {user.role === 'ADMIN' ? (
        <AdminHome onLogout={() => setUser(null)} />
      ) : (
        <VendedorHome onLogout={() => setUser(null)} />
      )}
    </NavigationContainer>
  );
}
