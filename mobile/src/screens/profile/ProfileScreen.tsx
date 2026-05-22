import React, {useCallback, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {useToast} from '../../components/ToastProvider';
import {authService} from '../../services/authService';
import {patientService} from '../../services/patientService';
import {subscriptionService} from '../../services/subscriptionService';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {MainTabParamList, RootStackParamList} from '../../navigation/types';
import type {Subscription} from '../../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export const ProfileScreen = (_props: Props) => {
  const {showToast} = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const clearSession = useAuthStore(state => state.clearSession);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      try {
        const [profile, nextSubscription] = await Promise.all([patientService.getProfile(), subscriptionService.getStatus()]);
        setUser(profile);
        setName(profile.name);
        setPhone(profile.phone ?? '');
        setDateOfBirth(profile.dateOfBirth ?? '');
        setSubscription(nextSubscription);
      } catch {
        return;
      }
    };
    load();
  }, [setUser]));

  const handleSave = async () => {
    try {
      setSaving(true);
      const profile = await patientService.updateProfile({name, phone, dateOfBirth});
      setUser(profile);
      showToast('Profile updated.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authService.logout();
      clearSession();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to sign out.', 'error');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.name}>{user?.name ?? 'Your profile'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profile details</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textSecondary} />
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={colors.textSecondary} />
        <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
        <Button title="Save changes" onPress={handleSave} loading={saving} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Text style={styles.copy}>Current plan: {(subscription?.plan ?? user?.subscriptionTier ?? 'free').toUpperCase()}</Text>
        <Button title="Manage subscription" variant="secondary" onPress={() => navigation.navigate('Subscription')} />
      </View>

      <Button title="Sign Out" onPress={handleLogout} loading={loggingOut} variant="secondary" />
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {padding: spacing.lg, gap: spacing.lg},
  profileCard: {backgroundColor: colors.surface, borderRadius: 24, padding: spacing.xl, gap: spacing.xs},
  name: {color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold},
  email: {color: colors.textSecondary, fontSize: typography.sizes.md},
  sectionCard: {backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, gap: spacing.sm},
  sectionTitle: {color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold},
  input: {borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text},
  copy: {color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20},
});
