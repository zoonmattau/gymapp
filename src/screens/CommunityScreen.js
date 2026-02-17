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
  Modal,
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
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { socialService } from '../services/socialService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import { competitionService } from '../services/competitionService';
import { workoutService } from '../services/workoutService';

const TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'discover', label: 'Discover' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'following', label: 'Following' },
  { id: 'followers', label: 'Followers' },
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

  // Following search
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const [followingSearchResults, setFollowingSearchResults] = useState([]);

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
      // Load feed and suggested users in parallel
      const [feedResult, suggestedResult, likesResult] = await Promise.all([
        socialService.getActivityFeed(user.id, 30),
        socialService.getSuggestedUsers(user.id, 5),
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

  const searchUsersFromFollowing = async () => {
    if (!followingSearchQuery.trim()) {
      setFollowingSearchResults([]);
      return;
    }

    try {
      const { data } = await socialService.searchUsers(followingSearchQuery);
      if (data) {
        setFollowingSearchResults(data.filter(u => u.id !== user.id));
      }
    } catch (error) {
      console.log('Error searching from following:', error);
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
              <View key={suggestedUser.id} style={styles.suggestedCard}>
                <View style={styles.suggestedAvatar}>
                  <Text style={styles.suggestedAvatarText}>
                    {suggestedUser.username?.[0]?.toUpperCase() || 'U'}
                  </Text>
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
                    followingIds.has(suggestedUser.id) && styles.suggestedFollowingBtn,
                  ]}
                  onPress={() => handleFollowUser(suggestedUser.id)}
                >
                  <Text style={[
                    styles.suggestedFollowBtnText,
                    followingIds.has(suggestedUser.id) && styles.suggestedFollowingBtnText,
                  ]}>
                    {followingIds.has(suggestedUser.id) ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
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
              <TouchableOpacity style={styles.feedUserRow}>
                <View style={[
                  styles.feedAvatar,
                  activity.type === 'pr' && styles.feedAvatarPR,
                ]}>
                  <Text style={styles.feedAvatarText}>
                    {activity.profile?.username?.[0]?.toUpperCase() || 'U'}
                  </Text>
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
                {activity.type === 'workout' && activity.data?.duration && (
                  <View style={styles.feedDetailItem}>
                    <Clock size={14} color={COLORS.textMuted} />
                    <Text style={styles.feedDetailText}>{activity.data.duration} min</Text>
                  </View>
                )}
                {activity.type === 'pr' && (
                  <>
                    <View style={styles.feedDetailItem}>
                      <Text style={styles.feedDetailHighlight}>{activity.data?.weight} kg</Text>
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
                setNewChallenge({ name: '', type: 'workouts', duration: 7, invitedFriends: [] });
              }}
            >
              <X size={24} color={COLORS.text} />
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
                  { id: 'workouts', label: 'Most Workouts', icon: '🏋️', desc: 'Complete the most workouts' },
                  { id: 'streak', label: 'Longest Streak', icon: '🔥', desc: 'Maintain the longest streak' },
                  { id: 'volume', label: 'Total Volume', icon: '💪', desc: 'Lift the most total weight' },
                  { id: 'reps', label: 'Total Reps', icon: '🔄', desc: 'Complete the most reps' },
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

            {/* Invite Friends */}
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
                        <Text style={styles.inviteFriendAvatarText}>
                          {friend?.username?.[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.inviteFriendInfo}>
                        <Text style={styles.inviteFriendName}>@{friend?.username || 'user'}</Text>
                      </View>
                      <View style={[
                        styles.inviteFriendCheck,
                        isSelected && styles.inviteFriendCheckSelected,
                      ]}>
                        {isSelected && <Check size={14} color={COLORS.text} />}
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
                (!newChallenge.name || newChallenge.invitedFriends.length === 0) && styles.createChallengeButtonDisabled,
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

                    setNewChallenge({ name: '', type: 'workouts', duration: 7, invitedFriends: [] });
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
  suggestedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestedAvatarText: {
    color: COLORS.text,
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
    color: COLORS.text,
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
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  feedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedAvatarPR: {
    backgroundColor: COLORS.warning,
  },
  feedAvatarText: {
    color: COLORS.text,
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
  feedTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  inviteFriendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CommunityScreen;
