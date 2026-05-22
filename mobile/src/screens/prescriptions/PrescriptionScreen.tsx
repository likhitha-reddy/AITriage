import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {formatDate} from '../../utils/formatDate';
import type {Prescription} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Prescription'>;

const fallbackPrescription: Prescription = {
  id: 'prescription-001',
  medicationName: 'Hydrocortisone 1% Cream',
  dosage: 'Apply thin layer',
  frequency: 'Twice daily',
  duration: '7 days',
  instructions: 'Apply to the affected area after cleansing. Avoid broken skin and discontinue if irritation worsens.',
  prescribedBy: 'Dr. Maya Chen',
  issuedAt: '2026-05-22T12:22:01Z',
  refillAvailable: true,
};

export const PrescriptionScreen = ({route}: Props) => {
  const prescription = route.params?.prescription ?? fallbackPrescription;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.medication}>{prescription.medicationName}</Text>
          <Text style={styles.subtext}>Issued {formatDate(prescription.issuedAt)}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Dosage</Text>
          <Text style={styles.detailValue}>{prescription.dosage}</Text>

          <Text style={styles.detailLabel}>Frequency</Text>
          <Text style={styles.detailValue}>{prescription.frequency}</Text>

          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{prescription.duration}</Text>

          <Text style={styles.detailLabel}>Instructions</Text>
          <Text style={styles.detailValue}>{prescription.instructions}</Text>

          <Text style={styles.detailLabel}>Prescribed by</Text>
          <Text style={styles.detailValue}>{prescription.prescribedBy}</Text>
        </View>

        <Button
          title={prescription.refillAvailable ? 'Order Refill' : 'Refill Unavailable'}
          onPress={() => undefined}
          disabled={!prescription.refillAvailable}
        />
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
  heroCard: {
    backgroundColor: '#EAF7F0',
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  medication: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  detailLabel: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
  },
  detailValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
});
