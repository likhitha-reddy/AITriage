import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';

import {Button} from './Button';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface SymptomInputProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  imageUris: string[];
  onImagesChange: (value: string[]) => void;
}

export const SymptomInput = ({
  description,
  onDescriptionChange,
  imageUris,
  onImagesChange,
}: SymptomInputProps) => {
  const handleSelectImages = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 3,
      quality: 0.8,
    });

    if (response.errorMessage) {
      Alert.alert('Unable to open library', response.errorMessage);
      return;
    }

    const selectedUris = response.assets
      ?.map(asset => asset.uri)
      .filter((uri): uri is string => Boolean(uri));

    if (selectedUris?.length) {
      onImagesChange(selectedUris);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Describe your symptoms</Text>
      <TextInput
        multiline
        numberOfLines={6}
        placeholder="Tell us what you are feeling, when it started, and what makes it better or worse."
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={description}
        onChangeText={onDescriptionChange}
        textAlignVertical="top"
      />

      <View style={styles.photoHeader}>
        <View>
          <Text style={styles.label}>Add symptom photos</Text>
          <Text style={styles.helper}>Upload up to 3 images for better triage context.</Text>
        </View>
        <Button title="Choose Photos" onPress={handleSelectImages} variant="secondary" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
        {imageUris.length > 0 ? (
          imageUris.map(uri => <Image key={uri} source={{uri}} style={styles.previewImage} />)
        ) : (
          <Text style={styles.emptyState}>No photos selected yet.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    fontSize: typography.sizes.md,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewRow: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  previewImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
