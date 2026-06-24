import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setToken, clearToken, setOnUnauthorized } from '../services/api';
import {
  requestNotificationPermission,
  getFcmToken,
  setupForegroundHandler,
  subscribeToTokenRefresh,
} from '../services/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOnUnauthorized(() => {
      setTokenState(null);
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    let unsubscribeRefresh;
    let unsubscribeForeground;

    async function setupFCM() {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      const fcmToken = await getFcmToken();
      if (fcmToken) {
        await api.registerFcmToken(fcmToken).catch((e) =>
          console.error('FCM token kaydedilemedi:', e)
        );
      }

      unsubscribeRefresh = subscribeToTokenRefresh(async (newToken) => {
        await api.registerFcmToken(newToken).catch((e) =>
          console.error('FCM token güncellenemedi:', e)
        );
      });

      unsubscribeForeground = setupForegroundHandler();
    }

    setupFCM();

    return () => {
      unsubscribeRefresh?.();
      unsubscribeForeground?.();
    };
  }, [token]);

  async function login(username, password) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      setToken(data.token);
      setTokenState(data.token);
    } catch (e) {
      setError(e.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    // Delete FCM token before clearing JWT so the request is still authorized
    await api.deleteFcmToken().catch((e) =>
      console.error('FCM token silinemedi:', e)
    );
    clearToken();
    setTokenState(null);
  }

  return (
    <AuthContext.Provider value={{ token, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
