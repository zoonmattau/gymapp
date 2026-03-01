import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Save, User, Mail, FileText, Camera } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

const EditProfileScreen = () => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);

  const navigation = useNavigation();
  const { user, profile, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Avatar upload
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadAvatar = async (file) => {
    if (!user?.id) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name?.split('.').pop() || 'jpg';
      const filePath = `${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      showToast('Profile photo updated', 'success');
    } catch (err) {
      console.log('Avatar upload error:', err);
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to upload an avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const ext = asset.uri.split('.').pop() || 'jpg';
        blob.name = `avatar.${ext}`;
        await uploadAvatar(blob);
      }
    }
  };

  const handleWebFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    event.target.value = '';
  };

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!username.trim()) {
      showToast('Username is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          showToast('Username already taken', 'error');
        } else {
          showToast('Error saving profile', 'error');
        }
      } else {
        showToast('Profile updated successfully', 'success');
        if (refreshProfile) {
          await refreshProfile();
        }
        setTimeout(() => navigation.goBack(), 1000);
      }
    } catch (error) {
      console.log('Error updating profile:', error);
      showToast('Error saving profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderFormContent = () => (
    <View style={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7} style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            {uploadingAvatar ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <User size={50} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.avatarPlusBadge}>
            <Camera size={14} color={COLORS.textOnPrimary} />
          </View>
        </TouchableOpacity>
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleWebFileSelect}
            style={{ display: 'none' }}
          />
        )}
        <TouchableOpacity style={styles.changePhotoBtn} onPress={handleAvatarPress}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>PERSONAL INFO</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name</Text>
          <View style={styles.inputContainer}>
            <User size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <View style={styles.inputContainer}>
            <User size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bio</Text>
          <View style={[styles.inputContainer, styles.bioContainer]}>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </View>
      </View>

      {/* Email (read-only) */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={[styles.inputContainer, styles.readOnlyContainer]}>
            <Mail size={18} color={COLORS.textMuted} />
            <Text style={styles.readOnlyText}>{user?.email || 'Not set'}</Text>
          </View>
          <Text style={styles.helperText}>Contact support to change your email</Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Save size={20} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {renderFormContent()}
        </div>

        {/* Toast */}
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastVisible(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Save size={20} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderFormContent()}
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  saveButton: {
    padding: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  changePhotoBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  atSymbol: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  bioContainer: {
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  readOnlyContainer: {
    backgroundColor: COLORS.surfaceLight,
  },
  readOnlyText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 16,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
