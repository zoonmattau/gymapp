import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { socialService } from '../services/socialService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import { competitionService } from '../services/competitionService';
import { workoutService } from '../services/workoutService';

const TABS = [
  { id: 'feed', label: 'Activity' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'followers', label: 'Followers' },
  { id: 'following', label: 'Following' },
  { id: 'discover', label: 'Discover' },
  { id: 'challenges', label: 'Challenges' },
];

const CommunityScreen = ({ route }) => {
  const { user } = useAuth();
  const initialTab = route?.params?.initialTab || 'feed';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  // Activity Feed
  const [activityFeed, setActivityFeed] = useState([]);
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
  const [followingIds, setFollowingIds] = useState(new Set());

  // Challenges
  const [challenges, setChallenges] = useState([]);

  // Share Workout Modal
  const [showShareModal, setShowShareModal] = useState(false);

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

  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadTabData();
    }
  }, [activeTab, workoutSort]);

  const loadInitialData = async () => {
    loadFollowingIds();
  };

  const loadFollowingIds = async () => {
    try {
      const { data } = await socialService.getFollowing(user.id);
      if (data) {
        setFollowingIds(new Set(data.map(f => f.following_id)));
      }
    } catch (error) {
      console.log('Error loading following:', error);
    }
  };

  const loadTabData = async () => {
    switch (activeTab) {
      case 'feed':
        loadActivityFeed();
        break;
      case 'workouts':
        loadCommunityWorkouts();
        break;
      case 'followers':
        loadFollowers();
        break;
      case 'following':
        loadFollowing();
        break;
      case 'discover':
        loadSuggestedUsers();
        break;
      case 'challenges':
        loadChallenges();
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
      const { data } = await socialService.getActivityFeed(user.id, 20);
      if (data) {
        setActivityFeed(data);
      }

      const { data: likes } = await socialService.getUserLikes(user.id);
      if (likes) {
        const likesMap = {};
        likes.forEach(l => { likesMap[l.activity_id] = true; });
        setUserLikes(likesMap);
      }
    } catch (error) {
      console.log('Error loading feed:', error);
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
        setSavedWorkoutIds(new Set(saved.map(w => w.workout_id)));
      }
    } catch (error) {
      console.log('Error loading workouts:', error);
    }
  };

  const loadFollowers = async () => {
    try {
      const { data } = await socialService.getFollowers(user.id);
      if (data) {
        setFollowers(data);
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
      const { data } = await socialService.getSuggestedUsers(user.id, 10);
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

    setFollowingIds(prev => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(targetUserId);
      } else {
        next.add(targetUserId);
      }
      return next;
    });

    try {
      if (isFollowing) {
        await socialService.unfollowUser(user.id, targetUserId);
      } else {
        await socialService.followUser(user.id, targetUserId);
      }
    } catch (error) {
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(targetUserId);
        } else {
          next.delete(targetUserId);
        }
        return next;
      });
      console.log('Error toggling follow:', error);
    }
  };

  const handleOpenRepertoire = async () => {
    setShowRepertoireModal(true);
    setLoadingRepertoire(true);
    try {
      const { data } = await publishedWorkoutService.getSavedWorkoutsWithDetails(user.id);
      setSavedWorkoutsWithDetails(data || []);
    } catch (error) {
      console.log('Error loading repertoire:', error);
      setSavedWorkoutsWithDetails([]);
    } finally {
      setLoadingRepertoire(false);
    }
  };

  const handleStartRepertoireWorkout = (workout) => {
    setShowRepertoireModal(false);
    // TODO: Navigate to active workout screen with this workout
    const successMessage = `Starting "${workout.name}"`;
    if (Platform.OS === 'web') {
      alert(successMessage);
    } else {
      Alert.alert('Starting Workout', successMessage);
    }
  };

  const handleApplyFilters = () => {
    setShowFiltersModal(false);
    // Reload workouts with filters
    loadCommunityWorkouts();
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

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await socialService.searchUsers(searchQuery);
      if (data) {
        setSearchResults(data.filter(u => u.id !== user.id));
      }
    } catch (error) {
      console.log('Error searching:', error);
    }
  };

  const handleShareWorkout = async () => {
    setLoadingWorkouts(true);
    setShowShareModal(true);

    try {
      // Load user's recent completed workouts
      const { data } = await workoutService.getCompletedSessions(user?.id, 10);
      if (data && data.length > 0) {
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
          exercises: session.exercise_count || 0,
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

  const handleSelectWorkoutToShare = (workout) => {
    setShowShareModal(false);

    const successMessage = `"${workout.name}" shared successfully!`;
    if (Platform.OS === 'web') {
      alert(successMessage);
    } else {
      Alert.alert('Success', successMessage);
    }
    loadCommunityWorkouts();
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

  const renderActivityFeed = () => (
    <>
      {activityFeed.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyStateTitle}>No activity yet 😊</Text>
          <Text style={styles.emptyStateText}>
            Follow friends to see their workouts here
          </Text>
        </View>
      ) : (
        activityFeed.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View style={styles.activityAvatar}>
                <Text style={styles.avatarText}>
                  {activity.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityUsername}>@{activity.username}</Text>
                <Text style={styles.activityTime}>{formatTimeAgo(activity.created_at)}</Text>
              </View>
            </View>

            <View style={styles.activityContent}>
              <View style={styles.workoutBadge}>
                <Dumbbell size={14} color={COLORS.primary} />
                <Text style={styles.workoutBadgeText}>{activity.workout_name || 'Workout'}</Text>
              </View>
              {activity.duration_minutes && (
                <View style={styles.activityStats}>
                  <Clock size={12} color={COLORS.textMuted} />
                  <Text style={styles.activityStatText}>{activity.duration_minutes} min</Text>
                </View>
              )}
            </View>

            <View style={styles.activityActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLikeActivity(activity.id)}
              >
                <Heart
                  size={18}
                  color={userLikes[activity.id] ? COLORS.error : COLORS.textMuted}
                  fill={userLikes[activity.id] ? COLORS.error : 'none'}
                />
                <Text style={[styles.actionText, userLikes[activity.id] && { color: COLORS.error }]}>
                  {activity.like_count || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={18} color={COLORS.textMuted} />
                <Text style={styles.actionText}>{activity.comment_count || 0}</Text>
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
        <Share2 size={20} color={COLORS.text} />
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
                  by @{workout.creator_username} • {workout.exercise_count || 0} exercises
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
                  {workout.target_duration || 45} min
                </Text>
              </View>
            </View>

            <View style={styles.workoutActions}>
              <TouchableOpacity
                style={[styles.saveButton, savedWorkoutIds.has(workout.id) && styles.saveButtonActive]}
                onPress={() => handleSaveWorkout(workout.id)}
              >
                <Text style={[styles.saveButtonText, savedWorkoutIds.has(workout.id) && styles.saveButtonTextActive]}>
                  {savedWorkoutIds.has(workout.id) ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startButton}>
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
        <Plus size={20} color={COLORS.text} />
        <Text style={styles.findUsersBtnText}>Find Users to Follow</Text>
      </TouchableOpacity>

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

          return (
            <View key={item.id} style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>@{userProfile?.username || 'user'}</Text>
                {userProfile?.bio && (
                  <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.followButton, isFollowingUser && styles.followingButton]}
                onPress={() => handleFollowUser(userId)}
              >
                {isFollowingUser ? (
                  <UserCheck size={16} color={COLORS.text} />
                ) : (
                  <UserPlus size={16} color={COLORS.text} />
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </>
  );

  const renderFollowing = () => (
    <>
      {/* Find Users Button */}
      <TouchableOpacity
        style={styles.findUsersBtn}
        onPress={() => setActiveTab('discover')}
      >
        <Plus size={20} color={COLORS.text} />
        <Text style={styles.findUsersBtnText}>Find Users to Follow</Text>
      </TouchableOpacity>

      {/* Following Section */}
      <Text style={styles.sectionLabel}>FOLLOWING ({following.length})</Text>

      {following.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <UserPlus size={48} color={COLORS.primary} />
          <Text style={styles.emptyStateCardTitle}>Not following anyone yet</Text>
          <Text style={styles.emptyStateCardText}>
            Search for users or discover top athletes to follow!
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
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>@{userProfile?.username || 'user'}</Text>
                {userProfile?.bio && (
                  <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.followButton, isFollowingUser && styles.followingButton]}
                onPress={() => handleFollowUser(userId)}
              >
                {isFollowingUser ? (
                  <UserCheck size={16} color={COLORS.text} />
                ) : (
                  <UserPlus size={16} color={COLORS.text} />
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </>
  );

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
            return (
              <View key={userProfile.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {userProfile.username?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>@{userProfile.username || 'user'}</Text>
                  {userProfile.bio && (
                    <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.followButton, isFollowingUser && styles.followingButton]}
                  onPress={() => handleFollowUser(userProfile.id)}
                >
                  {isFollowingUser ? (
                    <UserCheck size={16} color={COLORS.text} />
                  ) : (
                    <UserPlus size={16} color={COLORS.text} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </>
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
          <TouchableOpacity style={styles.createChallengeDashedBtn}>
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
          <TouchableOpacity style={styles.createChallengeDashedBtn}>
            <Plus size={20} color={COLORS.textMuted} />
            <Text style={styles.createChallengeDashedText}>Create New Challenge</Text>
          </TouchableOpacity>
        </>
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
        <View style={styles.header}>
          <Text style={styles.title}>Community 👥</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {activeTab === 'feed' && renderActivityFeed()}
          {activeTab === 'workouts' && renderCommunityWorkouts()}
          {activeTab === 'followers' && renderFollowers()}
          {activeTab === 'following' && renderFollowing()}
          {activeTab === 'discover' && renderDiscover()}
          {activeTab === 'challenges' && renderChallenges()}
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
                onPress={() => setShowShareModal(false)}
                style={styles.shareModalClose}
              >
                <Text style={styles.shareModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.shareModalSubtitle}>
              Select a workout to share with the community
            </Text>

            {loadingWorkouts ? (
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
                    onPress={() => handleSelectWorkoutToShare(workout)}
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
                    <Share2 size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.shareModalCancelBtn}
              onPress={() => setShowShareModal(false)}
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
                        {workout.exercise_count || workout.exercises?.length || 0} exercises • {workout.target_duration || 45} min
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
  discoverBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 20,
  },
  discoverBtnText: {
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
  },
  applyFiltersBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  applyFiltersBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CommunityScreen;
