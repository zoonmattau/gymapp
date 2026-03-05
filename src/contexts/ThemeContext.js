import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from '../constants/colors';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        let saved;
        if (Platform.OS === 'web') {
          saved = localStorage.getItem('theme_mode');
        } else {
          saved = await AsyncStorage.getItem('@theme_mode');
        }
        if (saved === 'light' || saved === 'dark') {
          setMode(saved);
        }
      } catch (e) {
        console.log('Error loading theme:', e);
      } finally {
        setLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('theme_mode', next);
      } else {
        await AsyncStorage.setItem('@theme_mode', next);
      }
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const value = {
    mode,
    colors: themes[mode],
    isDark: mode === 'dark',
    toggleTheme,
    loaded,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
