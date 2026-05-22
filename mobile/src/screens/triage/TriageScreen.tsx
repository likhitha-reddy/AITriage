import React, {useEffect} from 'react';
import {Image, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import {Button} from '../../components/Button';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {useToast} from '../../components/ToastProvider';
import {triageService} from '../../services/triageService';
import {useTriageStore} from '../../store/triageStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {RootStackParamList} from '../../navigation/types';
import type {CareCategory, PickedImage} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TriageInput'>;

const labels: Record<CareCategory, string> = {
  general: 'General Health',
  mental_health: 'Mental Health',
  dermatology: 'Dermatology',
};

export const TriageScreen = ({navigation, route}: Props) => {
  const {showToast} = useToast();
  const {
    category,
    symptomsText,
    images,
    medicalHistory,
    isSubmitting,
    setCategory,
    setSymptomsText,
    setImages,
    setMedicalHistory,
    setResult,
    setSubmitting,
  } = useTriageStore();

  useEffect(() => {
    if (route.params?.category) {
      setCategory(route.params.category);
    }
  }, [route.params?.category, setCategory]);

  const attachImages = async (picker: 'camera' | 'library') => {
    const response = picker === 'camera'
      ? await launchCamera({mediaType: 'photo', quality: 0.8})
      : await launchImageLibrary({mediaType: 'photo', selectionLimit: 3, quality: 0.8});

    if (response.errorMessage) {
      showToast(response.errorMessage, 'error');
      return;
    }

    const picked = (response.assets ?? [])
      .map<PickedImage | null>(asset =>
        asset.uri
          ? {
              uri: asset.uri,
              name: asset.fileName,
              type: asset.type,
              source: picker,
            }
          : null,
      )
      .filter((item): item is PickedImage => Boolean(item));

    if (picked.length) {
      setImages([...images, ...picked].slice(0, 3));
    }
  };

  const handleSubmit = async () => {
    if (!symptomsText.trim()) {
      showToast('Describe your symptoms before submitting.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const result = await triageService.submitSymptoms({
        category,
        symptomsText,
        images,
        medicalHistory,
      });
      setResult(result);
      navigation.navigate('TriageResult', {result});
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to process triage.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us how you feel</Text>
      <Text style={styles.subtitle}>Your information stays secure and powers a more accurate AI-assisted triage review.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Category</Text>
        <View style={styles.chips}>
          {(['general', 'mental_health', 'dermatology'] as CareCategory[]).map(option => (
            <Pressable
              key={option}
              onPress={() => setCategory(option)}
              style={[styles.chip, option == category && styles.chipSelected]}>
              <Text style={[styles.chipText, option == category && styles.chipTextSelected]}>{labels[option]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Symptoms</Text>
        <TextInput
          multiline
          value={symptomsText}
          onChangeText={setSymptomsText}
          style={styles.textArea}
          placeholder="What are you feeling? When did it start? What makes it better or worse?"
          placeholderTextColor={colors.textSecondary}
          textAlignVertical="top"
        />
        <Button title="Speech to text" subtitle="Placeholder for voice capture" variant="secondary" onPress={() => showToast('Speech capture will be connected next.', 'info')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Images</Text>
        <View style={styles.buttonRow}>
          <Button title="Open Camera" variant="secondary" onPress={() => attachImages('camera')} />
          <Button title="Open Gallery" variant="secondary" onPress={() => attachImages('library')} />
        </View>
        <View style={styles.previewRow}>
          {images.map(image => (
            <Image key={image.uri} source={{uri: image.uri}} style={styles.previewImage} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Medical history</Text>
        <TextInput style={styles.input} value={medicalHistory.allergies} onChangeText={value => setMedicalHistory({allergies: value})} placeholder="Allergies" placeholderTextColor={colors.textSecondary} />
        <TextInput style={styles.input} value={medicalHistory.currentMedications} onChangeText={value => setMedicalHistory({currentMedications: value})} placeholder="Current medications" placeholderTextColor={colors.textSecondary} />
      </View>

      <Button title="Submit for AI Triage" subtitle={isSubmitting ? 'Analyzing symptoms...' : undefined} onPress={handleSubmit} loading={isSubmitting} />
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  buttonRow: {
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  previewImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
  },
});
