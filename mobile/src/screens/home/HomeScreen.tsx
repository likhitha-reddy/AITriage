import React, {useCallback, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {EmptyState} from '../../components/EmptyState';
import {Skeleton} from '../../components/Skeleton';
import {consultationService} from '../../services/consultationService';
import {patientService} from '../../services/patientService';
import {subscriptionService} from '../../services/subscriptionService';
import {triageService} from '../../services/triageService';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {formatDate} from '../../utils/formatDate';
import type {MainTabParamList, RootStackParamList} from '../../navigation/types';
import type {Consultation, Subscription, TriageResult} from '../../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export const HomeScreen = ({navigation}: Props) => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [recentResults, setRecentResults] = useState<TriageResult[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [profile, nextSubscription, triageResults, consultations] = await Promise.all([
        patientService.getProfile(),
        subscriptionService.getStatus(),
        triageService.getRecentResults(),
        consultationService.listConsultations(),
      ]);

      setUser(profile);
      setSubscription(nextSubscription);
      setRecentResults(triageResults.slice(0, 2));
      setUpcomingConsultations(
        consultations.filter(item => item.status === 'scheduled').slice(0, 2),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} />}>
      <View style={styles.headerCard}>
        <Text style={styles.greeting}>Hello, {user?.firstName ?? 'there'}</Text>
        <Text style={styles.title}>Your care dashboard is live.</Text>
        <Text style={styles.subtitle}>
          Review your plan, continue progress tracking, or start a new triage in seconds.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.buttonGroup}>
          <Button title="Start Triage" onPress={() => navigation.navigate('Triage')} />
          <Button title="Progress Check-In" onPress={() => rootNavigation.navigate('Progress')} variant="secondary" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        {loading ? (
          <Skeleton height={104} />
        ) : (
          <View style={styles.subscriptionCard}>
            <Text style={styles.planName}>{(subscription?.plan ?? user?.subscriptionTier ?? 'free').toUpperCase()} PLAN</Text>
            <Text style={styles.subscriptionCopy}>
              {subscription ? `Active until ${formatDate(subscription.expiresAt)}` : 'No paid plan active yet.'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent triage results</Text>
        {loading ? (
          <Skeleton height={156} />
        ) : recentResults.length ? (
          recentResults.map(result => (
            <View key={result.id} style={styles.card}>
              <Text style={styles.cardTitle}>{result.recommendedSpecialization}</Text>
              <Text style={styles.cardBody}>{result.summary}</Text>
              <Text style={styles.metaText}>{formatDate(result.createdAt)}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="Start your first triage" description="Answer a few symptom questions to unlock personalized next steps." />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming consultations</Text>
        {loading ? (
          <Skeleton height={156} />
        ) : upcomingConsultations.length ? (
          upcomingConsultations.map(item => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.doctor?.name ?? 'Care team clinician'}</Text>
              <Text style={styles.cardBody}>{item.doctor?.specialization ?? 'Consultation'}</Text>
              <Text style={styles.metaText}>{formatDate(item.scheduledAt)}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="No consultations yet" description="Book a consultation directly after your next symptom triage." />
        )}
      </View>
    </ScrollView>
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
    color: colors.white,
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
  },
  subscriptionCopy: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  cardBody: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  metaText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
});
