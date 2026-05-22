import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {DoctorCard} from '../../components/DoctorCard';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {PaymentButton} from '../../components/PaymentButton';
import {useToast} from '../../components/ToastProvider';
import {consultationService} from '../../services/consultationService';
import {doctorService} from '../../services/doctorService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {RootStackParamList} from '../../navigation/types';
import type {Doctor} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookConsultation'>;

export const BookConsultationScreen = ({navigation, route}: Props) => {
  const {showToast} = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(route.params?.doctorId ?? '');
  const [notes, setNotes] = useState(route.params?.notes ?? 'AI triage follow-up');
  const [selectedDate, setSelectedDate] = useState('2026-05-22');
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [sortBy, setSortBy] = useState<'rating' | 'fee'>('rating');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await doctorService.listDoctors({
          specialization: route.params?.specialization,
          available: true,
        });
        setDoctors(result);
        if (!route.params?.doctorId && result[0]) {
          setSelectedDoctorId(result[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [route.params?.doctorId, route.params?.specialization]);

  const sortedDoctors = useMemo(
    () => [...doctors].sort((left, right) => sortBy === 'rating' ? right.rating - left.rating : left.fee - right.fee),
    [doctors, sortBy],
  );

  const selectedDoctor = useMemo(
    () => doctors.find(doctor => doctor.id === selectedDoctorId),
    [doctors, selectedDoctorId],
  );

  const handleBooking = async () => {
    if (!selectedDoctorId || !notes.trim()) {
      showToast('Choose a doctor and add notes to continue.', 'error');
      return;
    }

    try {
      setBooking(true);
      const scheduledAt = `${selectedDate}T${selectedTime}:00Z`;
      await consultationService.bookConsultation({
        doctorId: selectedDoctorId,
        scheduledAt,
        notes,
        triageResultId: route.params?.triageResultId,
      });
      showToast('Consultation booked successfully.', 'success');
      navigation.navigate('Tabs', {screen: 'Consultations'});
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to book consultation.', 'error');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading doctors..." fullScreen />;
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <Text style={styles.title}>Book a consultation</Text>
      <Text style={styles.subtitle}>Specialization: {route.params?.specialization ?? 'General Health'}</Text>

      <View style={styles.section}>
        <View style={styles.sortRow}>
          <Pressable onPress={() => setSortBy('rating')} style={[styles.sortChip, sortBy === 'rating' && styles.sortSelected]}>
            <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextSelected]}>Top rated</Text>
          </Pressable>
          <Pressable onPress={() => setSortBy('fee')} style={[styles.sortChip, sortBy === 'fee' && styles.sortSelected]}>
            <Text style={[styles.sortText, sortBy === 'fee' && styles.sortTextSelected]}>Lowest fee</Text>
          </Pressable>
        </View>
        {sortedDoctors.map(doctor => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            selected={doctor.id === selectedDoctorId}
            onPress={() => setSelectedDoctorId(doctor.id)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={selectedDate} onChangeText={setSelectedDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.label}>Time</Text>
        <TextInput style={styles.input} value={selectedTime} onChangeText={setSelectedTime} placeholder="HH:MM" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.label}>Visit notes</Text>
        <TextInput multiline style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="What would you like the doctor to know?" placeholderTextColor={colors.textSecondary} />
      </View>

      {selectedDoctor ? (
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Consultation checkout</Text>
          <Text style={styles.paymentCopy}>{selectedDoctor.name} • {selectedDate} at {selectedTime}</Text>
          <Text style={styles.paymentFee}>Fee: ₹{selectedDoctor.fee.toLocaleString('en-IN')}</Text>
          <PaymentButton
            amount={selectedDoctor.fee}
            label={`Pay ₹${selectedDoctor.fee.toLocaleString('en-IN')}`}
            loading={booking}
            alertMessage="Payment integration coming soon! Your consultation has been booked."
            onPaymentComplete={handleBooking}
          />
          <Text style={styles.paymentHint}>No payment will be charged yet. We will still reserve your slot now.</Text>
        </View>
      ) : null}
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {padding: spacing.lg, gap: spacing.lg},
  title: {color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold},
  subtitle: {color: colors.textSecondary, fontSize: typography.sizes.sm},
  section: {gap: spacing.md},
  sortRow: {flexDirection: 'row', gap: spacing.sm},
  sortChip: {borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
  sortSelected: {backgroundColor: colors.primary, borderColor: colors.primary},
  sortText: {color: colors.textSecondary, fontSize: typography.sizes.sm},
  sortTextSelected: {color: colors.white, fontWeight: typography.weights.semibold},
  label: {color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold},
  input: {borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text},
  textArea: {minHeight: 110, textAlignVertical: 'top'},
  paymentCard: {
    backgroundColor: '#EAF2FF',
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  paymentTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  paymentCopy: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  paymentFee: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  paymentHint: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
