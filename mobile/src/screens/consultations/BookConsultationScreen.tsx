import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {DoctorCard} from '../../components/DoctorCard';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {consultationService} from '../../services/consultationService';
import {doctorService} from '../../services/doctorService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {Doctor} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookConsultation'>;
const DEFAULT_SLOT = '2026-05-22T12:22:01Z';

export const BookConsultationScreen = ({navigation, route}: Props) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(route.params?.doctorId ?? '');
  const [reason, setReason] = useState('Follow-up on AI triage recommendation');
  const [scheduledAt, setScheduledAt] = useState(DEFAULT_SLOT);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const result = await doctorService.listDoctors();
        setDoctors(result);
        if (!route.params?.doctorId && result[0]) {
          setSelectedDoctorId(result[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [route.params?.doctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find(item => item.id === selectedDoctorId),
    [doctors, selectedDoctorId],
  );

  const handleBooking = async () => {
    if (!selectedDoctorId || !reason.trim() || !scheduledAt.trim()) {
      Alert.alert('Missing details', 'Choose a doctor, time, and reason to continue.');
      return;
    }

    try {
      setBooking(true);
      await consultationService.bookConsultation({
        doctorId: selectedDoctorId,
        scheduledAt,
        reason: reason.trim(),
      });
      Alert.alert('Consultation booked', 'Your visit is ready and added to the consultation list.');
      navigation.navigate('Tabs', {screen: 'Consultations'});
    } catch (error) {
      Alert.alert('Unable to book', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading doctors..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>Choose a clinician</Text>
          <Text style={styles.subtitle}>
            Select a provider that matches your care needs and confirm a visit time.
          </Text>
        </View>

        <View style={styles.section}>
          {doctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              selected={doctor.id === selectedDoctorId}
              onPress={() => setSelectedDoctorId(doctor.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Visit reason</Text>
          <TextInput
            multiline
            style={[styles.input, styles.multilineInput]}
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Preferred slot</Text>
          <TextInput style={styles.input} value={scheduledAt} onChangeText={setScheduledAt} />
          {selectedDoctor ? (
            <Text style={styles.helper}>
              Earliest available with {selectedDoctor.name}: {selectedDoctor.availableSlots[0]}
            </Text>
          ) : null}
        </View>

        <Button title="Confirm Booking" onPress={handleBooking} loading={booking} />
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
  section: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 110,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
