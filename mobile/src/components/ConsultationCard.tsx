import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import type {Consultation} from '../types';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';
import {formatDate} from '../utils/formatDate';

interface ConsultationCardProps {
  consultation: Consultation;
}

export const ConsultationCard = ({consultation}: ConsultationCardProps) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View>
        <Text style={styles.doctor}>{consultation.doctor.name}</Text>
        <Text style={styles.specialization}>{consultation.doctor.specialization}</Text>
      </View>
      <View style={[styles.badge, badgeStyles[consultation.status]]}>
        <Text style={styles.badgeText}>{consultation.status.toUpperCase()}</Text>
      </View>
    </View>

    <Text style={styles.reason}>{consultation.reason}</Text>
    <Text style={styles.meta}>Scheduled for {formatDate(consultation.scheduledAt)}</Text>
    {consultation.notes ? <Text style={styles.notes}>{consultation.notes}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  doctor: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  specialization: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
  },
  reason: {
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.surface,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  upcoming: {
    backgroundColor: colors.primary,
  },
  completed: {
    backgroundColor: colors.success,
  },
  cancelled: {
    backgroundColor: colors.danger,
  },
});

const badgeStyles = {
  upcoming: styles.upcoming,
  completed: styles.completed,
  cancelled: styles.cancelled,
};
