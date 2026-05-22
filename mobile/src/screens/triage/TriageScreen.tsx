import React from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {SymptomInput} from '../../components/SymptomInput';
import {triageService} from '../../services/triageService';
import {useTriageStore} from '../../store/triageStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {MainTabParamList, RootStackParamList} from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Triage'>;

export const TriageScreen = (_props: Props) => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    description,
    imageUris,
    isSubmitting,
    setDescription,
    setImages,
    setResult,
    setSubmitting,
  } = useTriageStore();

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Describe your symptoms', 'Add a short description before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await triageService.submitSymptoms({
        description,
        imageUris,
      });
      setResult(result);
      rootNavigation.navigate('TriageResult', {result});
    } catch (error) {
      Alert.alert('Unable to process triage', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us how you feel</Text>
          <Text style={styles.subtitle}>
            Share symptoms, upload a photo, and receive a guided next step in minutes.
          </Text>
        </View>

        <SymptomInput
          description={description}
          onDescriptionChange={setDescription}
          imageUris={imageUris}
          onImagesChange={setImages}
        />

        <Button title="Submit for AI Triage" onPress={handleSubmit} loading={isSubmitting} />
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
  header: {
    gap: spacing.sm,
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
});
