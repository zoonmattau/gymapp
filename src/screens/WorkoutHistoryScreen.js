import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { ArrowLeft, Dumbbell, Check, Clock, TrendingUp, Pencil, X, ChevronDown, ChevronUp, Trash2, Users } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { supabase } from '../lib/supabase';
import { socialService } from '../services/socialService';

// Get RPE color on a green to red scale (0-10)
const getRpeColor = (rpe) => {
  const value = parseFloat(rpe) || 0;
  const clamped = Math.min(10, Math.max(0, value));
  const hue = 120 - (clamped / 10) * 120;
  return `hsl(${hue}, 70%, 45%)`;
};

const WorkoutHistoryScreen = ({ navigation }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);

  const { user, profile } = useAuth();
  const weightUnit = profile?.weight_unit || 'kg';
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [workoutToRename, setWorkoutToRename] = useState(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutDetails, setWorkoutDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showShareChoiceModal, setShowShareChoiceModal] = useState(false);
  const [showFriendPickerModal, setShowFriendPickerModal] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareTargetSessionId, setShareTargetSessionId] = useState(null);
  const [shareTargetName, setShareTargetName] = useState('');

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const handleDeletePress = (item, e) => {
    e.stopPropagation();
    Alert.alert(
      'Delete Workout',
      `Delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await workoutService.deleteWorkoutSession(item.id);
            if (!error) {
              setWorkoutHistory(prev => prev.filter(w => w.id !== item.id));
              if (selectedWorkout?.id === item.id) {
                setSelectedWorkout(null);
                setWorkoutDetails(null);
              }
            }
          },
        },
      ]
    );
  };

  const handleRenamePress = (workout) => {
    setWorkoutToRename(workout);
    setNewWorkoutName(workout.name);
    setRenameModalVisible(true);
  };

  const handleWorkoutPress = async (workout) => {
    setSelectedWorkout(workout);
    setDetailsLoading(true);

    try {
      // Fetch the sets for this workout session
      const { data: sets, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('session_id', workout.id)
        .order('completed_at', { ascending: true });

      if (error) {
        console.log('Error fetching workout details:', error);
        setWorkoutDetails([]);
      } else {
        // Group sets by exercise
        const exerciseMap = {};
        (sets || []).forEach(set => {
          const name = set.exercise_name || 'Unknown Exercise';
          if (!exerciseMap[name]) {
            exerciseMap[name] = {
              name,
              sets: [],
            };
          }
          exerciseMap[name].sets.push({
            setNumber: set.set_number,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            isWarmup: set.is_warmup,
          });
        });
        setWorkoutDetails(Object.values(exerciseMap));
      }
    } catch (err) {
      console.log('Error:', err);
      setWorkoutDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleShareWorkout = (sessionId, workoutName) => {
    setShareTargetSessionId(sessionId);
    setShareTargetName(workoutName);
    setShowShareChoiceModal(true);
  };

  const handleOSShare = async () => {
    setShowShareChoiceModal(false);
    const item = workoutHistory.find(w => w.id === shareTargetSessionId);
    if (!item) return;
    const shareText = `Check out my ${item.name} workout!\n\n` +
      `${item.duration} min · ${item.exercises} exercises · ${formatVolume(item.totalVolume)}\n\n#UPrep #Fitness`;

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try { await navigator.share({ title: 'Workout', text: shareText }); } catch {}
      } else {
        try { await navigator.clipboard.writeText(shareText); alert('Copied to clipboard!'); } catch {}
      }
    } else {
      try { await Share.share({ message: shareText }); } catch {}
    }
  };

  const handleShareToFriends = async () => {
    setShowShareChoiceModal(false);
    setFriendsLoading(true);
    setSelectedFriends([]);
    setShowFriendPickerModal(true);
    const { data } = await socialService.getFriendsList(user?.id);
    setFriendsList(data || []);
    setFriendsLoading(false);
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSendToFriends = async () => {
    if (!selectedFriends.length || !shareTargetSessionId) return;
    setShareSubmitting(true);
    const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.username || 'Someone';
    await socialService.shareWorkoutToFriends(user.id, userName, shareTargetSessionId, selectedFriends);
    setShareSubmitting(false);
    setShowFriendPickerModal(false);
    setSelectedFriends([]);
  };

  const handleRenameSubmit = async () => {
    if (!workoutToRename || !newWorkoutName.trim()) return;

    try {
      const { error } = await workoutService.renameWorkoutSession(
        workoutToRename.id,
        newWorkoutName.trim()
      );

      if (!error) {
        // Update local state
        setWorkoutHistory(prev =>
          prev.map(w =>
            w.id === workoutToRename.id ? { ...w, name: newWorkoutName.trim() } : w
          )
        );
      }
    } catch (err) {
      console.log('Error renaming workout:', err);
    }

    setRenameModalVisible(false);
    setWorkoutToRename(null);
    setNewWorkoutName('');
  };

  const loadWorkoutHistory = async () => {
    try {
      const { data } = await workoutService.getCompletedSessions(user?.id, 50);
      if (data && data.length > 0) {
        // Format the data for display
        const formattedHistory = data.map(session => ({
          id: session.id,
          name: session.workout_name || 'Workout',
          date: session.ended_at
            ? new Date(session.ended_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
            : 'Recently',
          duration: session.duration_minutes || Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 60000) || 0,
          exercises: session.exercise_count || 0,
          totalVolume: session.total_volume || 0,
          sets: session.total_sets || 0,
        }));
        setWorkoutHistory(formattedHistory);
      } else {
        setWorkoutHistory([]);
      }
    } catch (error) {
      console.log('Error loading workout history:', error);
      setWorkoutHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutColor = (name) => {
    const colors = {
      'Upper': COLORS.primary,
      'Lower': COLORS.success,
      'Push': COLORS.accent,
      'Pull': COLORS.warning,
      'Legs': '#EC4899',
      'Chest': COLORS.accent,
      'Back': COLORS.success,
      'Shoulders': COLORS.warning,
      'Arms': COLORS.primary,
    };

    for (const [key, color] of Object.entries(colors)) {
      if (name?.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return COLORS.primary;
  };

  const formatVolume = (volume) => {
    const displayVolume = weightUnit === 'lbs' ? Math.round(volume * 2.205) : volume;
    return `${displayVolume.toLocaleString()} ${weightUnit}`;
  };

  const renderHistoryItem = ({ item }) => {
    const workoutColor = getWorkoutColor(item.name);
    const isExpanded = selectedWorkout?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleWorkoutPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.historyHeader}>
          <View style={styles.historyLeft}>
            <View style={[styles.historyIcon, { backgroundColor: workoutColor + '20' }]}>
              <Dumbbell size={18} color={workoutColor} />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyName}>{item.name}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
          </View>
          <View style={styles.historyActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRenamePress(item);
              }}
            >
              <Pencil size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => handleDeletePress(item, e)}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
            {isExpanded ? (
              <ChevronUp size={18} color={COLORS.primary} />
            ) : (
              <ChevronDown size={18} color={COLORS.textMuted} />
            )}
          </View>
        </View>
        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Clock size={14} color={COLORS.textMuted} />
            <Text style={styles.historyStatText}>{item.duration} min</Text>
          </View>
          <View style={styles.historyStat}>
            <Dumbbell size={14} color={COLORS.textMuted} />
            <Text style={styles.historyStatText}>{item.exercises} exercises</Text>
          </View>
          {item.totalVolume > 0 && (
            <View style={styles.historyStat}>
              <TrendingUp size={14} color={COLORS.text} />
              <Text style={[styles.historyStatText, { color: COLORS.text, fontWeight: '600' }]}>
                {formatVolume(item.totalVolume)}
              </Text>
            </View>
          )}
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            {detailsLoading ? (
              <View style={styles.detailsLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.detailsLoadingText}>Loading exercises...</Text>
              </View>
            ) : workoutDetails && workoutDetails.length > 0 ? (
              workoutDetails.map((exercise, idx) => {
                const workingSets = exercise.sets.filter(s => !s.isWarmup);
                const weights = workingSets.map(s => parseFloat(s.weight) || 0).filter(w => w > 0);
                const topWeight = weights.length > 0 ? Math.max(...weights) : 0;
                const displayWeight = weightUnit === 'lbs' ? Math.round(topWeight * 2.205) : topWeight;
                return (
                  <View key={idx} style={styles.exerciseDetailRow}>
                    <Text style={styles.exerciseDetailName} numberOfLines={1}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetailStats}>
                      {workingSets.length} sets{topWeight > 0 ? ` · ${displayWeight}${weightUnit}` : ''}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDetailsText}>No exercise data recorded</Text>
            )}

            {/* View Summary Button */}
            <TouchableOpacity
              style={styles.viewSummaryButton}
              onPress={() => {
                // Format exercises for summary screen
                const formattedExercises = (workoutDetails || []).map(ex => ({
                  name: ex.name,
                  sets: ex.sets.map(s => ({
                    weight: s.weight,
                    reps: s.reps,
                    rpe: s.rpe,
                    completed: true,
                    isWarmup: s.isWarmup,
                  })),
                }));

                navigation.navigate('WorkoutSummary', {
                  summary: {
                    sessionId: item.id,
                    workoutName: item.name,
                    duration: (item.duration || 0) * 60, // Convert to seconds
                    totalSets: item.sets || formattedExercises.reduce((sum, ex) => sum + ex.sets.length, 0),
                    completedSets: item.sets || formattedExercises.reduce((sum, ex) => sum + ex.sets.length, 0),
                    exercises: formattedExercises,
                    totalVolume: item.totalVolume || 0,
                    newPRs: [],
                    isFromHistory: true,
                  },
                });
              }}
            >
              <Text style={styles.viewSummaryButtonText}>View Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareWorkoutButton}
              onPress={() => handleShareWorkout(item.id, item.name)}
            >
              <Users size={16} color={COLORS.primary} />
              <Text style={styles.shareWorkoutButtonText}>Share Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Dumbbell size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyText}>
        Complete your first workout to start tracking your progress. Your workout history will appear here.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Workouts' })}
      >
        <Text style={styles.emptyButtonText}>Start a Workout</Text>
      </TouchableOpacity>
    </View>
  );

  const getTotalStats = () => {
    const totalWorkouts = workoutHistory.length;
    const totalDuration = workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalVolume = workoutHistory.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    return { totalWorkouts, totalDuration, totalVolume };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Workout History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = getTotalStats();

  if (Platform.OS === 'web') {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        backgroundColor: COLORS.background,
      }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Workout History</Text>
          <View style={{ width: 24 }} />
        </View>

        {workoutHistory.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Summary Stats */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{stats.totalWorkouts}</Text>
                <Text style={styles.summaryLabel}>Workouts</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{Math.round(stats.totalDuration / 60)}h</Text>
                <Text style={styles.summaryLabel}>Total Time</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{formatVolume(stats.totalVolume)}</Text>
                <Text style={styles.summaryLabel}>Volume</Text>
              </View>
            </View>

            {/* History List */}
            {workoutHistory.map((item) => (
              <View key={item.id?.toString() || Math.random().toString()} style={{ paddingHorizontal: 16 }}>
                {renderHistoryItem({ item })}
              </View>
            ))}
            <View style={{ height: 20 }} />
          </>
        )}

        {/* Rename Modal */}
        <Modal
          visible={renameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRenameModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rename Workout</Text>
                <TouchableOpacity
                  onPress={() => setRenameModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.renameInput}
                value={newWorkoutName}
                onChangeText={setNewWorkoutName}
                placeholder="Workout name"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setRenameModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleRenameSubmit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Share Choice Modal */}
        <Modal
          visible={showShareChoiceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowShareChoiceModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowShareChoiceModal(false)}
          >
            <View style={styles.modalContainer} onClick={e => e.stopPropagation()}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Share Workout</Text>
                  <TouchableOpacity onPress={() => setShowShareChoiceModal(false)} style={styles.modalCloseButton}>
                    <X size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.shareChoiceButton} onPress={handleOSShare}>
                  <Text style={styles.shareChoiceButtonText}>Share via...</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareChoiceButton, { marginTop: 10 }]} onPress={handleShareToFriends}>
                  <Users size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.shareChoiceButtonText}>Share to Friends</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Friend Picker Modal */}
        <Modal
          visible={showFriendPickerModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFriendPickerModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFriendPickerModal(false)}
          >
            <View style={[styles.modalContainer, { maxHeight: 480 }]} onClick={e => e.stopPropagation()}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Send to Friends</Text>
                  <TouchableOpacity onPress={() => setShowFriendPickerModal(false)} style={styles.modalCloseButton}>
                    <X size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                  {friendsLoading ? (
                    <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 }}>Loading friends...</Text>
                  ) : friendsList.length === 0 ? (
                    <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 }}>No friends yet</Text>
                  ) : (
                    friendsList.map(friend => (
                      <TouchableOpacity
                        key={friend.id}
                        style={styles.friendPickerItem}
                        onPress={() => toggleFriendSelection(friend.id)}
                      >
                        <View style={styles.friendPickerAvatar}>
                          <Text style={styles.friendPickerAvatarText}>{friend.first_name?.[0] || friend.username?.[0] || '?'}</Text>
                        </View>
                        <Text style={styles.friendPickerName}>{friend.name}</Text>
                        <View style={[styles.friendPickerCheckbox, selectedFriends.includes(friend.id) && styles.friendPickerCheckboxActive]}>
                          {selectedFriends.includes(friend.id) && <Check size={14} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
                {selectedFriends.length > 0 && (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendToFriends}
                    disabled={shareSubmitting}
                  >
                    <Text style={styles.sendButtonText}>
                      {shareSubmitting ? 'Sending...' : `Send to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </div>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout History</Text>
        <View style={{ width: 24 }} />
      </View>

      {workoutHistory.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.totalWorkouts}</Text>
              <Text style={styles.summaryLabel}>Workouts</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{Math.round(stats.totalDuration / 60)}h</Text>
              <Text style={styles.summaryLabel}>Total Time</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatVolume(stats.totalVolume)}</Text>
              <Text style={styles.summaryLabel}>Volume</Text>
            </View>
          </View>

          {/* History List */}
          {workoutHistory.map((item) => (
            <View key={item.id?.toString() || Math.random().toString()} style={{ paddingHorizontal: 16 }}>
              {renderHistoryItem({ item })}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Workout</Text>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.renameInput}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              placeholder="Workout name"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleRenameSubmit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Choice Modal */}
      <Modal
        visible={showShareChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareChoiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowShareChoiceModal(false)}
        >
          <View style={styles.modalContainer} {...(Platform.OS === 'web' ? { onClick: e => e.stopPropagation() } : {})}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Workout</Text>
                <TouchableOpacity onPress={() => setShowShareChoiceModal(false)} style={styles.modalCloseButton}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.shareChoiceButton}
                onPress={handleOSShare}
              >
                <Text style={styles.shareChoiceButtonText}>Share via...</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareChoiceButton, { marginTop: 10 }]}
                onPress={handleShareToFriends}
              >
                <Users size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.shareChoiceButtonText}>Share to Friends</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Friend Picker Modal */}
      <Modal
        visible={showFriendPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFriendPickerModal(false)}
        >
          <View style={[styles.modalContainer, { maxHeight: 480 }]} {...(Platform.OS === 'web' ? { onClick: e => e.stopPropagation() } : {})}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send to Friends</Text>
                <TouchableOpacity onPress={() => setShowFriendPickerModal(false)} style={styles.modalCloseButton}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {friendsLoading ? (
                  <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 }}>Loading friends...</Text>
                ) : friendsList.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 }}>No friends yet</Text>
                ) : (
                  friendsList.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.friendPickerItem}
                      onPress={() => toggleFriendSelection(friend.id)}
                    >
                      <View style={styles.friendPickerAvatar}>
                        <Text style={styles.friendPickerAvatarText}>{friend.first_name?.[0] || friend.username?.[0] || '?'}</Text>
                      </View>
                      <Text style={styles.friendPickerName}>{friend.name}</Text>
                      <View style={[styles.friendPickerCheckbox, selectedFriends.includes(friend.id) && styles.friendPickerCheckboxActive]}>
                        {selectedFriends.includes(friend.id) && <Check size={14} color="#FFF" />}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              {selectedFriends.length > 0 && (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendToFriends}
                  disabled={shareSubmitting}
                >
                  <Text style={styles.sendButtonText}>
                    {shareSubmitting ? 'Sending...' : `Send to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}`}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyStatText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  renameInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Expanded Details
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  detailsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  detailsLoadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  exerciseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  exerciseDetailName: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  exerciseDetailStats: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  noDetailsText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  viewSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  viewSummaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  shareWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  shareWorkoutButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  shareChoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareChoiceButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  friendPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  friendPickerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendPickerAvatarText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  friendPickerName: {
    color: COLORS.text,
    fontSize: 15,
    flex: 1,
  },
  friendPickerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendPickerCheckboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  sendButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutHistoryScreen;
