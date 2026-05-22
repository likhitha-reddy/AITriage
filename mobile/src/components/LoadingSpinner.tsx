import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({
  label = 'Loading...',
  fullScreen = false,
}: LoadingSpinnerProps) => (
  <View style={[styles.container, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
