import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('leada360_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // If no user is logged in, optionally default or keep null
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.users.login(email, password);
      if (res?.user) {
        setCurrentUser(res.user);
        localStorage.setItem('leada360_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Login error' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('leada360_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

