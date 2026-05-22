import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {MainTabParamList, RootStackParamList} from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export const HomeScreen = ({navigation}: Props) => {
  const user = useAuthStore(state => state.user);
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.greeting}>Hello, {user?.firstName ?? 'there'}</Text>
          <Text style={styles.title}>Your care, coordinated in one place.</Text>
          <Text style={styles.subtitle}>
            Start a symptom triage, connect with a clinician, or review your prescriptions in seconds.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.buttonGroup}>
            <Button title="Start Triage" onPress={() => navigation.navigate('Triage')} />
            <Button
              title="Book Consultation"
              onPress={() => rootNavigation.navigate('BookConsultation')}
              variant="secondary"
            />
            <Button
              title="View Prescriptions"
              onPress={() => rootNavigation.navigate('Prescription')}
              variant="secondary"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today at a glance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>4 min</Text>
              <Text style={styles.statLabel}>Average triage time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>1 upcoming</Text>
              <Text style={styles.statLabel}>Consultation booked</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionCard}>
            <Text style={styles.planName}>{user?.subscription.tier ?? 'free'} plan</Text>
            <Text style={styles.subscriptionCopy}>
              Active coverage includes AI triage, consultation booking, and medication reminders.
            </Text>
          </View>
        </View>
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
  headerCard: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  greeting: {
    color: '#DCEBFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  title: {
    color: colors.surface,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: '#E7F0FF',
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  subscriptionCard: {
    backgroundColor: '#EAF7F0',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  planName: {
    color: colors.success,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    textTransform: 'capitalize',
  },
  subscriptionCopy: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
