import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://braydibwouugjdtidcbk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYXlkaWJ3b3V1Z2pkdGlkY2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDU3MTYsImV4cCI6MjA4MzE4MTcxNn0.AEg7CY_dv_7cggSGQ9d3FfcyHEYWXty9raz9BclTob4';

// Use localStorage for web, AsyncStorage for native
const storage = Platform.OS === 'web' ? {
  getItem: (key) => {
    const value = localStorage.getItem(key);
    return Promise.resolve(value);
  },
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
} : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: storage,
  },
});

// Helper for real-time subscriptions
export const subscribeToChannel = (channelName, table, callback, filter = {}) => {
  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...filter
      },
      callback
    )
    .subscribe();
};

export default supabase;
