import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Button} from './Button';
import type {Consultation} from '../types';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';
import {formatDate} from '../utils/formatDate';

interface ConsultationCardProps {
  consultation: Consultation;
  onCancel?: () => void;
  onViewPrescription?: () => void;
}

export const ConsultationCard = ({
  consultation,
  onCancel,
  onViewPrescription,
}: ConsultationCardProps) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text style={styles.doctor}>{consultation.doctor?.name ?? 'Assigned clinician'}</Text>
        <Text style={styles.specialization}>
          {consultation.doctor?.specialization ?? 'Consultation'}
        </Text>
      </View>
      <View style={[styles.badge, badgeStyles[consultation.status]]}>
        <Text style={styles.badgeText}>{consultation.status.toUpperCase()}</Text>
      </View>
    </View>

    <Text style={styles.reason}>{consultation.notes ?? 'Care review requested.'}</Text>
    <Text style={styles.meta}>Scheduled for {formatDate(consultation.scheduledAt)}</Text>

    {(onCancel || onViewPrescription) ? (
      <View style={styles.actions}>
        {onViewPrescription ? (
          <Button title="View Prescription" variant="secondary" onPress={onViewPrescription} />
        ) : null}
        {onCancel ? <Button title="Cancel" variant="ghost" onPress={onCancel} /> : null}
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
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
    marginTop: spacing.xs,
  },
  reason: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  scheduled: {
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
  scheduled: styles.scheduled,
  completed: styles.completed,
  cancelled: styles.cancelled,
};
