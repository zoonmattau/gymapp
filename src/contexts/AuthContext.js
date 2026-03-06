import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';

const AuthContext = createContext({});
const PROFILE_CACHE_KEY = 'cached_profile';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cache and session together
    const init = async () => {
      // Load cached profile first (fast, local)
      let cachedProfile = null;
      try {
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          cachedProfile = JSON.parse(cached);
        }
      } catch (e) {
        console.log('Error loading cached profile:', e);
      }

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // If cache matches current user, use it immediately
        if (cachedProfile && cachedProfile.id === currentUser.id) {
          setProfile(cachedProfile);
        }
        // Refresh from network in background
        loadProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    console.log('loadProfile starting for:', userId);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      );

      const profilePromise = profileService.getProfile(userId);
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      console.log('loadProfile result:', data ? 'got profile' : 'no profile', error);

      if (data) {
        setProfile(data);
        // Cache profile for instant load next time
        AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data)).catch(() => {});
      } else {
        // No profile found - set null, don't set fake onboarding_completed: false
        // The AppNavigator will handle this case
        setProfile(null);
        AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
      }
    } catch (error) {
      console.log('Error loading profile:', error);
      // On error, set null - the AppNavigator will retry or handle gracefully
      setProfile(null);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.trim(),
        email: email.trim().toLowerCase(),
      });
    }

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
