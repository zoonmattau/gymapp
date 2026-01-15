import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile
  const fetchProfile = async (userId) => {
    try {
      // Get profile separately to avoid join issues
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Error fetching profile:', profileError?.message);
        return null;
      }

      // Try to get related data separately (they may not exist)
      const [goalsResult, settingsResult] = await Promise.all([
        supabase.from('user_goals').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      const fullProfile = {
        ...profileData,
        user_goals: goalsResult.data,
        user_settings: settingsResult.data,
      };

      setProfile(fullProfile);
      return fullProfile;
    } catch (err) {
      console.warn('Error fetching profile:', err?.message);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // Profile is auto-created by database trigger
          // Fetch it after a small delay to ensure trigger completed
          setTimeout(async () => {
            // Always store email in profile for username lookup
            if (session.user.email) {
              await supabase
                .from('profiles')
                .update({ email: session.user.email })
                .eq('id', session.user.id);
            }
            fetchProfile(session.user.id);
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async ({ email, password, firstName, lastName, dob, username }) => {
    setError(null);
    try {
      // First check if username is already taken
      if (username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.toLowerCase())
          .single();

        if (existingUser) {
          throw new Error('Username is already taken. Please choose a different one.');
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dob,
            username: username?.toLowerCase(),
          },
        },
      });

      if (error) throw error;

      // Update the profile with the chosen username and email after the trigger creates it
      if (data.user) {
        // Wait a moment for the trigger to create the profile
        setTimeout(async () => {
          const updates = { email: email };
          if (username) {
            updates.username = username.toLowerCase();
          }
          await supabase
            .from('profiles')
            .update(updates)
            .eq('id', data.user.id);
        }, 1000);
      }

      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Sign in with email/username and password
  const signIn = async ({ email, username, password }) => {
    setError(null);
    try {
      let loginEmail = email;

      // If username provided instead of email, look up the email using RPC (bypasses RLS)
      if (username && !email) {
        const usernameToFind = username.toLowerCase().trim();
        console.log('Looking up username:', usernameToFind);

        const { data: userEmail, error: rpcError } = await supabase
          .rpc('get_email_by_username', { lookup_username: usernameToFind });

        console.log('Username lookup result:', { userEmail, rpcError });

        if (rpcError) {
          console.error('RPC error:', rpcError);
          throw new Error(`Username lookup failed. Please try logging in with your email instead.`);
        }

        if (!userEmail) {
          throw new Error(`Username "${usernameToFind}" not found.`);
        }

        loginEmail = userEmail;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(prev => ({ ...prev, ...data }));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  // Update user goals
  const updateGoals = async (goals) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Check if record exists first
      const { data: existing } = await supabase
        .from('user_goals')
        .select('goal')
        .eq('user_id', user.id)
        .maybeSingle();

      // Build a clean object with only valid, non-null values
      const cleanGoals = { user_id: user.id };

      // goal is required - use existing or default
      cleanGoals.goal = goals.goal || existing?.goal || 'fitness';

      // Only add other fields that have actual values
      if (goals.experience) cleanGoals.experience = goals.experience;
      if (goals.days_per_week != null) cleanGoals.days_per_week = goals.days_per_week;
      if (goals.target_weight != null) cleanGoals.target_weight = goals.target_weight;
      if (goals.current_weight != null) cleanGoals.current_weight = goals.current_weight;
      if (goals.activity_level) cleanGoals.activity_level = goals.activity_level;

      const { data, error } = await supabase
        .from('user_goals')
        .upsert(cleanGoals, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('updateGoals error:', error?.message);
        // Don't throw - just return gracefully
        return { data: null, error: null };
      }

      setProfile(prev => ({ ...prev, user_goals: data }));
      return { data, error: null };
    } catch (err) {
      console.warn('updateGoals error:', err?.message);
      return { data: null, error: null };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      return fetchProfile(user.id);
    }
    return null;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateGoals,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
