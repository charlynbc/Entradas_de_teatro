import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

// Importar pantallas existentes
import LoginScreen from './screens/LoginScreen';
import AdminHome from './screens/AdminHome';
import VendedorHome from './screens/VendedorHome';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData, token) => {
    console.log('App.js - Login exitoso:', userData);
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LoginScreen onLogin={handleLogin} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <NavigationContainer>
        {user.rol === 'supremo' || user.rol === 'admin' ? (
          <AdminHome user={user} onLogout={handleLogout} />
        ) : (
          <VendedorHome user={user} onLogout={handleLogout} />
        )}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
