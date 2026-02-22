import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    checkUser();

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

  const checkUser = async () => {
    console.log('checkUser starting...');
    try {
      console.log('Getting session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session result:', session ? 'logged in' : 'no session', error);

      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('Loading profile for user:', session.user.id);
        await loadProfile(session.user.id);
        console.log('Profile loaded');
      }
    } catch (error) {
      console.log('Error checking auth:', error);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

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
      } else {
        // No profile found - set null, don't set fake onboarding_completed: false
        // The AppNavigator will handle this case
        setProfile(null);
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
