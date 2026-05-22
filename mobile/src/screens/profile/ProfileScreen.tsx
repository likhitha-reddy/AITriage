import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

import {Button} from '../../components/Button';
import {authService} from '../../services/authService';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {formatDate} from '../../utils/formatDate';
import type {MainTabParamList} from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export const ProfileScreen = (_props: Props) => {
  const user = useAuthStore(state => state.user);
  const clearSession = useAuthStore(state => state.clearSession);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      clearSession();
    } catch (error) {
      Alert.alert('Unable to sign out', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCard}>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Text style={styles.plan}>{user?.subscription.tier ?? 'free'} plan</Text>
          <Text style={styles.copy}>Renews on {formatDate(user?.subscription.renewalDate ?? '2026-05-22T12:22:01Z')}</Text>
          {user?.subscription.benefits.map(benefit => (
            <Text key={benefit} style={styles.benefit}>• {benefit}</Text>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daily check-in progress</Text>
          <Text style={styles.copy}>5 of 7 check-ins completed this week.</Text>
          <Text style={styles.copy}>Consistency unlocks better symptom trend analysis and clinician prep.</Text>
        </View>

        <Button title="Sign Out" onPress={handleLogout} loading={loading} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  email: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  plan: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  copy: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  benefit: {
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
});
