import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {RootStackParamList} from '../../navigation/types';
import type {PostCallRating} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PostCall'>;

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, '0')}s`;
};

export const PostCallScreen = ({navigation, route}: Props) => {
  const [rating, setRating] = useState(5);
  const {consultationId, doctorName = 'Care Team Doctor', durationSeconds} = route.params;

  const ratingPayload = useMemo<PostCallRating>(
    () => ({
      consultationId,
      rating,
      createdAt: new Date().toISOString(),
    }),
    [consultationId, rating],
  );

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Consultation Complete</Text>
        <Text style={styles.heroSubtitle}>Thanks for meeting with {doctorName}. Your prescription will be available shortly.</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Call Summary</Text>
        <Text style={styles.summaryText}>Duration: {formatDuration(durationSeconds)}</Text>
        <Text style={styles.summaryText}>Status: Consultation completed successfully</Text>
      </View>

      <View style={styles.ratingCard}>
        <Text style={styles.sectionTitle}>Rate your experience</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(value => (
            <Pressable key={value} onPress={() => setRating(value)} style={styles.starButton}>
              <Text style={[styles.star, value <= rating ? styles.starFilled : styles.starEmpty]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.ratingCopy}>Selected rating: {ratingPayload.rating}/5</Text>
      </View>

      <Button title="Go to Home" onPress={() => navigation.navigate('Tabs', {screen: 'Home'})} />
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: '#EAF7F0',
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.success,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starButton: {
    padding: spacing.sm,
  },
  star: {
    fontSize: 36,
  },
  starFilled: {
    color: '#F5B700',
  },
  starEmpty: {
    color: colors.border,
  },
  ratingCopy: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
