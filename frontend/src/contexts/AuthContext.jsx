import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const AuthContext = createContext();

const NATIVE_BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.97.97:3000';
axios.defaults.baseURL = Capacitor.isNativePlatform() ? NATIVE_BACKEND_URL : '';

// 1. Setup Axios Interceptor to auto-attach Token to EVERY request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user status on load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me');
        if (response.data?.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Clear invalid token if request fails
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Login helper
  const login = async (credentials) => {
    const response = await axios.post('/api/auth/login', credentials);
    const data = response.data;
    
    // Save token received from backend response
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    setUser(data.user || data);
    return data;
  };

  // Register helper
  const register = async (userData) => {
    const response = await axios.post('/api/auth/signup', userData);
    const data = response.data;

    // Save token received from backend response
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    setUser(data.user || data);
    return data;
  };

  // Logout helper
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token'); // Remove stored token
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};