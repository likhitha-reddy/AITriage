import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Button} from './Button';
import type {Consultation, VideoSession} from '../types';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';
import {formatDate} from '../utils/formatDate';

interface ConsultationCardProps {
  consultation: Consultation;
  callStatus?: VideoSession['status'];
  onCancel?: () => void;
  onJoinCall?: () => void;
  onViewPrescription?: () => void;
}

const callBadgeLabel: Record<VideoSession['status'], string> = {
  waiting: 'WAITING',
  connecting: 'CONNECTING',
  active: 'ACTIVE',
  ended: 'ENDED',
};

export const ConsultationCard = ({
  consultation,
  callStatus,
  onCancel,
  onJoinCall,
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
      <View style={styles.badgeRow}>
        <View style={[styles.badge, badgeStyles[consultation.status]]}>
          <Text style={styles.badgeText}>{consultation.status.toUpperCase()}</Text>
        </View>
        {callStatus ? (
          <View style={[styles.badge, callBadgeStyles[callStatus]]}>
            <Text style={styles.badgeText}>{callBadgeLabel[callStatus]}</Text>
          </View>
        ) : null}
      </View>
    </View>

    <Text style={styles.reason}>{consultation.notes ?? 'Care review requested.'}</Text>
    <Text style={styles.meta}>Scheduled for {formatDate(consultation.scheduledAt)}</Text>

    {(onJoinCall || onCancel || onViewPrescription) ? (
      <View style={styles.actions}>
        {onJoinCall ? <Button title="Join Call" onPress={onJoinCall} /> : null}
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
  badgeRow: {
    alignItems: 'flex-end',
    gap: spacing.xs,
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
    flexWrap: 'wrap',
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
  waiting: {
    backgroundColor: colors.warning,
  },
  connecting: {
    backgroundColor: colors.info,
  },
  active: {
    backgroundColor: colors.success,
  },
  ended: {
    backgroundColor: '#6C7A89',
  },
});

const badgeStyles = {
  scheduled: styles.scheduled,
  completed: styles.completed,
  cancelled: styles.cancelled,
  in_progress: styles.scheduled,
};

const callBadgeStyles = {
  waiting: styles.waiting,
  connecting: styles.connecting,
  active: styles.active,
  ended: styles.ended,
};
