import axios from 'axios';

// Detects if the app is running as a compiled Capacitor app on Android
const isCapacitor = window.location.origin.includes('localhost') && !window.location.port;

// Use your PC's IP address when running natively on Android, or fallback to the Vite proxy/env variable for desktop web
export const BASE_URL = isCapacitor 
  ? 'http://192.168.1.247:3000' 
  : (import.meta.env.VITE_API_BASE_URL || '');

// Export a configured Axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Allows passing cookies across requests
});