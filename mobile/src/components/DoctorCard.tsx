import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {Doctor} from '../types';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface DoctorCardProps {
  doctor: Doctor;
  selected?: boolean;
  onPress?: () => void;
}

export const DoctorCard = ({doctor, selected = false, onPress}: DoctorCardProps) => (
  <Pressable
    onPress={onPress}
    style={[styles.card, selected && styles.selectedCard]}>
    <View style={styles.header}>
      <View>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialization}>{doctor.specialization}</Text>
      </View>
      <Text style={styles.rating}>★ {doctor.rating.toFixed(1)}</Text>
    </View>

    <Text style={styles.bio}>{doctor.bio}</Text>

    <View style={styles.footer}>
      <Text style={styles.meta}>{doctor.experienceYears} yrs experience</Text>
      <Text style={styles.fee}>${doctor.fee}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#F0F6FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  specialization: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  rating: {
    color: colors.warning,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  fee: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
