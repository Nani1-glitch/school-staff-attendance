import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { getStoredAuth, storeAuth, clearAuth } from '../utils/storage';
import { initDB, initializeDefaultData } from '../services/database';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize database
    initDB()
      .then(() => initializeDefaultData())
      .then(() => checkAuth())
      .catch(console.error);
  }, []);

  const checkAuth = async () => {
    try {
      const stored = getStoredAuth();
      if (stored?.user) {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phoneOrEmail, pin, rememberDevice) => {
    try {
      const response = await authAPI.login(phoneOrEmail, pin, rememberDevice);
      storeAuth('local_token', response.user, rememberDevice);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
