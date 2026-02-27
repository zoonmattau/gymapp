// Custom template store with localStorage persistence for web, AsyncStorage for native
import { Platform } from 'react-native';

const getStorageKey = (userId) => `uprep_custom_templates_${userId}`;

export const getCustomTemplates = async (userId) => {
  if (!userId) return [];
  const key = getStorageKey(userId);
  try {
    let raw;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      raw = await AsyncStorage.getItem(key);
    }
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.log('Error loading custom templates:', e);
  }
  return [];
};

export const saveCustomTemplate = async (userId, template) => {
  if (!userId) return;
  const key = getStorageKey(userId);
  try {
    const existing = await getCustomTemplates(userId);
    // Replace if same id, otherwise append
    const idx = existing.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      existing[idx] = template;
    } else {
      existing.push(template);
    }
    const raw = JSON.stringify(existing);
    if (Platform.OS === 'web') {
      localStorage.setItem(key, raw);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, raw);
    }
  } catch (e) {
    console.log('Error saving custom template:', e);
  }
};

export const deleteCustomTemplate = async (userId, templateId) => {
  if (!userId) return;
  const key = getStorageKey(userId);
  try {
    const existing = await getCustomTemplates(userId);
    const filtered = existing.filter(t => t.id !== templateId);
    const raw = JSON.stringify(filtered);
    if (Platform.OS === 'web') {
      localStorage.setItem(key, raw);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, raw);
    }
  } catch (e) {
    console.log('Error deleting custom template:', e);
  }
};
