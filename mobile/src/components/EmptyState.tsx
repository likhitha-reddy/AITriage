import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState = ({title, description}: EmptyStateProps) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
