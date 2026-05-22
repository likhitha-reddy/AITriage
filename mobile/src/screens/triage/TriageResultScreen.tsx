import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {useTriageStore} from '../../store/triageStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {formatDate} from '../../utils/formatDate';
import type {RootStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TriageResult'>;

export const TriageResultScreen = ({navigation, route}: Props) => {
  const storedResult = useTriageStore(state => state.lastResult);
  const result = route.params.result ?? storedResult;

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.title}>No triage result available</Text>
          <Button title="Start New Triage" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.urgencyLabel}>{result.urgency.toUpperCase()} URGENCY</Text>
          <Text style={styles.summary}>{result.summary}</Text>
          <Text style={styles.timestamp}>Updated {formatDate(result.createdAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Possible diagnoses</Text>
          {result.possibleDiagnoses.map(item => (
            <View key={item.id} style={styles.listCard}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemMeta}>{Math.round(item.confidence * 100)}% confidence</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended action</Text>
          <View style={styles.listCard}>
            <Text style={styles.itemDescription}>{result.recommendedAction}</Text>
            <Text style={styles.itemMeta}>Follow up: {result.followUpWindow}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care tips</Text>
          {result.careTips.map(tip => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <Button title="Book Consultation" onPress={() => navigation.navigate('BookConsultation')} />
        <Button title="Back to Triage" onPress={() => navigation.goBack()} variant="secondary" />
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  urgencyLabel: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  summary: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: 30,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  itemMeta: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
  },
  itemDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  bullet: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
