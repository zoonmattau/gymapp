import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
  Modal,
  Image,
} from 'react-native';
import {
  Users,
  Heart,
  MessageCircle,
  Trophy,
  Search,
  UserPlus,
  UserCheck,
  Dumbbell,
  Clock,
  Star,
  Plus,
  Target,
  Share2,
  FileText,
  ChevronDown,
  Filter,
  X,
  Check,
  Bell,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { socialService } from '../services/socialService';
import { profileService } from '../services/profileService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import { competitionService } from '../services/competitionService';
import { workoutService } from '../services/workoutService';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TABS = [
  { id: 'community', label: 'Community' },
  { id: 'profile', label: 'Profile' },
];

// Collapsible Feed Card Component
const FeedCard = ({ activity, weightUnit, navigation }) => {
  const [expanded, setExpanded] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState([]);
  const COLORS = useColors();

  const loadExerciseDetails = async () => {
    if (activity.type !== 'workout' || exerciseDetails.length > 0) return;

    try {
      const { data } = await supabase
        .from('workout_sets')
        .select('exercise_name, set_number, weight, reps')
        .eq('session_id', activity.activityId)
        .order('set_number', { ascending: true });

      // Group by exercise
      const grouped = {};
      (data || []).forEach(set => {
        if (!grouped[set.exercise_name]) {
          grouped[set.exercise_name] = [];
        }
        grouped[set.exercise_name].push(set);
      });

      setExerciseDetails(Object.entries(grouped).map(([name, sets]) => ({ name, sets })));
    } catch (err) {
      console.log('Error loading exercise details:', err);
    }
  };

  const handleToggle = () => {
    if (!expanded) {
      loadExerciseDetails();
    }
    setExpanded(!expanded);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primary + '30',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    avatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarText: {
      color: COLORS.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    username: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
    },
    time: {
      color: COLORS.textMuted,
      fontSize: 12,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: COLORS.primary + '20',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.primary,
    },
    content: {
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      color: COLORS.text,
      fontSize: 17,
      fontWeight: 'bold',
      flex: 1,
    },
    starsRow: {
      flexDirection: 'row',
      gap: 2,
    },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: COLORS.cardLight,
      borderRadius: 10,
      padding: 10,
      justifyContent: 'space-around',
    },
    stat: {
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    statValue: {
      color: COLORS.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    statLabel: {
      color: COLORS.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      backgroundColor: COLORS.border,
    },
    expandBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    expandText: {
      color: COLORS.primary,
      fontSize: 13,
      marginRight: 4,
    },
    exerciseList: {
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    exerciseItem: {
      backgroundColor: COLORS.cardLight,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    exerciseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    exerciseName: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
    },
    exerciseSetsCount: {
      color: COLORS.textMuted,
      fontSize: 12,
    },
    setsTable: {
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingTop: 8,
    },
    setRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    setNumber: {
      color: COLORS.textMuted,
      fontSize: 13,
      width: 50,
    },
    setWeight: {
      color: COLORS.text,
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
      textAlign: 'center',
    },
    setReps: {
      color: COLORS.primary,
      fontSize: 13,
      fontWeight: '600',
      width: 60,
      textAlign: 'right',
    },
    setText: {
      color: COLORS.textSecondary,
      fontSize: 13,
    },
    prDetails: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    prWeight: {
      color: COLORS.warning,
      fontSize: 20,
      fontWeight: 'bold',
    },
    prReps: {
      color: COLORS.textSecondary,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => navigation.navigate('PublicProfile', { userId: activity.userId, username: activity.profile?.username })}
        >
          <View style={styles.avatar}>
            {activity.profile?.avatar_url ? (
              <Image source={{ uri: activity.profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {activity.profile?.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.username}>@{activity.profile?.username || 'user'}</Text>
            <Text style={styles.time}>{formatTimeAgo(activity.timestamp)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activity.type === 'pr' ? 'PR' : 'Workout'}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{activity.title}</Text>
          {activity.type === 'workout' && (
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  color={COLORS.warning}
                  fill={star <= (activity.data?.rating || 0) ? COLORS.warning : 'transparent'}
                />
              ))}
            </View>
          )}
        </View>

        {activity.type === 'workout' && (
          <View style={styles.statsRow}>
            {[
              activity.data?.duration > 0 && { value: activity.data.duration, label: 'min' },
              activity.data?.exercises > 0 && { value: activity.data.exercises, label: 'exercises' },
              activity.data?.sets > 0 && { value: activity.data.sets, label: 'sets' },
              activity.data?.reps > 0 && { value: activity.data.reps, label: 'reps' },
              activity.data?.volume > 0 && {
                value: activity.data.volume >= 1000 ? `${(activity.data.volume / 1000).toFixed(1)}K` : activity.data.volume,
                label: weightUnit
              },
            ].filter(Boolean).map((stat, idx, arr) => (
              <React.Fragment key={idx}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {idx < arr.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        )}

        {activity.type === 'pr' && (
          <View style={styles.prDetails}>
            <Text style={styles.prWeight}>
              {weightUnit === 'lbs' ? Math.round(activity.data?.weight * 2.205) : activity.data?.weight} {weightUnit}
            </Text>
            <Text style={styles.prReps}>× {activity.data?.reps} reps</Text>
          </View>
        )}
      </View>

      {/* Expand/collapse for workouts */}
      {activity.type === 'workout' && (
        <>
          <TouchableOpacity style={styles.expandBtn} onPress={handleToggle}>
            <Text style={styles.expandText}>{expanded ? 'Hide details' : 'Show exercises'}</Text>
            <ChevronDown size={16} color={COLORS.primary} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.exerciseList}>
              {exerciseDetails.length === 0 ? (
                <Text style={styles.setText}>Loading...</Text>
              ) : (
                exerciseDetails.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseItem}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseSetsCount}>{exercise.sets.length} sets</Text>
                    </View>
                    <View style={styles.setsTable}>
                      {exercise.sets.map((set, setIdx) => (
                        <View key={setIdx} style={styles.setRow}>
                          <Text style={styles.setNumber}>Set {setIdx + 1}</Text>
                          <Text style={styles.setWeight}>
                            {set.weight > 0 ? `${weightUnit === 'lbs' ? Math.round(set.weight * 2.205) : set.weight} ${weightUnit}` : '—'}
                          </Text>
                          <Text style={styles.setReps}>{set.reps} reps</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

// Collapsible exercise preview for community workout cards
const getDurationRange = (workout) => {
  const min = parseInt(workout.description?.match(/^(\d+)\s*min/)?.[1]);
  if (!min || min <= 0) return null;
  return `${Math.max(0, min - 10)}-${min + 10} min`;
};

const WorkoutExercisePreview = ({ exercises, COLORS }) => {
  const [expanded, setExpanded] = useState(false);
  const parsedExercises = typeof exercises === 'string' ? JSON.parse(exercises) : exercises;
  const hasExercises = parsedExercises && parsedExercises.length > 0;

  return (
    <View style={{ marginTop: 8 }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          paddingVertical: 6, gap: 4,
        }}
      >
        <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>
          {expanded ? 'Hide Exercises' : 'Preview Exercises'}
        </Text>
        {expanded
          ? <ChevronDown size={14} color={COLORS.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          : <ChevronDown size={14} color={COLORS.primary} />
        }
      </TouchableOpacity>
      {expanded && (
        <View style={{ marginTop: 4, gap: 4 }}>
          {hasExercises ? parsedExercises.map((ex, idx) => (
            <View key={idx} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: COLORS.surfaceLight, borderRadius: 8,
              paddingHorizontal: 12, paddingVertical: 8,
            }}>
              <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '500', flex: 1 }}>
                {ex.name}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
                {ex.sets} {ex.sets === 1 ? 'set' : 'sets'}
              </Text>
            </View>
          )) : (
            <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>
              Exercise details not available — re-share to include them
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const CommunityScreen = ({ route }) => {
  const navigation = useNavigation();
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user, profile } = useAuth();
  const weightUnit = profile?.weight_unit || 'kg';
  const initialTab = route?.params?.initialTab || 'community';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  // Activity Feed
  const [activityFeed, setActivityFeed] = useState([]);
  const [feedLimit, setFeedLimit] = useState(5);
  const [userLikes, setUserLikes] = useState({});

  // Community Workouts
  const [communityWorkouts, setCommunityWorkouts] = useState([]);
  const [workoutSort, setWorkoutSort] = useState('popular');
  const [savedWorkoutIds, setSavedWorkoutIds] = useState(new Set());

  // Followers/Following
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Discover
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState(''); // debug
  const [followingIds, setFollowingIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());

  // Follow Requests (for Followers tab)
  const [pendingRequests, setPendingRequests] = useState([]);

  // Following search
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const [followingSearchResults, setFollowingSearchResults] = useState([]);

  // My Profile
  const [myActivity, setMyActivity] = useState([]);
  const [myActivityLoading, setMyActivityLoading] = useState(false);
  const [myFollowerCount, setMyFollowerCount] = useState(0);
  const [myFollowingCount, setMyFollowingCount] = useState(0);

  // Challenges
  const [challenges, setChallenges] = useState([]);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    type: 'workouts',
    duration: 7,
    invitedFriends: [],
  });

  // Share Workout Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [previewWorkout, setPreviewWorkout] = useState(null); // { ...workout, exerciseDetails: [...] }
  const [shareWorkoutsEnabled, setShareWorkoutsEnabled] = useState(true);

  // Discover period filter
  const [discoverPeriod, setDiscoverPeriod] = useState('all');
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  // Filters modal
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // My Rep-ertoire modal
  const [showRepertoireModal, setShowRepertoireModal] = useState(false);
  const [savedWorkoutsWithDetails, setSavedWorkoutsWithDetails] = useState([]);
  const [loadingRepertoire, setLoadingRepertoire] = useState(false);

  // Profile followers/following modal
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');

  // Challenge detail modal
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeLeaderboard, setChallengeLeaderboard] = useState([]);
  const [challengeParticipantsFromFollowing, setChallengeParticipantsFromFollowing] = useState([]);

  const searchTimerRef = useRef(null);
  const followingSearchTimerRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
    // Load share preference
    AsyncStorage.getItem('@share_workouts_enabled').then(val => {
      if (val !== null) setShareWorkoutsEnabled(val === 'true');
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadTabData();
    }
  }, [activeTab, workoutSort]);

  // Auto-search on Discover tab when query changes
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      searchUsers();
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  // Auto-search on Following tab when query changes
  useEffect(() => {
    if (followingSearchTimerRef.current) clearTimeout(followingSearchTimerRef.current);
    if (!followingSearchQuery.trim()) {
      setFollowingSearchResults([]);
      return;
    }
    followingSearchTimerRef.current = setTimeout(() => {
      searchUsersFromFollowing();
    }, 400);
    return () => clearTimeout(followingSearchTimerRef.current);
  }, [followingSearchQuery]);

  const loadInitialData = async () => {
    loadFollowingIds();
    loadFollowers();
  };

  const loadFollowingIds = async () => {
    try {
      const [followingResult, pendingResult] = await Promise.all([
        socialService.getFollowing(user.id),
        socialService.getPendingRequestIds(user.id),
      ]);
      if (followingResult.data) {
        setFollowingIds(new Set(followingResult.data.map(f => f.following_id)));
      }
      if (pendingResult.data) {
        setPendingIds(new Set(pendingResult.data));
      }
    } catch (error) {
      console.log('Error loading following:', error);
    }
  };

  const loadTabData = async () => {
    switch (activeTab) {
      case 'community':
        // Load all community data in parallel
        await Promise.all([
          loadActivityFeed(),
          loadCommunityWorkouts(),
          loadChallenges(),
        ]);
        break;
      case 'profile':
        await Promise.all([
          loadMyActivity(),
          loadFollowers(),
          loadFollowing(),
        ]);
        break;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTabData();
    setRefreshing(false);
  };

  const loadActivityFeed = async () => {
    try {
      setFeedLimit(5); // Reset to show first 5
      // Load feed and suggested users in parallel
      const [feedResult, suggestedResult, likesResult] = await Promise.all([
        socialService.getActivityFeed(user.id, 30),
        socialService.getSuggestedUsers(user.id, 15),
        socialService.getUserLikes(user.id),
      ]);

      if (feedResult.data) {
        setActivityFeed(feedResult.data);
      }

      if (suggestedResult.data) {
        setSuggestedUsers(suggestedResult.data);
      }

      if (likesResult.data) {
        const likesMap = {};
        likesResult.data.forEach(l => { likesMap[l.activity_id] = true; });
        setUserLikes(likesMap);
      }
    } catch (error) {
      console.log('Error loading feed:', error);
    }
  };

  const loadMyActivity = async () => {
    setMyActivityLoading(true);
    try {
      const [activityResult, followersCountResult, followingResult] = await Promise.all([
        socialService.getUserActivityFeed(user.id, 30),
        socialService.getFollowersCount(user.id),
        socialService.getFollowing(user.id),
      ]);
      setMyActivity(activityResult.data || []);
      setMyFollowerCount(followersCountResult.count || 0);
      setMyFollowingCount(followingResult.data?.length || 0);
    } catch (error) {
      console.log('Error loading my activity:', error);
    } finally {
      setMyActivityLoading(false);
    }
  };

  const loadCommunityWorkouts = async () => {
    try {
      const { data } = await publishedWorkoutService.getPublishedWorkouts({
        sort: workoutSort,
        limit: 20,
      });
      if (data) {
        setCommunityWorkouts(data);
      }

      const { data: saved } = await publishedWorkoutService.getSavedWorkouts(user.id);
      if (saved) {
        setSavedWorkoutIds(new Set(saved));
      }
    } catch (error) {
      console.log('Error loading workouts:', error);
    }
  };

  const loadFollowers = async () => {
    try {
      const [followersResult, requestsResult] = await Promise.all([
        socialService.getFollowers(user.id),
        socialService.getPendingFollowRequests(user.id),
      ]);
      if (followersResult.data) {
        setFollowers(followersResult.data);
      }
      if (requestsResult.data) {
        setPendingRequests(requestsResult.data);
      }
    } catch (error) {
      console.log('Error loading followers:', error);
    }
  };

  const loadFollowing = async () => {
    try {
      const { data } = await socialService.getFollowing(user.id);
      if (data) {
        setFollowing(data);
      }
    } catch (error) {
      console.log('Error loading following:', error);
    }
  };

  const loadSuggestedUsers = async () => {
    try {
      const { data } = await socialService.getSuggestedUsers(user.id, 30);
      if (data) {
        setSuggestedUsers(data);
      }
    } catch (error) {
      console.log('Error loading suggestions:', error);
    }
  };

  const loadChallenges = async () => {
    try {
      const { data } = await competitionService.getActiveChallenges(user.id);
      if (data) {
        setChallenges(data);
      }
    } catch (error) {
      console.log('Error loading challenges:', error);
    }
  };

  const handleLikeActivity = async (activityId) => {
    const isLiked = userLikes[activityId];

    setUserLikes(prev => ({ ...prev, [activityId]: !isLiked }));
    setActivityFeed(prev => prev.map(a =>
      a.id === activityId
        ? { ...a, like_count: (a.like_count || 0) + (isLiked ? -1 : 1) }
        : a
    ));

    try {
      if (isLiked) {
        await socialService.unlikeActivity(user.id, activityId);
      } else {
        await socialService.likeActivity(user.id, activityId);
      }
    } catch (error) {
      setUserLikes(prev => ({ ...prev, [activityId]: isLiked }));
      console.log('Error toggling like:', error);
    }
  };

  const handleFollowUser = async (targetUserId) => {
    const isFollowing = followingIds.has(targetUserId);
    const isPending = pendingIds.has(targetUserId);

    if (isFollowing || isPending) {
      // Unfollow or cancel pending request
      if (isFollowing) {
        setFollowingIds(prev => { const next = new Set(prev); next.delete(targetUserId); return next; });
      } else {
        setPendingIds(prev => { const next = new Set(prev); next.delete(targetUserId); return next; });
      }

      try {
        await socialService.unfollowUser(user.id, targetUserId);
      } catch (error) {
        // Revert on error
        if (isFollowing) {
          setFollowingIds(prev => { const next = new Set(prev); next.add(targetUserId); return next; });
        } else {
          setPendingIds(prev => { const next = new Set(prev); next.add(targetUserId); return next; });
        }
        console.log('Error unfollowing:', error);
      }
    } else {
      // Follow - result depends on target's privacy setting
      try {
        const { data } = await socialService.followUser(user.id, targetUserId);
        if (data?.status === 'accepted') {
          setFollowingIds(prev => { const next = new Set(prev); next.add(targetUserId); return next; });
        } else if (data?.status === 'pending') {
          setPendingIds(prev => { const next = new Set(prev); next.add(targetUserId); return next; });
        }
      } catch (error) {
        console.log('Error following:', error);
      }
    }
  };

  const handleAcceptRequest = async (request) => {
    setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    try {
      await socialService.acceptFollowRequest(request.id);
      // Reload followers to show new follower
      loadFollowers();
    } catch (error) {
      console.log('Error accepting request:', error);
      setPendingRequests(prev => [...prev, request]);
    }
  };

  const handleRejectRequest = async (request) => {
    setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    try {
      await socialService.rejectFollowRequest(request.id);
    } catch (error) {
      console.log('Error rejecting request:', error);
      setPendingRequests(prev => [...prev, request]);
    }
  };

  const handleOpenRepertoire = async () => {
    setShowRepertoireModal(true);
    setLoadingRepertoire(true);
    try {
      const [ownResult, savedResult] = await Promise.all([
        publishedWorkoutService.getUserPublishedWorkouts(user.id),
        publishedWorkoutService.getSavedWorkoutsWithDetails(user.id),
      ]);
      // Merge own published + saved, dedupe by id
      const seen = new Set();
      const merged = [];
      for (const w of [...(ownResult.data || []), ...(savedResult.data || [])]) {
        if (!seen.has(w.id)) {
          seen.add(w.id);
          merged.push(w);
        }
      }
      setSavedWorkoutsWithDetails(merged);
    } catch (error) {
      console.log('Error loading repertoire:', error);
      setSavedWorkoutsWithDetails([]);
    } finally {
      setLoadingRepertoire(false);
    }
  };

  const handleStartRepertoireWorkout = (workout) => {
    setShowRepertoireModal(false);
    const exercises = typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises;
    navigation.navigate('ActiveWorkout', {
      workoutName: workout.name,
      workout: {
        id: workout.id,
        name: workout.name,
        exercises: (exercises || []).map(ex => ({
          name: ex.name,
          sets: ex.sets || 3,
        })),
      },
    });
  };

  const handleStartCommunityWorkout = (workout) => {
    const exercises = typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises;
    navigation.navigate('ActiveWorkout', {
      workoutName: workout.name,
      workout: {
        id: workout.id,
        name: workout.name,
        exercises: (exercises || []).map(ex => ({
          name: ex.name,
          sets: ex.sets || 3,
        })),
      },
    });
  };

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
    // Reload workouts with filters
    loadCommunityWorkouts();
  };

  const handleDeletePublishedWorkout = async (workoutId) => {
    const doDelete = () => {
      publishedWorkoutService.deleteWorkout(user.id, workoutId).then(({ error }) => {
        if (!error) {
          setCommunityWorkouts(prev => prev.filter(w => w.id !== workoutId));
        }
      });
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this workout from the community?')) doDelete();
    } else {
      Alert.alert('Delete Workout', 'Remove this workout from the community?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleSaveWorkout = async (workoutId) => {
    const isSaved = savedWorkoutIds.has(workoutId);

    setSavedWorkoutIds(prev => {
      const next = new Set(prev);
      if (isSaved) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });

    try {
      if (isSaved) {
        await publishedWorkoutService.unsaveWorkout(user.id, workoutId);
      } else {
        await publishedWorkoutService.saveWorkout(user.id, workoutId);
      }
    } catch (error) {
      console.log('Error toggling save:', error);
    }
  };

  const handleOpenChallengeDetail = async (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeDetail(true);

    // Generate sample leaderboard data for now
    const sampleLeaderboard = [
      { id: '1', username: 'fitpro', name: 'Fitness Pro', progress: 95, avatar: null },
      { id: '2', username: 'ironmaster', name: 'Iron Master', progress: 87, avatar: null },
      { id: '3', username: profile?.username || 'you', name: profile?.first_name || 'You', progress: challenge.user_progress || 0, avatar: profile?.avatar_url, isMe: true },
      { id: '4', username: 'gymrat', name: 'Gym Rat', progress: 72, avatar: null },
      { id: '5', username: 'lifter', name: 'Power Lifter', progress: 65, avatar: null },
    ].sort((a, b) => b.progress - a.progress);

    setChallengeLeaderboard(sampleLeaderboard);

    // Check which of my following are in this challenge
    const followingInChallenge = following.slice(0, 3).map(f => ({
      id: f.following_id,
      username: f.following?.username,
      avatar: f.following?.avatar_url,
    }));
    setChallengeParticipantsFromFollowing(followingInChallenge);
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await competitionService.joinChallenge(user.id, challengeId);
      // Refresh challenges
      loadChallenges();
      setShowChallengeDetail(false);
    } catch (error) {
      console.log('Error joining challenge:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchStatus('');
      return;
    }

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchStatus('Type at least 2 characters');
      return;
    }

    setSearchStatus('searching');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url, bio')
        .or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .neq('id', user.id)
        .limit(20);

      if (error) {
        console.log('Search error:', error);
        setSearchStatus('');
        return;
      }

      setSearchResults(data || []);
      setSearchStatus(data && data.length > 0 ? '' : 'no_results');
    } catch (err) {
      console.log('Search exception:', err);
      setSearchStatus('');
    }
  };

  const searchUsersFromFollowing = async () => {
    if (!followingSearchQuery.trim()) {
      setFollowingSearchResults([]);
      return;
    }

    const q = followingSearchQuery.trim();
    if (q.length < 2) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url, bio')
        .or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .neq('id', user.id)
        .limit(20);

      if (!error && data) {
        setFollowingSearchResults(data);
      }
    } catch (err) {
      console.log('Error searching from following:', err);
    }
  };

  const handleShareWorkout = async () => {
    setLoadingWorkouts(true);
    setShowShareModal(true);

    try {
      // Load user's recent completed workouts
      const { data } = await workoutService.getCompletedSessions(user?.id, 10);
      if (data && data.length > 0) {
        // Fetch exercise counts from workout_sets for these sessions
        const sessionIds = data.map(s => s.id);
        const { data: setsData } = await supabase
          .from('workout_sets')
          .select('session_id, exercise_name')
          .in('session_id', sessionIds);

        const exerciseCountMap = {};
        (setsData || []).forEach(s => {
          if (!exerciseCountMap[s.session_id]) {
            exerciseCountMap[s.session_id] = new Set();
          }
          if (s.exercise_name) exerciseCountMap[s.session_id].add(s.exercise_name);
        });

        const formattedWorkouts = data.map(session => ({
          id: session.id,
          name: session.workout_name || 'Workout',
          date: session.ended_at
            ? new Date(session.ended_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'Recently',
          duration: session.duration_minutes || 0,
          exercises: exerciseCountMap[session.id]?.size || 0,
        }));
        setRecentWorkouts(formattedWorkouts);
      } else {
        setRecentWorkouts([]);
      }
    } catch (error) {
      console.log('Error loading workouts:', error);
      setRecentWorkouts([]);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const handlePreviewWorkout = async (workout) => {
    // Fetch exercise details for preview
    try {
      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('exercise_name, set_number, weight, reps')
        .eq('session_id', workout.id)
        .order('set_number', { ascending: true });

      const grouped = {};
      (setsData || []).forEach(s => {
        if (!grouped[s.exercise_name]) grouped[s.exercise_name] = [];
        grouped[s.exercise_name].push(s);
      });

      const exerciseDetails = Object.entries(grouped).map(([name, sets]) => ({
        name,
        sets,
      }));

      setPreviewWorkout({ ...workout, exerciseDetails });
    } catch (err) {
      console.log('Error loading workout preview:', err);
    }
  };

  const handleConfirmShare = async () => {
    if (!previewWorkout) return;
    const workout = previewWorkout;
    setPreviewWorkout(null);
    setShowShareModal(false);

    try {
      const exercises = workout.exerciseDetails.map(ex => ({
        name: ex.name,
        sets: ex.sets.length,
      }));

      const { data, error } = await publishedWorkoutService.publishWorkout(user.id, {
        name: workout.name,
        exercises,
        description: `${workout.duration} min • ${exercises.length} exercises`,
      });

      if (error) {
        console.log('Publish error:', error);
        const errorMessage = `Failed to share: ${error.message || 'Unknown error'}`;
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
        return;
      }

      const successMessage = `"${workout.name}" shared successfully!`;
      if (Platform.OS === 'web') {
        alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }
      loadCommunityWorkouts();
    } catch (err) {
      console.log('Error sharing workout:', err);
      const errorMessage = `Failed to share workout: ${err.message || 'Please try again.'}`;
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderMyProfile = () => (
    <>
      {/* Profile Header */}
      <View style={styles.myProfileHeader}>
        <View style={styles.myProfileAvatarWrap}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.myProfileAvatar} />
          ) : (
            <View style={styles.myProfileAvatarFallback}>
              <Text style={styles.myProfileAvatarText}>
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.myProfileName}>
          {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile?.username || 'User'}
        </Text>
        <Text style={styles.myProfileUsername}>@{profile?.username || 'user'}</Text>
        <View style={styles.myProfileStats}>
          <TouchableOpacity style={styles.myProfileStat} onPress={() => setActiveTab('followers')}>
            <Text style={styles.myProfileStatCount}>{myFollowerCount}</Text>
            <Text style={styles.myProfileStatLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.myProfileStat} onPress={() => setActiveTab('following')}>
            <Text style={styles.myProfileStatCount}>{myFollowingCount}</Text>
            <Text style={styles.myProfileStatLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity */}
      <Text style={styles.sectionLabel}>MY ACTIVITY</Text>
      {myActivityLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading...</Text>
        </View>
      ) : myActivity.length === 0 ? (
        <View style={styles.emptyState}>
          <Dumbbell size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyStateTitle}>No activity yet</Text>
          <Text style={styles.emptyStateText}>
            Complete a workout or set a PR to see your activity here
          </Text>
        </View>
      ) : (
        myActivity.map((activity) => (
          <View key={activity.id} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <View style={styles.feedUserRow}>
                <View style={[
                  styles.feedAvatar,
                  activity.type === 'pr' && styles.feedAvatarPR,
                ]}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.feedAvatarImage} />
                  ) : (
                    <Text style={styles.feedAvatarText}>
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.feedUserInfo}>
                  <Text style={styles.feedUsername}>@{profile?.username || 'user'}</Text>
                  <Text style={styles.feedTime}>{formatTimeAgo(activity.timestamp)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.feedContent}>
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

              <Text style={styles.feedTitle}>{activity.title}</Text>

              <View style={styles.feedDetails}>
                {activity.type === 'workout' && (
                  <>
                    {activity.data?.duration > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Clock size={14} color={COLORS.textMuted} />
                        <Text style={styles.feedDetailText}>{activity.data.duration} min</Text>
                      </View>
                    )}
                    {activity.data?.exercises > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.exercises} exercises</Text>
                      </View>
                    )}
                    {activity.data?.sets > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.sets} sets</Text>
                      </View>
                    )}
                    {activity.data?.reps > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.reps} reps</Text>
                      </View>
                    )}
                    {activity.data?.volume > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>
                          {activity.data.volume >= 1000
                            ? `${(activity.data.volume / 1000).toFixed(1)}K ${weightUnit}`
                            : `${activity.data.volume} ${weightUnit}`}
                        </Text>
                      </View>
                    )}
                    {activity.data?.rating > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
                        <Text style={styles.feedDetailText}>{activity.data.rating}</Text>
                      </View>
                    )}
                  </>
                )}
                {activity.type === 'pr' && (
                  <>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailHighlight}>{weightUnit === 'lbs' ? Math.round(activity.data?.weight * 2.205) : activity.data?.weight} {weightUnit}</Text>
                    </View>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailText}>{'\u00d7'} {activity.data?.reps} reps</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderActivityFeed = () => (
    <>
      {/* Suggested Users Section - Always show */}
      <View style={styles.suggestedSection}>
        <View style={styles.suggestedHeader}>
          <Text style={styles.suggestedTitle}>Suggested for you</Text>
          <TouchableOpacity onPress={() => setActiveTab('discover')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {suggestedUsers.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestedScroll}
            contentContainerStyle={styles.suggestedScrollContent}
          >
            {suggestedUsers.map((suggestedUser) => (
              <TouchableOpacity key={suggestedUser.id} style={styles.suggestedCard} onPress={() => navigation.navigate('PublicProfile', { userId: suggestedUser.id, username: suggestedUser.username, name: suggestedUser.name })} activeOpacity={0.7}>
                <View style={styles.suggestedAvatar}>
                  {suggestedUser.avatar ? (
                    <Image source={{ uri: suggestedUser.avatar }} style={styles.suggestedAvatarImage} />
                  ) : (
                    <Text style={styles.suggestedAvatarText}>
                      {suggestedUser.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <Text style={styles.suggestedName} numberOfLines={1}>
                  {suggestedUser.name || suggestedUser.username}
                </Text>
                <Text style={styles.suggestedUsername} numberOfLines={1}>
                  @{suggestedUser.username}
                </Text>
                <Text style={styles.suggestedFollowers}>
                  {suggestedUser.followers || 0} followers
                </Text>
                <TouchableOpacity
                  style={[
                    styles.suggestedFollowBtn,
                    (followingIds.has(suggestedUser.id) || pendingIds.has(suggestedUser.id)) && styles.suggestedFollowingBtn,
                  ]}
                  onPress={() => handleFollowUser(suggestedUser.id)}
                >
                  <Text style={[
                    styles.suggestedFollowBtnText,
                    (followingIds.has(suggestedUser.id) || pendingIds.has(suggestedUser.id)) && styles.suggestedFollowingBtnText,
                  ]}>
                    {followingIds.has(suggestedUser.id) ? 'Following' : pendingIds.has(suggestedUser.id) ? 'Requested' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noSuggestionsRow}>
            <UserPlus size={20} color={COLORS.textMuted} />
            <Text style={styles.noSuggestionsText}>
              Go to Discover to find people to follow
            </Text>
          </View>
        )}
      </View>

      {/* Activity Feed */}
      <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
      {activityFeed.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyStateTitle}>No activity yet</Text>
          <Text style={styles.emptyStateText}>
            Follow friends to see their workouts and PRs here
          </Text>
          <TouchableOpacity
            style={styles.discoverBtn}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={styles.discoverBtnText}>Find People to Follow</Text>
          </TouchableOpacity>
        </View>
      ) : (
        activityFeed.map((activity) => (
          <View key={activity.id} style={styles.feedCard}>
            {/* Header with avatar and username */}
            <View style={styles.feedHeader}>
              <TouchableOpacity style={styles.feedUserRow} onPress={() => navigation.navigate('PublicProfile', { userId: activity.userId, username: activity.profile?.username })}>
                <View style={[
                  styles.feedAvatar,
                  activity.type === 'pr' && styles.feedAvatarPR,
                ]}>
                  {activity.profile?.avatar_url ? (
                    <Image source={{ uri: activity.profile.avatar_url }} style={styles.feedAvatarImage} />
                  ) : (
                    <Text style={styles.feedAvatarText}>
                      {activity.profile?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.feedUserInfo}>
                  <Text style={styles.feedUsername}>
                    @{activity.profile?.username || 'user'}
                  </Text>
                  <Text style={styles.feedTime}>{formatTimeAgo(activity.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Activity Content */}
            <View style={styles.feedContent}>
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
                {activity.type === 'workout' && (
                  <>
                    {activity.data?.duration > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Clock size={14} color={COLORS.textMuted} />
                        <Text style={styles.feedDetailText}>{activity.data.duration} min</Text>
                      </View>
                    )}
                    {activity.data?.exercises > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.exercises} exercises</Text>
                      </View>
                    )}
                    {activity.data?.sets > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.sets} sets</Text>
                      </View>
                    )}
                    {activity.data?.reps > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.reps} reps</Text>
                      </View>
                    )}
                    {activity.data?.volume > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>
                          {activity.data.volume >= 1000
                            ? `${(activity.data.volume / 1000).toFixed(1)}K ${weightUnit}`
                            : `${activity.data.volume} ${weightUnit}`}
                        </Text>
                      </View>
                    )}
                    {activity.data?.rating > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
                        <Text style={styles.feedDetailText}>{activity.data.rating}</Text>
                      </View>
                    )}
                  </>
                )}
                {activity.type === 'pr' && (
                  <>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailHighlight}>{weightUnit === 'lbs' ? Math.round(activity.data?.weight * 2.205) : activity.data?.weight} {weightUnit}</Text>
                    </View>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailText}>× {activity.data?.reps} reps</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Actions Row */}
            <View style={styles.feedActions}>
              <TouchableOpacity
                style={styles.feedActionBtn}
                onPress={() => handleLikeActivity(activity.activityId)}
              >
                <Heart
                  size={22}
                  color={userLikes[activity.activityId] ? COLORS.error : COLORS.textSecondary}
                  fill={userLikes[activity.activityId] ? COLORS.error : 'none'}
                />
                {activity.likes > 0 && (
                  <Text style={[
                    styles.feedActionText,
                    userLikes[activity.activityId] && styles.feedActionTextActive,
                  ]}>
                    {activity.likes}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedActionBtn}>
                <MessageCircle size={22} color={COLORS.textSecondary} />
                {activity.comments > 0 && (
                  <Text style={styles.feedActionText}>{activity.comments}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedActionBtn}>
                <Share2 size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderCommunityWorkouts = () => (
    <>
      {/* Share Your Workout Button */}
      <TouchableOpacity
        style={styles.shareWorkoutBtn}
        onPress={handleShareWorkout}
        onClick={handleShareWorkout}
      >
        <Share2 size={20} color={COLORS.textOnPrimary} />
        <Text style={styles.shareWorkoutBtnText}>Share Your Workout</Text>
      </TouchableOpacity>

      {/* Sort Buttons */}
      <View style={styles.sortRow}>
        {['popular', 'rating', 'newest'].map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortButton, workoutSort === sort && styles.sortButtonActive]}
            onPress={() => setWorkoutSort(sort)}
          >
            <Text style={[styles.sortButtonText, workoutSort === sort && styles.sortButtonTextActive]}>
              {sort === 'popular' ? 'Most Popular' : sort === 'rating' ? 'Top Rated' : 'Newest'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      <TouchableOpacity style={styles.filtersBtn} onPress={() => setShowFiltersModal(true)}>
        <Filter size={16} color={COLORS.textMuted} />
        <Text style={styles.filtersBtnText}>Filters</Text>
        <ChevronDown size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* My Rep-ertoire Button */}
      <TouchableOpacity style={styles.repertoireBtn} onPress={handleOpenRepertoire}>
        <FileText size={20} color={COLORS.warning} />
        <Text style={styles.repertoireBtnText}>My Rep-ertoire</Text>
      </TouchableOpacity>

      {/* Community Workouts Section */}
      <Text style={styles.sectionLabel}>COMMUNITY WORKOUTS</Text>

      {communityWorkouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Dumbbell size={48} color={COLORS.primary} />
          <Text style={styles.emptyStateTitle}>No community workouts yet</Text>
          <Text style={styles.emptyStateText}>Be the first to share a workout!</Text>
        </View>
      ) : (
        communityWorkouts.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={[styles.workoutIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Dumbbell size={18} color={COLORS.primary} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutMeta}>
                  by @{workout.creator?.username || workout.creator_username || 'unknown'} • {workout.exercises?.length || workout.exercise_count || 0} exercises
                </Text>
              </View>
            </View>

            <View style={styles.workoutStats}>
              <View style={styles.workoutStat}>
                <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
                <Text style={styles.workoutStatText}>
                  {(workout.average_rating || 0).toFixed(1)}
                </Text>
              </View>
              <View style={styles.workoutStat}>
                <Users size={14} color={COLORS.textMuted} />
                <Text style={styles.workoutStatText}>
                  {workout.completion_count || 0}
                </Text>
              </View>
              <View style={styles.workoutStat}>
                <Clock size={14} color={COLORS.textMuted} />
                <Text style={styles.workoutStatText}>
                  {getDurationRange(workout) || '—'}
                </Text>
              </View>
            </View>

            <WorkoutExercisePreview exercises={workout.exercises} COLORS={COLORS} />

            <View style={styles.workoutActions}>
              <TouchableOpacity
                style={[styles.saveButton, savedWorkoutIds.has(workout.id) && styles.saveButtonActive]}
                onPress={() => handleSaveWorkout(workout.id)}
              >
                <Text style={[styles.saveButtonText, savedWorkoutIds.has(workout.id) && styles.saveButtonTextActive]}>
                  {savedWorkoutIds.has(workout.id) ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startButton} onPress={() => handleStartCommunityWorkout(workout)}>
                <Text style={styles.startButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderFollowers = () => (
    <>
      {/* Find Users Button */}
      <TouchableOpacity
        style={styles.findUsersBtn}
        onPress={() => setActiveTab('discover')}
      >
        <Plus size={20} color={COLORS.textOnPrimary} />
        <Text style={styles.findUsersBtnText}>Find Users to Follow</Text>
      </TouchableOpacity>

      {/* Follow Requests Section */}
      {pendingRequests.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>FOLLOW REQUESTS ({pendingRequests.length})</Text>
          {pendingRequests.map((request) => {
            const reqProfile = request.requester;
            return (
              <View key={request.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  {reqProfile?.avatar_url ? (
                    <Image source={{ uri: reqProfile.avatar_url }} style={styles.userAvatarImage} />
                  ) : (
                    <Text style={styles.userAvatarText}>
                      {reqProfile?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>@{reqProfile?.username || 'user'}</Text>
                  <Text style={styles.userBio}>
                    {reqProfile?.first_name || ''} {reqProfile?.last_name || ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectRequest(request)}
                  >
                    <Text style={styles.rejectButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Followers Section */}
      <Text style={styles.sectionLabel}>FOLLOWERS ({followers.length})</Text>

      {followers.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <UserPlus size={48} color={COLORS.primary} />
          <Text style={styles.emptyStateCardTitle}>No followers yet</Text>
          <Text style={styles.emptyStateCardText}>
            Share your profile and workouts to gain followers!
          </Text>
          <TouchableOpacity
            style={styles.discoverBtn}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={styles.discoverBtnText}>Share Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        followers.map((item) => {
          const userProfile = item.follower;
          const userId = item.follower_id;
          const isFollowingUser = followingIds.has(userId);
          const isPendingUser = pendingIds.has(userId);

          return (
            <View key={item.id} style={styles.userCard}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => navigation.navigate('PublicProfile', { userId, username: userProfile?.username })}>
                <View style={styles.userAvatar}>
                  {userProfile?.avatar_url ? (
                    <Image source={{ uri: userProfile.avatar_url }} style={styles.userAvatarImage} />
                  ) : (
                    <Text style={styles.userAvatarText}>
                      {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>@{userProfile?.username || 'user'}</Text>
                  {userProfile?.bio && (
                    <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followButton, (isFollowingUser || isPendingUser) && styles.followingButton]}
                onPress={() => handleFollowUser(userId)}
              >
                {isFollowingUser ? (
                  <UserCheck size={16} color={COLORS.text} />
                ) : isPendingUser ? (
                  <Clock size={16} color={COLORS.text} />
                ) : (
                  <UserPlus size={16} color={COLORS.textOnPrimary} />
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </>
  );

  const renderFollowing = () => {
    return (
      <>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={followingSearchQuery}
            onChangeText={(text) => {
              setFollowingSearchQuery(text);
              if (!text.trim()) {
                setFollowingSearchResults([]);
              }
            }}
            placeholder="Search for users..."
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={searchUsersFromFollowing}
            returnKeyType="search"
          />
        </View>

        {/* Search Results */}
        {followingSearchResults.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
            {followingSearchResults.map((userProfile) => {
              const isFollowingUser = followingIds.has(userProfile.id);
              const isPendingUser = pendingIds.has(userProfile.id);
              return (
                <View key={userProfile.id} style={styles.userCard}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => navigation.navigate('PublicProfile', { userId: userProfile.id, username: userProfile.username })}>
                    <View style={styles.userAvatar}>
                      {userProfile.avatar_url ? (
                        <Image source={{ uri: userProfile.avatar_url }} style={styles.userAvatarImage} />
                      ) : (
                        <Text style={styles.userAvatarText}>
                          {userProfile.username?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>@{userProfile.username || 'user'}</Text>
                      {userProfile.bio && (
                        <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.followButton, (isFollowingUser || isPendingUser) && styles.followingButton]}
                    onPress={() => handleFollowUser(userProfile.id)}
                  >
                    {isFollowingUser ? (
                      <UserCheck size={16} color={COLORS.text} />
                    ) : isPendingUser ? (
                      <Clock size={16} color={COLORS.text} />
                    ) : (
                      <UserPlus size={16} color={COLORS.textOnPrimary} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Following Section */}
        <Text style={styles.sectionLabel}>FOLLOWING ({following.length})</Text>

        {following.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <UserPlus size={48} color={COLORS.primary} />
            <Text style={styles.emptyStateCardTitle}>Not following anyone yet</Text>
            <Text style={styles.emptyStateCardText}>
              Search for users above or discover top athletes to follow!
            </Text>
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => setActiveTab('discover')}
            >
              <Text style={styles.discoverBtnText}>Discover People</Text>
            </TouchableOpacity>
          </View>
        ) : (
          following.map((item) => {
            const userProfile = item.following;
            const userId = item.following_id;
            const isFollowingUser = followingIds.has(userId);

            return (
              <View key={item.id} style={styles.userCard}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => navigation.navigate('PublicProfile', { userId, username: userProfile?.username })}>
                  <View style={styles.userAvatar}>
                    {userProfile?.avatar_url ? (
                      <Image source={{ uri: userProfile.avatar_url }} style={styles.userAvatarImage} />
                    ) : (
                      <Text style={styles.userAvatarText}>
                        {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>@{userProfile?.username || 'user'}</Text>
                    {userProfile?.bio && (
                      <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.followButton, isFollowingUser && styles.followingButton]}
                  onPress={() => handleFollowUser(userId)}
                >
                  <UserCheck size={16} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </>
    );
  };

  const renderDiscover = () => (
    <>
      {/* Search Users */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for users..."
          placeholderTextColor={COLORS.textMuted}
          onSubmitEditing={searchUsers}
          returnKeyType="search"
        />
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
          {searchResults.map((userProfile) => {
            const isFollowingUser = followingIds.has(userProfile.id);
            const isPendingUser = pendingIds.has(userProfile.id);
            return (
              <View key={userProfile.id} style={styles.userCard}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => navigation.navigate('PublicProfile', { userId: userProfile.id, username: userProfile.username })}>
                  <View style={styles.userAvatar}>
                    {userProfile.avatar_url ? (
                      <Image source={{ uri: userProfile.avatar_url }} style={styles.userAvatarImage} />
                    ) : (
                      <Text style={styles.userAvatarText}>
                        {userProfile.username?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>@{userProfile.username || 'user'}</Text>
                    {userProfile.bio && (
                      <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.followButton, (isFollowingUser || isPendingUser) && styles.followingButton]}
                  onPress={() => handleFollowUser(userProfile.id)}
                >
                  {isFollowingUser ? (
                    <UserCheck size={16} color={COLORS.text} />
                  ) : isPendingUser ? (
                    <Clock size={16} color={COLORS.text} />
                  ) : (
                    <UserPlus size={16} color={COLORS.textOnPrimary} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </>
      )}

      {/* No Results Message */}
      {searchStatus === 'no_results' && (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Search size={32} color={COLORS.textMuted} />
          <Text style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 8 }}>
            No users found for "{searchQuery}"
          </Text>
        </View>
      )}

      {/* TOP FOLLOWED Section */}
      <Text style={styles.sectionLabel}>TOP FOLLOWED</Text>

      {/* Period Filter */}
      <View style={styles.periodFilterRow}>
        {[
          { id: 'all', label: 'All Time' },
          { id: '7d', label: '7 Days' },
          { id: '14d', label: '14 Days' },
          { id: '31d', label: '31 Days' },
        ].map((period) => (
          <TouchableOpacity
            key={period.id}
            style={[styles.periodFilterBtn, discoverPeriod === period.id && styles.periodFilterBtnActive]}
            onPress={() => setDiscoverPeriod(period.id)}
          >
            <Text style={[styles.periodFilterText, discoverPeriod === period.id && styles.periodFilterTextActive]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leaderboard Coming Soon */}
      <View style={styles.emptyStateCard}>
        <Trophy size={48} color={COLORS.primary} />
        <Text style={styles.emptyStateCardTitle}>Leaderboard Coming Soon</Text>
        <Text style={styles.emptyStateCardText}>
          Follow others and build your network - top creators will appear here!
        </Text>
      </View>
    </>
  );

  const renderChallenges = () => (
    <>
      {/* YOUR CHALLENGES Section */}
      <Text style={styles.sectionLabel}>YOUR CHALLENGES</Text>

      {challenges.length === 0 ? (
        <>
          {/* JOIN A CHALLENGE Section */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>JOIN A CHALLENGE</Text>

          {/* Create New Challenge Button */}
          <TouchableOpacity
            style={styles.createChallengeDashedBtn}
            onPress={() => setShowCreateChallenge(true)}
          >
            <Plus size={20} color={COLORS.textMuted} />
            <Text style={styles.createChallengeDashedText}>Create New Challenge</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {challenges.map((challenge) => (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={[styles.challengeIcon, { backgroundColor: COLORS.warning + '20' }]}>
                  <Trophy size={20} color={COLORS.warning} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeName}>{challenge.name}</Text>
                  <Text style={styles.challengeMeta}>
                    {challenge.participant_count || 0} participants
                  </Text>
                </View>
              </View>

              {challenge.goal_type && (
                <View style={styles.challengeGoal}>
                  <Target size={14} color={COLORS.primary} />
                  <Text style={styles.challengeGoalText}>
                    {challenge.goal_type === 'workouts' && `${challenge.goal_value} workouts`}
                    {challenge.goal_type === 'duration' && `${challenge.goal_value} min`}
                    {challenge.goal_type === 'streak' && `${challenge.goal_value} day streak`}
                  </Text>
                </View>
              )}

              <View style={styles.challengeProgress}>
                <View style={styles.challengeProgressBar}>
                  <View
                    style={[
                      styles.challengeProgressFill,
                      { width: `${Math.min((challenge.user_progress || 0) / (challenge.goal_value || 1) * 100, 100)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.challengeProgressText}>
                  {challenge.user_progress || 0}/{challenge.goal_value || 0}
                </Text>
              </View>
            </View>
          ))}

          {/* JOIN A CHALLENGE Section */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>JOIN A CHALLENGE</Text>

          {/* Create New Challenge Button */}
          <TouchableOpacity
            style={styles.createChallengeDashedBtn}
            onPress={() => setShowCreateChallenge(true)}
          >
            <Plus size={20} color={COLORS.textMuted} />
            <Text style={styles.createChallengeDashedText}>Create New Challenge</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );

  // Combined Community tab - all content in one scrollable view
  const renderCommunity = () => (
    <>
      {/* Search Users */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for users..."
          placeholderTextColor={COLORS.textMuted}
          onSubmitEditing={searchUsers}
          returnKeyType="search"
        />
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
          {searchResults.map((userProfile) => {
            const isFollowingUser = followingIds.has(userProfile.id);
            const isPendingUser = pendingIds.has(userProfile.id);
            return (
              <View key={userProfile.id} style={styles.userCard}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => navigation.navigate('PublicProfile', { userId: userProfile.id, username: userProfile.username })}>
                  <View style={styles.userAvatar}>
                    {userProfile.avatar_url ? (
                      <Image source={{ uri: userProfile.avatar_url }} style={styles.userAvatarImage} />
                    ) : (
                      <Text style={styles.userAvatarText}>
                        {userProfile.username?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>@{userProfile.username || 'user'}</Text>
                    {userProfile.bio && (
                      <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.followButton, (isFollowingUser || isPendingUser) && styles.followingButton]}
                  onPress={() => handleFollowUser(userProfile.id)}
                >
                  {isFollowingUser ? (
                    <UserCheck size={16} color={COLORS.text} />
                  ) : isPendingUser ? (
                    <Clock size={16} color={COLORS.text} />
                  ) : (
                    <UserPlus size={16} color={COLORS.textOnPrimary} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </>
      )}

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && !searchQuery && (
        <View style={styles.suggestedSection}>
          <Text style={styles.sectionLabel}>SUGGESTED FOR YOU</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestedScroll}
            contentContainerStyle={styles.suggestedScrollContent}
          >
            {suggestedUsers.map((suggestedUser) => (
              <TouchableOpacity key={suggestedUser.id} style={styles.suggestedCard} onPress={() => navigation.navigate('PublicProfile', { userId: suggestedUser.id, username: suggestedUser.username, name: suggestedUser.name, timeOnApp: suggestedUser.timeOnApp, workoutCount: suggestedUser.workoutCount })} activeOpacity={0.7}>
                <View style={styles.suggestedAvatar}>
                  {suggestedUser.avatar ? (
                    <Image source={{ uri: suggestedUser.avatar }} style={styles.suggestedAvatarImage} />
                  ) : (
                    <Text style={styles.suggestedAvatarText}>
                      {suggestedUser.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <Text style={styles.suggestedName} numberOfLines={1}>
                  {suggestedUser.name || suggestedUser.username}
                </Text>
                <Text style={styles.suggestedUsername} numberOfLines={1}>
                  @{suggestedUser.username}
                </Text>
                <View style={styles.suggestedStats}>
                  <Text style={styles.suggestedStatText}>{suggestedUser.workoutCount || 0} workouts</Text>
                  <Text style={styles.suggestedStatDot}>•</Text>
                  <Text style={styles.suggestedStatText}>{suggestedUser.timeOnApp || 'New'}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.suggestedFollowBtn,
                    (followingIds.has(suggestedUser.id) || pendingIds.has(suggestedUser.id)) && styles.suggestedFollowingBtn,
                  ]}
                  onPress={() => handleFollowUser(suggestedUser.id)}
                >
                  <Text style={[
                    styles.suggestedFollowBtnText,
                    (followingIds.has(suggestedUser.id) || pendingIds.has(suggestedUser.id)) && styles.suggestedFollowingBtnText,
                  ]}>
                    {followingIds.has(suggestedUser.id) ? 'Following' : pendingIds.has(suggestedUser.id) ? 'Requested' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Activity Feed */}
      <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
      {activityFeed.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateCardTitle}>No activity yet</Text>
          <Text style={styles.emptyStateCardText}>
            Follow friends to see their workouts and PRs here
          </Text>
        </View>
      ) : (
        <>
          {activityFeed.slice(0, feedLimit).map((activity) => (
            <FeedCard key={activity.id} activity={activity} weightUnit={weightUnit} navigation={navigation} />
          ))}
          {activityFeed.length > feedLimit && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() => setFeedLimit(prev => prev + 5)}
            >
              <Text style={styles.loadMoreText}>Load more ({activityFeed.length - feedLimit} remaining)</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Community Workouts */}
      <View style={{ marginTop: 16 }}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>COMMUNITY WORKOUTS</Text>
          <TouchableOpacity style={styles.repertoireBtnSmall} onPress={handleOpenRepertoire}>
            <Text style={styles.repertoireBtnSmallText}>My Rep-ertoire</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.shareWorkoutBtn}
          onPress={handleShareWorkout}
        >
          <Text style={styles.shareWorkoutBtnText}>Share Your Workout</Text>
        </TouchableOpacity>

        {communityWorkouts.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateCardTitle}>No community workouts yet</Text>
            <Text style={styles.emptyStateCardText}>Be the first to share a workout!</Text>
          </View>
        ) : (
          communityWorkouts.slice(0, 3).map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.workoutInfo, { flex: 1 }]}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutMeta}>
                    by @{workout.creator?.username || workout.creator_username || 'unknown'} • {workout.exercises?.length || workout.exercise_count || 0} exercises{getDurationRange(workout) ? ` • ${getDurationRange(workout)}` : ''}
                  </Text>
                </View>
                {workout.creator_id === user?.id && (
                  <TouchableOpacity
                    onPress={() => handleDeletePublishedWorkout(workout.id)}
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.workoutStats}>
                <Text style={styles.workoutStatText}>{(workout.average_rating || 0).toFixed(1)} rating • {workout.completion_count || 0} completions</Text>
              </View>
              <WorkoutExercisePreview exercises={workout.exercises} COLORS={COLORS} />

              <View style={styles.workoutActions}>
                <TouchableOpacity
                  style={[styles.saveButton, savedWorkoutIds.has(workout.id) && styles.saveButtonActive]}
                  onPress={() => handleSaveWorkout(workout.id)}
                >
                  <Text style={[styles.saveButtonText, savedWorkoutIds.has(workout.id) && styles.saveButtonTextActive]}>
                    {savedWorkoutIds.has(workout.id) ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.startButton} onPress={() => handleStartCommunityWorkout(workout)}>
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Challenges */}
      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionLabel}>CHALLENGES</Text>
        {challenges.length === 0 ? (
          <TouchableOpacity
            style={styles.createChallengeDashedBtn}
            onPress={() => setShowCreateChallenge(true)}
          >
            <Text style={styles.createChallengeDashedText}>+ Create New Challenge</Text>
          </TouchableOpacity>
        ) : (
          <>
            {challenges.slice(0, 3).map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                style={styles.challengeCard}
                onPress={() => handleOpenChallengeDetail(challenge)}
                activeOpacity={0.7}
              >
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeName}>{challenge.name}</Text>
                  <Text style={styles.challengeGoalText}>
                    {challenge.goal_type === 'workouts' && `Complete ${challenge.goal_value} workouts`}
                    {challenge.goal_type === 'streak' && `${challenge.goal_value} day streak`}
                    {challenge.goal_type === 'volume' && `Lift ${challenge.goal_value?.toLocaleString()} kg`}
                    {challenge.goal_type === 'reps' && `Complete ${challenge.goal_value?.toLocaleString()} reps`}
                  </Text>
                  <Text style={styles.challengeMeta}>
                    {challenge.participant_count || 0} participants
                  </Text>
                </View>
                <View style={styles.challengeProgress}>
                  <View style={styles.challengeProgressBar}>
                    <View
                      style={[
                        styles.challengeProgressFill,
                        { width: `${Math.min((challenge.user_progress || 0) / (challenge.goal_value || 1) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.challengeProgressText}>
                    {challenge.user_progress || 0}/{challenge.goal_value || 0}
                  </Text>
                </View>
                <Text style={styles.challengeTapHint}>Tap to view details</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.createChallengeDashedBtn}
              onPress={() => setShowCreateChallenge(true)}
            >
              <Text style={styles.createChallengeDashedText}>+ Create New Challenge</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </>
  );

  // Profile tab with followers/following modals
  const renderProfile = () => (
    <>
      {/* Profile Header */}
      <View style={styles.myProfileHeader}>
        <View style={styles.myProfileAvatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.myProfileAvatarImage} />
          ) : (
            <View style={styles.myProfileAvatarFallback}>
              <Text style={styles.myProfileAvatarText}>
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.myProfileName}>
          {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile?.username || 'User'}
        </Text>
        <Text style={styles.myProfileUsername}>@{profile?.username || 'user'}</Text>
        <View style={styles.myProfileStats}>
          <TouchableOpacity style={styles.myProfileStat} onPress={() => { setFollowModalTab('followers'); setShowFollowModal(true); }}>
            <Text style={styles.myProfileStatCount}>{myFollowerCount}</Text>
            <Text style={styles.myProfileStatLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.myProfileStat} onPress={() => { setFollowModalTab('following'); setShowFollowModal(true); }}>
            <Text style={styles.myProfileStatCount}>{myFollowingCount}</Text>
            <Text style={styles.myProfileStatLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Follow Requests */}
      {pendingRequests.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>FOLLOW REQUESTS ({pendingRequests.length})</Text>
          {pendingRequests.map((request) => {
            const reqProfile = request.requester;
            return (
              <View key={request.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  {reqProfile?.avatar_url ? (
                    <Image source={{ uri: reqProfile.avatar_url }} style={styles.userAvatarImage} />
                  ) : (
                    <Text style={styles.userAvatarText}>
                      {reqProfile?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>@{reqProfile?.username || 'user'}</Text>
                  <Text style={styles.userBio}>
                    {reqProfile?.first_name || ''} {reqProfile?.last_name || ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectRequest(request)}
                  >
                    <Text style={styles.rejectButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* My Activity */}
      <Text style={styles.sectionLabel}>MY ACTIVITY</Text>
      {myActivityLoading ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateCardText}>Loading...</Text>
        </View>
      ) : myActivity.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateCardTitle}>No activity yet</Text>
          <Text style={styles.emptyStateCardText}>
            Complete a workout or set a PR to see your activity here
          </Text>
        </View>
      ) : (
        myActivity.map((activity) => (
          <View key={activity.id} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <View style={styles.feedUserRow}>
                <View style={[
                  styles.feedAvatar,
                  activity.type === 'pr' && styles.feedAvatarPR,
                ]}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.feedAvatarImage} />
                  ) : (
                    <Text style={styles.feedAvatarText}>
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.feedUserInfo}>
                  <Text style={styles.feedUsername}>@{profile?.username || 'user'}</Text>
                  <Text style={styles.feedTime}>{formatTimeAgo(activity.timestamp)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.feedContent}>
              <View style={[
                styles.feedTypeBadge,
                activity.type === 'pr' ? styles.feedTypeBadgePR : styles.feedTypeBadgeWorkout,
              ]}>
                <Text style={[
                  styles.feedTypeBadgeText,
                  activity.type === 'pr' ? styles.feedTypeBadgeTextPR : styles.feedTypeBadgeTextWorkout,
                ]}>
                  {activity.type === 'pr' ? 'Personal Record' : 'Completed Workout'}
                </Text>
              </View>
              <Text style={styles.feedTitle}>{activity.title}</Text>
              <View style={styles.feedDetails}>
                {activity.type === 'workout' && (
                  <>
                    {activity.data?.duration > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Clock size={14} color={COLORS.textMuted} />
                        <Text style={styles.feedDetailText}>{activity.data.duration} min</Text>
                      </View>
                    )}
                    {activity.data?.exercises > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.exercises} exercises</Text>
                      </View>
                    )}
                    {activity.data?.sets > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.sets} sets</Text>
                      </View>
                    )}
                    {activity.data?.reps > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>{activity.data.reps} reps</Text>
                      </View>
                    )}
                    {activity.data?.volume > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Text style={styles.feedDetailText}>
                          {activity.data.volume >= 1000
                            ? `${(activity.data.volume / 1000).toFixed(1)}K ${weightUnit}`
                            : `${activity.data.volume} ${weightUnit}`}
                        </Text>
                      </View>
                    )}
                    {activity.data?.rating > 0 && (
                      <View style={styles.feedDetailItem}>
                        <Star size={14} color={COLORS.warning} fill={COLORS.warning} />
                        <Text style={styles.feedDetailText}>{activity.data.rating}</Text>
                      </View>
                    )}
                  </>
                )}
                {activity.type === 'pr' && (
                  <>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailHighlight}>{weightUnit === 'lbs' ? Math.round(activity.data?.weight * 2.205) : activity.data?.weight} {weightUnit}</Text>
                    </View>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailText}>{'\u00d7'} {activity.data?.reps} reps</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }]}>
          {pendingRequests.length > 0 && (
            <TouchableOpacity
              onPress={() => setActiveTab('profile')}
              style={styles.requestsBadge}
            >
              <Text style={styles.requestsBadgeText}>
                {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabLarge, activeTab === tab.id && styles.tabLargeActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabLargeText, activeTab === tab.id && styles.tabLargeTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {activeTab === 'community' && renderCommunity()}
          {activeTab === 'profile' && renderProfile()}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Share Workout Modal */}
      {showShareModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.shareModal}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share a Workout</Text>
              <TouchableOpacity
                onPress={() => { setShowShareModal(false); setPreviewWorkout(null); }}
                style={styles.shareModalClose}
              >
                <Text style={styles.shareModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.shareModalSubtitle}>
              Select a workout to share with the community
            </Text>

            {previewWorkout ? (
              <ScrollView style={styles.shareModalList}>
                <View style={styles.previewHeader}>
                  <TouchableOpacity onPress={() => setPreviewWorkout(null)}>
                    <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.shareWorkoutName}>{previewWorkout.name}</Text>
                  <Text style={styles.shareWorkoutMeta}>
                    {previewWorkout.date} • {previewWorkout.duration} min
                  </Text>
                </View>
                {previewWorkout.exerciseDetails.map((exercise, idx) => (
                  <View key={idx} style={styles.previewExercise}>
                    <Text style={styles.previewExerciseName}>{exercise.name}</Text>
                    <View style={styles.previewSets}>
                      {exercise.sets.map((s, i) => (
                        <View key={i} style={styles.previewSetPill}>
                          <Text style={styles.previewSetText}>
                            {s.weight}{weightUnit} × {s.reps}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.confirmShareBtn} onPress={handleConfirmShare}>
                  <Share2 size={18} color={COLORS.textOnPrimary} />
                  <Text style={styles.confirmShareBtnText}>Share Workout</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : loadingWorkouts ? (
              <View style={styles.shareModalLoading}>
                <Text style={styles.shareModalLoadingText}>Loading workouts...</Text>
              </View>
            ) : recentWorkouts.length === 0 ? (
              <View style={styles.shareModalEmpty}>
                <Dumbbell size={40} color={COLORS.textMuted} />
                <Text style={styles.shareModalEmptyText}>No completed workouts yet</Text>
                <Text style={styles.shareModalEmptySubtext}>
                  Complete a workout to share it with the community
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.shareModalList}>
                {recentWorkouts.map((workout) => (
                  <TouchableOpacity
                    key={workout.id}
                    style={styles.shareWorkoutItem}
                    onPress={() => handlePreviewWorkout(workout)}
                  >
                    <View style={styles.shareWorkoutIcon}>
                      <Dumbbell size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.shareWorkoutInfo}>
                      <Text style={styles.shareWorkoutName}>{workout.name}</Text>
                      <Text style={styles.shareWorkoutMeta}>
                        {workout.date} • {workout.duration} min • {workout.exercises} exercises
                      </Text>
                    </View>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.shareModalCancelBtn}
              onPress={() => { setShowShareModal(false); setPreviewWorkout(null); }}
            >
              <Text style={styles.shareModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filters Modal */}
      {showFiltersModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.filtersModal}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Filter Workouts</Text>
              <TouchableOpacity
                onPress={() => setShowFiltersModal(false)}
                style={styles.shareModalClose}
              >
                <Text style={styles.shareModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>MUSCLE GROUP</Text>
            <View style={styles.filterOptions}>
              {['all', 'chest', 'back', 'shoulders', 'legs', 'arms', 'core'].map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[styles.filterChip, muscleGroupFilter === group && styles.filterChipActive]}
                  onPress={() => setMuscleGroupFilter(group)}
                >
                  <Text style={[styles.filterChipText, muscleGroupFilter === group && styles.filterChipTextActive]}>
                    {group === 'all' ? 'All' : group.charAt(0).toUpperCase() + group.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>DIFFICULTY</Text>
            <View style={styles.filterOptions}>
              {['all', 'beginner', 'intermediate', 'advanced'].map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[styles.filterChip, difficultyFilter === diff && styles.filterChipActive]}
                  onPress={() => setDifficultyFilter(diff)}
                >
                  <Text style={[styles.filterChipText, difficultyFilter === diff && styles.filterChipTextActive]}>
                    {diff === 'all' ? 'All' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyFiltersBtn} onPress={handleApplyFilters}>
              <Text style={styles.applyFiltersBtnText}>Apply Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareModalCancelBtn}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={styles.shareModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* My Rep-ertoire Modal */}
      {showRepertoireModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.shareModal}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>My Rep-ertoire</Text>
              <TouchableOpacity
                onPress={() => setShowRepertoireModal(false)}
                style={styles.shareModalClose}
              >
                <Text style={styles.shareModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.shareModalSubtitle}>
              Your saved workouts from the community
            </Text>

            {loadingRepertoire ? (
              <View style={styles.shareModalLoading}>
                <Text style={styles.shareModalLoadingText}>Loading saved workouts...</Text>
              </View>
            ) : savedWorkoutsWithDetails.length === 0 ? (
              <View style={styles.shareModalEmpty}>
                <FileText size={40} color={COLORS.textMuted} />
                <Text style={styles.shareModalEmptyText}>No saved workouts yet</Text>
                <Text style={styles.shareModalEmptySubtext}>
                  Save workouts from the community to build your Rep-ertoire
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.shareModalList}>
                {savedWorkoutsWithDetails.map((workout) => (
                  <TouchableOpacity
                    key={workout.id}
                    style={styles.shareWorkoutItem}
                    onPress={() => handleStartRepertoireWorkout(workout)}
                  >
                    <View style={styles.shareWorkoutIcon}>
                      <Dumbbell size={18} color={COLORS.warning} />
                    </View>
                    <View style={styles.shareWorkoutInfo}>
                      <Text style={styles.shareWorkoutName}>{workout.name}</Text>
                      <Text style={styles.shareWorkoutMeta}>
                        {workout.exercise_count || workout.exercises?.length || 0} exercises{getDurationRange(workout) ? ` • ${getDurationRange(workout)}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.shareModalCancelBtn}
              onPress={() => setShowRepertoireModal(false)}
            >
              <Text style={styles.shareModalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Followers/Following Modal */}
      <Modal
        visible={showFollowModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFollowModal(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.followModalHeader}>
            <TouchableOpacity onPress={() => setShowFollowModal(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.followModalTabs}>
              <TouchableOpacity
                style={[styles.followModalTab, followModalTab === 'followers' && styles.followModalTabActive]}
                onPress={() => setFollowModalTab('followers')}
              >
                <Text style={[styles.followModalTabText, followModalTab === 'followers' && styles.followModalTabTextActive]}>
                  Followers ({followers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followModalTab, followModalTab === 'following' && styles.followModalTabActive]}
                onPress={() => setFollowModalTab('following')}
              >
                <Text style={[styles.followModalTabText, followModalTab === 'following' && styles.followModalTabTextActive]}>
                  Following ({following.length})
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.followModalContent}>
            {followModalTab === 'followers' ? (
              followers.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateCardTitle}>No followers yet</Text>
                  <Text style={styles.emptyStateCardText}>Share your profile to gain followers!</Text>
                </View>
              ) : (
                followers.map((item) => {
                  const userProfile = item.follower;
                  const userId = item.follower_id;
                  const isFollowingUser = followingIds.has(userId);
                  const isPendingUser = pendingIds.has(userId);
                  return (
                    <View key={item.id} style={styles.userCard}>
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => { setShowFollowModal(false); navigation.navigate('PublicProfile', { userId, username: userProfile?.username }); }}>
                        <View style={styles.userAvatar}>
                          {userProfile?.avatar_url ? (
                            <Image source={{ uri: userProfile.avatar_url }} style={styles.userAvatarImage} />
                          ) : (
                            <Text style={styles.userAvatarText}>
                              {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                            </Text>
                          )}
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>@{userProfile?.username || 'user'}</Text>
                          {userProfile?.bio && (
                            <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.followButton, (isFollowingUser || isPendingUser) && styles.followingButton]}
                        onPress={() => handleFollowUser(userId)}
                      >
                        <Text style={[styles.followButtonText, (isFollowingUser || isPendingUser) && styles.followingButtonText]}>
                          {isFollowingUser ? 'Following' : isPendingUser ? 'Requested' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )
            ) : (
              following.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateCardTitle}>Not following anyone</Text>
                  <Text style={styles.emptyStateCardText}>Search for users to follow!</Text>
                </View>
              ) : (
                following.map((item) => {
                  const userProfile = item.following;
                  const userId = item.following_id;
                  return (
                    <View key={item.id} style={styles.userCard}>
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => { setShowFollowModal(false); navigation.navigate('PublicProfile', { userId, username: userProfile?.username }); }}>
                        <View style={styles.userAvatar}>
                          {userProfile?.avatar_url ? (
                            <Image source={{ uri: userProfile.avatar_url }} style={styles.userAvatarImage} />
                          ) : (
                            <Text style={styles.userAvatarText}>
                              {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                            </Text>
                          )}
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>@{userProfile?.username || 'user'}</Text>
                          {userProfile?.bio && (
                            <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.followButton, styles.followingButton]}
                        onPress={() => handleFollowUser(userId)}
                      >
                        <Text style={styles.followingButtonText}>Following</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Challenge Detail Modal */}
      <Modal
        visible={showChallengeDetail}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowChallengeDetail(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.followModalHeader}>
            <TouchableOpacity onPress={() => setShowChallengeDetail(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.challengeDetailTitle}>Challenge</Text>
            <View style={{ width: 50 }} />
          </View>

          {selectedChallenge && (
            <ScrollView style={styles.challengeDetailContent}>
              {/* Challenge Header */}
              <View style={styles.challengeDetailHeader}>
                <Text style={styles.challengeDetailName}>{selectedChallenge.name}</Text>
                <Text style={styles.challengeDetailGoal}>
                  {selectedChallenge.goal_type === 'workouts' && `Complete ${selectedChallenge.goal_value} workouts`}
                  {selectedChallenge.goal_type === 'streak' && `Maintain a ${selectedChallenge.goal_value} day streak`}
                  {selectedChallenge.goal_type === 'volume' && `Lift ${selectedChallenge.goal_value?.toLocaleString()} kg total`}
                  {selectedChallenge.goal_type === 'reps' && `Complete ${selectedChallenge.goal_value?.toLocaleString()} total reps`}
                </Text>
                <Text style={styles.challengeDetailParticipants}>
                  {selectedChallenge.participant_count || 0} participants
                </Text>
              </View>

              {/* Your Progress */}
              <View style={styles.challengeDetailSection}>
                <Text style={styles.challengeDetailSectionTitle}>YOUR PROGRESS</Text>
                <View style={styles.challengeDetailProgressCard}>
                  <View style={styles.challengeDetailProgressBar}>
                    <View
                      style={[
                        styles.challengeDetailProgressFill,
                        { width: `${Math.min((selectedChallenge.user_progress || 0) / (selectedChallenge.goal_value || 1) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.challengeDetailProgressText}>
                    {selectedChallenge.user_progress || 0} / {selectedChallenge.goal_value || 0}
                  </Text>
                  <Text style={styles.challengeDetailProgressPercent}>
                    {Math.round((selectedChallenge.user_progress || 0) / (selectedChallenge.goal_value || 1) * 100)}% complete
                  </Text>
                </View>
              </View>

              {/* Friends Participating */}
              {challengeParticipantsFromFollowing.length > 0 && (
                <View style={styles.challengeDetailSection}>
                  <Text style={styles.challengeDetailSectionTitle}>FRIENDS IN THIS CHALLENGE</Text>
                  <View style={styles.friendsRow}>
                    {challengeParticipantsFromFollowing.map((friend) => (
                      <View key={friend.id} style={styles.friendChip}>
                        <View style={styles.friendChipAvatar}>
                          {friend.avatar ? (
                            <Image source={{ uri: friend.avatar }} style={styles.friendChipAvatarImage} />
                          ) : (
                            <Text style={styles.friendChipAvatarText}>
                              {friend.username?.[0]?.toUpperCase() || 'U'}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.friendChipName}>@{friend.username}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Leaderboard */}
              <View style={styles.challengeDetailSection}>
                <Text style={styles.challengeDetailSectionTitle}>LEADERBOARD</Text>
                {challengeLeaderboard.map((participant, index) => (
                  <View
                    key={participant.id}
                    style={[
                      styles.leaderboardRow,
                      participant.isMe && styles.leaderboardRowMe,
                    ]}
                  >
                    <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                    <View style={styles.leaderboardAvatar}>
                      {participant.avatar ? (
                        <Image source={{ uri: participant.avatar }} style={styles.leaderboardAvatarImage} />
                      ) : (
                        <Text style={styles.leaderboardAvatarText}>
                          {participant.username?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.leaderboardInfo}>
                      <Text style={[styles.leaderboardName, participant.isMe && styles.leaderboardNameMe]}>
                        {participant.isMe ? 'You' : participant.name}
                      </Text>
                      <Text style={styles.leaderboardUsername}>@{participant.username}</Text>
                    </View>
                    <Text style={styles.leaderboardProgress}>{participant.progress}%</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Create Challenge Modal */}
      <Modal
        visible={showCreateChallenge}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateChallenge(false)}
      >
        <SafeAreaView style={styles.createChallengeModal}>
          {/* Header */}
          <View style={styles.createChallengeHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateChallenge(false);
                setNewChallenge({ name: '', type: 'workouts', duration: 7, invitedFriends: [], isGlobal: false });
              }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.createChallengeTitle}>Create Challenge</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.createChallengeContent}>
            {/* Challenge Name */}
            <View style={styles.createChallengeSection}>
              <Text style={styles.createChallengeSectionTitle}>Challenge Name</Text>
              <TextInput
                style={styles.createChallengeInput}
                value={newChallenge.name}
                onChangeText={(text) => setNewChallenge(prev => ({ ...prev, name: text }))}
                placeholder="e.g. January Grind, Push-up Masters"
                placeholderTextColor={COLORS.textMuted}
                maxLength={30}
              />
            </View>

            {/* Challenge Type */}
            <View style={styles.createChallengeSection}>
              <Text style={styles.createChallengeSectionTitle}>Challenge Type</Text>
              <View style={styles.challengeTypeGrid}>
                {[
                  { id: 'workouts', label: 'Most Workouts', icon: 'W', desc: 'Complete the most workouts' },
                  { id: 'streak', label: 'Longest Streak', icon: 'S', desc: 'Maintain the longest streak' },
                  { id: 'volume', label: 'Total Volume', icon: 'V', desc: 'Lift the most total weight' },
                  { id: 'reps', label: 'Total Reps', icon: 'R', desc: 'Complete the most reps' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.challengeTypeOption,
                      newChallenge.type === type.id && styles.challengeTypeOptionSelected,
                    ]}
                    onPress={() => setNewChallenge(prev => ({ ...prev, type: type.id }))}
                  >
                    <Text style={styles.challengeTypeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.challengeTypeLabel,
                      newChallenge.type === type.id && styles.challengeTypeLabelSelected,
                    ]}>{type.label}</Text>
                    <Text style={styles.challengeTypeDesc}>{type.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.createChallengeSection}>
              <Text style={styles.createChallengeSectionTitle}>Duration</Text>
              <View style={styles.durationRow}>
                {[
                  { days: 7, label: '1 Week' },
                  { days: 14, label: '2 Weeks' },
                  { days: 30, label: '1 Month' },
                  { days: 90, label: '3 Months' },
                ].map((duration) => (
                  <TouchableOpacity
                    key={duration.days}
                    style={[
                      styles.durationOption,
                      newChallenge.duration === duration.days && styles.durationOptionSelected,
                    ]}
                    onPress={() => setNewChallenge(prev => ({ ...prev, duration: duration.days }))}
                  >
                    <Text style={[
                      styles.durationLabel,
                      newChallenge.duration === duration.days && styles.durationLabelSelected,
                    ]}>{duration.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Visibility */}
            <View style={styles.createChallengeSection}>
              <Text style={styles.createChallengeSectionTitle}>Visibility</Text>
              <View style={styles.visibilityRow}>
                <TouchableOpacity
                  style={[styles.visibilityOption, !newChallenge.isGlobal && styles.visibilityOptionSelected]}
                  onPress={() => setNewChallenge(prev => ({ ...prev, isGlobal: false }))}
                >
                  <Text style={[styles.visibilityOptionText, !newChallenge.isGlobal && styles.visibilityOptionTextSelected]}>
                    Invite Only
                  </Text>
                  <Text style={styles.visibilityOptionDesc}>Only invited friends can join</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.visibilityOption, newChallenge.isGlobal && styles.visibilityOptionSelected]}
                  onPress={() => setNewChallenge(prev => ({ ...prev, isGlobal: true }))}
                >
                  <Text style={[styles.visibilityOptionText, newChallenge.isGlobal && styles.visibilityOptionTextSelected]}>
                    Global
                  </Text>
                  <Text style={styles.visibilityOptionDesc}>Anyone can discover and join</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Invite Friends */}
            {!newChallenge.isGlobal && (
            <View style={styles.createChallengeSection}>
              <Text style={styles.createChallengeSectionTitle}>Invite Friends</Text>
              {following.length === 0 ? (
                <Text style={styles.noFriendsText}>Follow some users to invite them to challenges!</Text>
              ) : (
                following.map((item) => {
                  const friend = item.following;
                  const friendId = item.following_id;
                  const isSelected = newChallenge.invitedFriends.includes(friendId);
                  return (
                    <TouchableOpacity
                      key={friendId}
                      style={[
                        styles.inviteFriendRow,
                        isSelected && styles.inviteFriendRowSelected,
                      ]}
                      onPress={() => {
                        setNewChallenge(prev => ({
                          ...prev,
                          invitedFriends: isSelected
                            ? prev.invitedFriends.filter(id => id !== friendId)
                            : [...prev.invitedFriends, friendId]
                        }));
                      }}
                    >
                      <View style={styles.inviteFriendAvatar}>
                        {friend?.avatar_url ? (
                          <Image source={{ uri: friend.avatar_url }} style={styles.inviteFriendAvatarImage} />
                        ) : (
                          <Text style={styles.inviteFriendAvatarText}>
                            {friend?.username?.[0]?.toUpperCase() || 'U'}
                          </Text>
                        )}
                      </View>
                      <View style={styles.inviteFriendInfo}>
                        <Text style={styles.inviteFriendName}>@{friend?.username || 'user'}</Text>
                      </View>
                      <View style={[
                        styles.inviteFriendCheck,
                        isSelected && styles.inviteFriendCheckSelected,
                      ]}>
                        {isSelected && <Check size={14} color={COLORS.textOnPrimary} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              {newChallenge.invitedFriends.length > 0 && (
                <Text style={styles.selectedCountText}>
                  {newChallenge.invitedFriends.length} friend{newChallenge.invitedFriends.length > 1 ? 's' : ''} selected
                </Text>
              )}
            </View>
            )}

            {/* Preview */}
            {newChallenge.name && (
              <View style={styles.challengePreview}>
                <Text style={styles.challengePreviewLabel}>PREVIEW</Text>
                <View style={styles.challengePreviewContent}>
                  <View style={styles.challengePreviewHeader}>
                    <Trophy size={18} color={COLORS.warning} />
                    <Text style={styles.challengePreviewName}>{newChallenge.name}</Text>
                  </View>
                  <Text style={styles.challengePreviewDesc}>
                    {newChallenge.type === 'workouts' && 'Complete the most workouts'}
                    {newChallenge.type === 'streak' && 'Maintain the longest streak'}
                    {newChallenge.type === 'volume' && 'Lift the most total weight'}
                    {newChallenge.type === 'reps' && 'Complete the most reps'}
                  </Text>
                  <Text style={styles.challengePreviewMeta}>
                    {newChallenge.duration} days • {newChallenge.invitedFriends.length + 1} participants
                  </Text>
                </View>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Create Button */}
          <View style={styles.createChallengeFooter}>
            <TouchableOpacity
              style={[
                styles.createChallengeButton,
                (!newChallenge.name || (!newChallenge.isGlobal && newChallenge.invitedFriends.length === 0)) && styles.createChallengeButtonDisabled,
              ]}
              onPress={async () => {
                if (newChallenge.name && newChallenge.invitedFriends.length > 0) {
                  try {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + newChallenge.duration);

                    // Create challenge via service
                    const { data, error } = await competitionService.createChallenge({
                      name: newChallenge.name,
                      type: newChallenge.type,
                      duration: newChallenge.duration,
                      creatorId: user.id,
                      invitedFriends: newChallenge.invitedFriends,
                    });

                    if (!error) {
                      // Add to local state
                      const newChallengeObj = {
                        id: data?.id || Date.now(),
                        name: newChallenge.name,
                        goal_type: newChallenge.type,
                        goal_value: newChallenge.type === 'workouts' ? 10 : 7,
                        participant_count: newChallenge.invitedFriends.length + 1,
                        user_progress: 0,
                      };
                      setChallenges(prev => [...prev, newChallengeObj]);
                    }

                    setNewChallenge({ name: '', type: 'workouts', duration: 7, invitedFriends: [], isGlobal: false });
                    setShowCreateChallenge(false);
                  } catch (err) {
                    console.log('Error creating challenge:', err);
                    Alert.alert('Error', 'Failed to create challenge. Please try again.');
                  }
                }
              }}
              disabled={!newChallenge.name || newChallenge.invitedFriends.length === 0}
            >
              <Text style={styles.createChallengeButtonText}>Create Challenge</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textOnPrimary,
  },
  content: {
    paddingHorizontal: 16,
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
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityUsername: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  workoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  workoutBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  activityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityStatText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Instagram-like Feed Styles
  suggestedSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestedTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  suggestedScroll: {
    marginHorizontal: -4,
  },
  suggestedScrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  suggestedCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 130,
  },
  suggestedAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  suggestedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestedAvatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  suggestedName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  suggestedUsername: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  suggestedFollowers: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  suggestedStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  suggestedStatText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  suggestedStatDot: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginHorizontal: 4,
  },
  suggestedFollowBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  suggestedFollowingBtn: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestedFollowBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  suggestedFollowingBtnText: {
    color: COLORS.textMuted,
  },
  noSuggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  noSuggestionsText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // Feed Card Styles
  feedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  feedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  feedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedAvatarPR: {
    backgroundColor: COLORS.warning,
  },
  feedAvatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUsername: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  feedTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  feedContent: {
    padding: 16,
  },
  feedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
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
  feedTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  feedTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },
  feedStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  feedStatsLine: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 14,
  },
  feedDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  feedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  feedStatBox: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  feedStatValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  feedPRDetails: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  feedPRWeight: {
    color: COLORS.warning,
    fontSize: 20,
    fontWeight: 'bold',
  },
  feedPRReps: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  feedDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedDetailText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  feedDetailHighlight: {
    color: COLORS.warning,
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 20,
  },
  feedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedActionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  feedActionTextActive: {
    color: COLORS.error,
  },

  shareWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  shareWorkoutBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: COLORS.textOnPrimary,
  },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  filtersBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  repertoireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
  },
  repertoireBtnText: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: '600',
  },
  findUsersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  findUsersBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateCardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateCardText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  loadMoreBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  discoverBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  discoverBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  periodFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  periodFilterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  periodFilterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  periodFilterText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  periodFilterTextActive: {
    color: COLORS.textOnPrimary,
  },
  createChallengeDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  createChallengeDashedText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  workoutMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },
  saveButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextActive: {
    color: COLORS.primary,
  },
  startButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  userAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  userBio: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: COLORS.surfaceLight,
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  createChallengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  createChallengeBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  challengeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  challengeMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  challengeGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  challengeGoalText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  challengeProgressText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  // Share Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  shareModal: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareModalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  shareModalClose: {
    padding: 4,
  },
  shareModalCloseText: {
    color: COLORS.textMuted,
    fontSize: 20,
  },
  shareModalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 20,
  },
  shareModalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  shareModalLoadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  shareModalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  shareModalEmptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  shareModalEmptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  shareModalList: {
    maxHeight: 300,
  },
  shareWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  shareWorkoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shareWorkoutInfo: {
    flex: 1,
  },
  shareWorkoutName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  shareWorkoutMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  previewHeader: {
    marginBottom: 12,
  },
  previewExercise: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  previewExerciseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewSets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewSetPill: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewSetText: {
    color: COLORS.textSecondary || COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  confirmShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  confirmShareBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  shareModalCancelBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  shareModalCancelText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // Filters Modal
  filtersModal: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  filterLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.textOnPrimary,
  },
  applyFiltersBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  applyFiltersBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Create Challenge Modal
  createChallengeModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  createChallengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  createChallengeTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  createChallengeContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  createChallengeSection: {
    marginTop: 24,
  },
  createChallengeSectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  createChallengeInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  challengeTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  challengeTypeOption: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  challengeTypeOptionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  challengeTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  challengeTypeLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeTypeLabelSelected: {
    color: COLORS.primary,
  },
  challengeTypeDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationOption: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  durationOptionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  durationLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  durationLabelSelected: {
    color: COLORS.primary,
  },
  inviteFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inviteFriendRowSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  inviteFriendAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  inviteFriendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inviteFriendAvatarText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteFriendInfo: {
    flex: 1,
  },
  inviteFriendName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  inviteFriendCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteFriendCheckSelected: {
    backgroundColor: COLORS.primary,
  },
  selectedCountText: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 8,
  },
  noFriendsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  challengePreview: {
    marginTop: 24,
  },
  challengePreviewLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  challengePreviewContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  challengePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  challengePreviewName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengePreviewDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  challengePreviewMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  createChallengeFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  createChallengeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createChallengeButtonDisabled: {
    opacity: 0.5,
  },
  createChallengeButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // My Profile styles
  myProfileHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  myProfileAvatarWrap: {
    marginBottom: 12,
  },
  myProfileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  myProfileAvatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myProfileAvatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  myProfileName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  myProfileUsername: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  myProfileStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 32,
  },
  myProfileStat: {
    alignItems: 'center',
  },
  myProfileStatCount: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  myProfileStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Main tabs row
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tabLarge: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabLargeActive: {
    backgroundColor: COLORS.primary,
  },
  tabLargeText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  tabLargeTextActive: {
    color: COLORS.textOnPrimary,
  },

  // Follow Modal
  followModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  followModalTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  followModalTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  followModalTabActive: {
    backgroundColor: COLORS.primary,
  },
  followModalTabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  followModalTabTextActive: {
    color: COLORS.textOnPrimary,
  },
  followModalContent: {
    flex: 1,
    padding: 16,
  },

  // Section header row
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  repertoireBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.warning + '20',
    borderRadius: 16,
  },
  repertoireBtnSmallText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },

  // My Profile Avatar Container
  myProfileAvatarContainer: {
    marginBottom: 12,
  },
  myProfileAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  // Accept/Reject buttons
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },

  // Close button
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Follow button text
  followButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  followingButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },

  // Requests badge
  requestsBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  requestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Challenge card updates
  challengeGoalText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  challengeTapHint: {
    color: COLORS.primary,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },

  // Challenge Detail Modal
  challengeDetailTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeDetailContent: {
    flex: 1,
    padding: 16,
  },
  challengeDetailHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  challengeDetailName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  challengeDetailGoal: {
    color: COLORS.primary,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  challengeDetailParticipants: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  challengeDetailSection: {
    marginBottom: 20,
  },
  challengeDetailSectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  challengeDetailProgressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  challengeDetailProgressBar: {
    height: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  challengeDetailProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  challengeDetailProgressText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeDetailProgressPercent: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  friendsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    paddingRight: 14,
  },
  friendChipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  friendChipAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  friendChipAvatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  friendChipName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  leaderboardRowMe: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  leaderboardRank: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
  },
  leaderboardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  leaderboardAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  leaderboardAvatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  leaderboardNameMe: {
    color: COLORS.primary,
  },
  leaderboardUsername: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  leaderboardProgress: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Visibility options
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityOption: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  visibilityOptionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  visibilityOptionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  visibilityOptionTextSelected: {
    color: COLORS.primary,
  },
  visibilityOptionDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});

export default CommunityScreen;
