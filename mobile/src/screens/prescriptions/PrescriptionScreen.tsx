import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {EmptyState} from '../../components/EmptyState';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {useToast} from '../../components/ToastProvider';
import {prescriptionService} from '../../services/prescriptionService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {formatDate} from '../../utils/formatDate';
import type {Prescription} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Prescription'>;

export const PrescriptionScreen = ({route}: Props) => {
  const {showToast} = useToast();
  const [prescription, setPrescription] = useState<Prescription | null>(route.params?.prescription ?? null);
  const [loading, setLoading] = useState(Boolean(route.params?.consultationId && !route.params?.prescription));

  useEffect(() => {
    const load = async () => {
      if (!route.params?.consultationId || route.params?.prescription) {
        return;
      }
      try {
        const result = await prescriptionService.getByConsultation(route.params.consultationId);
        setPrescription(result);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Prescription not found.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [route.params?.consultationId, route.params?.prescription, showToast]);

  if (loading) {
    return <LoadingSpinner label="Loading prescription..." fullScreen />;
  }

  if (!prescription) {
    return (
      <View style={[styles.safeArea, styles.centered]}>
        <EmptyState title="No prescription yet" description="Prescriptions will appear here after your doctor issues them." />
      </View>
    );
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.medication}>Prescription Summary</Text>
        <Text style={styles.subtext}>Issued {formatDate(prescription.createdAt)}</Text>
      </View>
      {prescription.drugs.map(drug => (
        <View key={drug.id} style={styles.card}>
          <Text style={styles.label}>{drug.name}</Text>
          <Text style={styles.value}>Dosage: {drug.dosage}</Text>
          <Text style={styles.value}>Duration: {drug.duration}</Text>
          <Text style={styles.value}>Frequency: {drug.frequency}</Text>
          <Text style={styles.value}>Instructions: {drug.instructions}</Text>
        </View>
      ))}
      <Button title="Buy from Pharmacy" variant="secondary" onPress={() => showToast('Pharmacy integration placeholder.', 'info')} />
      <Button title="Download PDF" onPress={() => showToast('PDF export placeholder.', 'info')} />
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  centered: {justifyContent: 'center'},
  container: {padding: spacing.lg, gap: spacing.lg},
  heroCard: {backgroundColor: '#EAF7F0', borderRadius: 24, padding: spacing.xl, gap: spacing.sm},
  medication: {color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold},
  subtext: {color: colors.textSecondary, fontSize: typography.sizes.sm},
  card: {backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, gap: spacing.xs},
  label: {color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold},
  value: {color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20},
});
