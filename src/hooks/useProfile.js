import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';

export function useProfile() {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(authProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setProfile(authProfile);
  }, [authProfile]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    const { data, error: err } = await profileService.updateProfile(user.id, updates);

    if (err) {
      setError(err.message);
    } else {
      setProfile(prev => ({ ...prev, ...data }));
      await refreshProfile();
    }

    setLoading(false);
    return { data, error: err };
  }, [user, refreshProfile]);

  const updateGoals = useCallback(async (goals) => {
    if (!user) return { error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    const { data, error: err } = await profileService.updateGoals(user.id, goals);

    if (err) {
      setError(err.message);
    } else {
      setProfile(prev => ({ ...prev, user_goals: data }));
      await refreshProfile();
    }

    setLoading(false);
    return { data, error: err };
  }, [user, refreshProfile]);

  const updateSettings = useCallback(async (settings) => {
    if (!user) return { error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    const { data, error: err } = await profileService.updateSettings(user.id, settings);

    if (err) {
      setError(err.message);
    } else {
      setProfile(prev => ({ ...prev, user_settings: data }));
      await refreshProfile();
    }

    setLoading(false);
    return { data, error: err };
  }, [user, refreshProfile]);

  const checkUsername = useCallback(async (username) => {
    return profileService.checkUsernameAvailable(username, user?.id);
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateGoals,
    updateSettings,
    checkUsername,
    refresh: refreshProfile,
  };
}

export default useProfile;
