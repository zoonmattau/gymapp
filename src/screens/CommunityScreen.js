import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Users, UserPlus, Search } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const CommunityScreen = () => {
  const friends = [
    { id: 1, name: 'Alex M.', status: 'working_out', workout: 'Push Day' },
    { id: 2, name: 'Sarah K.', status: 'just_finished', workout: 'Leg Day' },
    { id: 3, name: 'Mike R.', status: null, lastActive: '2h ago' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Community</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Search size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <UserPlus size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Friends Activity */}
        <Text style={styles.sectionLabel}>FRIENDS ACTIVITY</Text>
        {friends.map((friend) => (
          <View key={friend.id} style={styles.friendCard}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>{friend.name[0]}</Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              {friend.status === 'working_out' && (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                  <Text style={[styles.statusText, { color: COLORS.success }]}>
                    Working out: {friend.workout}
                  </Text>
                </View>
              )}
              {friend.status === 'just_finished' && (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={[styles.statusText, { color: COLORS.primary }]}>
                    Just finished: {friend.workout}
                  </Text>
                </View>
              )}
              {!friend.status && (
                <Text style={styles.lastActive}>Active {friend.lastActive}</Text>
              )}
            </View>
          </View>
        ))}

        {/* Find Friends */}
        <TouchableOpacity style={styles.findFriendsCard}>
          <Users size={24} color={COLORS.primary} />
          <View style={styles.findFriendsText}>
            <Text style={styles.findFriendsTitle}>Find Friends</Text>
            <Text style={styles.findFriendsSubtitle}>Connect with workout partners</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  friendCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
  },
  lastActive: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  findFriendsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  findFriendsText: {
    flex: 1,
  },
  findFriendsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  findFriendsSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});

export default CommunityScreen;
