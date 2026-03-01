import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Trophy,
  Dumbbell,
  Clock,
  UserPlus,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { socialService } from '../services/socialService';
import { supabase } from '../lib/supabase';

const PublicProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user, profile: myProfile } = useAuth();
  const weightUnit = myProfile?.weight_unit || 'kg';

  const { userId, username: passedUsername, name: passedName } = route.params;

  const [profileData, setProfileData] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileResult, followersResult, followingResult, followStatusResult, activityResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, bio')
          .eq('id', userId)
          .single(),
        socialService.getFollowersCount(userId),
        socialService.getFollowing(userId),
        socialService.isFollowing(user?.id, userId),
        socialService.getUserActivityFeed(userId),
      ]);

      if (profileResult.data) {
        setProfileData(profileResult.data);
      }
      setFollowerCount(followersResult.count || 0);
      setFollowingCount(followingResult.data?.length || 0);
      setIsFollowing(followStatusResult.isFollowing || false);
      setActivityFeed(activityResult.data || []);
    } catch (err) {
      console.warn('Error loading public profile:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await socialService.unfollowUser(user.id, userId);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await socialService.followUser(user.id, userId);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.warn('Error toggling follow:', err?.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const displayName = profileData
    ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
    : passedName || '';
  const displayUsername = profileData?.username || passedUsername || 'user';
  const avatarLetter = displayUsername?.[0]?.toUpperCase() || 'U';

  // Don't show follow button on own profile
  const isOwnProfile = user?.id === userId;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    return (
      <>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {profileData?.avatar_url ? (
              <Image source={{ uri: profileData.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
          </View>
          <Text style={styles.username}>@{displayUsername}</Text>
          {displayName ? <Text style={styles.displayName}>{displayName}</Text> : null}
          {profileData?.bio ? <Text style={styles.bio}>{profileData.bio}</Text> : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Follow/Unfollow Button */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {isFollowing ? (
              <UserCheck size={18} color={COLORS.text} />
            ) : (
              <UserPlus size={18} color={COLORS.textOnPrimary} />
            )}
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Activity Section */}
        <Text style={styles.sectionLabel}>ACTIVITY</Text>

        {activityFeed.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyStateTitle}>No activity yet</Text>
            <Text style={styles.emptyStateText}>
              This user hasn't logged any workouts or PRs yet
            </Text>
          </View>
        ) : (
          activityFeed.map((activity) => (
            <View key={activity.id} style={styles.feedCard}>
              {/* Activity Type Badge */}
              <View style={[
                styles.feedTypeBadge,
                activity.type === 'pr' ? styles.feedTypeBadgePR : styles.feedTypeBadgeWorkout,
              ]}>
                {activity.type === 'pr' ? (
                  <Trophy size={16} color={COLORS.warning} />
                ) : (
                  <Dumbbell size={16} color={COLORS.primary} />
                )}
                <Text style={[
                  styles.feedTypeBadgeText,
                  activity.type === 'pr' ? styles.feedTypeBadgeTextPR : styles.feedTypeBadgeTextWorkout,
                ]}>
                  {activity.type === 'pr' ? 'Personal Record' : 'Completed Workout'}
                </Text>
              </View>

              {/* Activity Title */}
              <Text style={styles.feedTitle}>{activity.title}</Text>

              {/* Activity Details */}
              <View style={styles.feedDetails}>
                {activity.type === 'workout' && activity.data?.duration && (
                  <View style={styles.feedDetailItem}>
                    <Clock size={14} color={COLORS.textMuted} />
                    <Text style={styles.feedDetailText}>{activity.data.duration} min</Text>
                  </View>
                )}
                {activity.type === 'pr' && (
                  <>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailHighlight}>
                        {weightUnit === 'lbs' ? Math.round(activity.data?.weight * 2.205) : activity.data?.weight} {weightUnit}
                      </Text>
                    </View>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailText}>x {activity.data?.reps} reps</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Timestamp */}
              <Text style={styles.feedTime}>{formatTimeAgo(activity.timestamp)}</Text>
            </View>
          ))
        )}
      </>
    );
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Back Button */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <View style={styles.content}>
            {renderContent()}
            <View style={{ height: 40 }} />
          </View>
        </div>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  displayName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.surfaceLight,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 24,
  },
  followingBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  followBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  followingBtnText: {
    color: COLORS.text,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  feedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  feedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  feedTypeBadgeWorkout: {
    backgroundColor: COLORS.primary + '20',
  },
  feedTypeBadgePR: {
    backgroundColor: COLORS.warning + '20',
  },
  feedTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedTypeBadgeTextWorkout: {
    color: COLORS.primary,
  },
  feedTypeBadgeTextPR: {
    color: COLORS.warning,
  },
  feedTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  feedDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedDetailText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  feedDetailHighlight: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  feedTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});

export default PublicProfileScreen;
