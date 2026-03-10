import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const CookieConsentBanner = ({ colors }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) setVisible(true);
    } catch (e) {}
  }, []);

  if (!visible) return null;

  const accept = () => {
    try { localStorage.setItem('cookie_consent', 'accepted'); } catch (e) {}
    setVisible(false);
  };

  return (
    <View style={[bannerStyles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Text style={[bannerStyles.text, { color: colors.text }]}>
        We use cookies and similar technologies to improve your experience.{' '}
        <Text
          style={{ color: colors.primary, textDecorationLine: 'underline' }}
          onPress={() => window.open('https://www.uprep.com.au/privacy/', '_blank')}
        >
          Privacy Policy
        </Text>
      </Text>
      <TouchableOpacity style={[bannerStyles.button, { backgroundColor: colors.primary }]} onPress={accept}>
        <Text style={[bannerStyles.buttonText, { color: colors.textOnPrimary }]}>Accept</Text>
      </TouchableOpacity>
    </View>
  );
};

const bannerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
    zIndex: 9999,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const AppInner = () => {
  const { isDark, colors } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <AppNavigator />
        </NavigationContainer>
        {Platform.OS === 'web' && <CookieConsentBanner colors={colors} />}
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
