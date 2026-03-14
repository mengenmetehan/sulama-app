import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setToken, clearToken, setOnUnauthorized } from '../services/api';

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

  function logout() {
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
