import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import storage from '../utils/storage';
import {
  login as loginApi,
  clearSession,
  restoreSession,
  getMyProfile as getProfileApi,
  updateMyProfile as updateProfileApi,
} from '../api';

const AuthContext = createContext();

const STORAGE_KEY = 'baco:session';

export function AuthProvider({ children }) {
  console.log('AuthProvider rendering');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    console.log('AuthProvider useEffect - hydrating session');
    (async () => {
      try {
        const data = await storage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          restoreSession(parsed);
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } catch (error) {
        console.warn('No se pudo restaurar la sesión', error);
      } finally {
        console.log('AuthProvider hydrated = true');
        setHydrated(true);
      }
    })();
  }, []);

  const persist = async (session) => {
    setUser(session.user);
    setToken(session.token);
    await storage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const login = async ({ cedula, password }) => {
    setLoading(true);
    try {
      const session = await loginApi({ cedula, password });
      await persist(session);
      return session.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    clearSession();
    await storage.removeItem(STORAGE_KEY);
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const profile = await getProfileApi();
    await persist({ user: profile, token });
    return profile;
  };

  const updateProfile = async (payload) => {
    const updated = await updateProfileApi(payload);
    await persist({ user: updated, token });
    return updated;
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    hydrated,
    login,
    logout,
    refreshProfile,
    updateProfile,
    isSuper: user?.role === 'SUPER',
    isDirector: user?.role === 'ADMIN',
    isActor: user?.role === 'VENDEDOR',
  }), [user, token, loading, hydrated]);

  return (
    <AuthContext.Provider value={value}>
      {hydrated ? children : (
        <View style={{ flex: 1, backgroundColor: '#12090D', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#F5F1ED', fontSize: 18 }}>Cargando...</Text>
        </View>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
