import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {MainTabParamList, RootStackParamList} from '../../navigation/types';
import type {CareCategory} from '../../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Triage'>;

const options: {label: string; subtitle: string; icon: string; value: CareCategory}[] = [
  {label: 'Mental Health', subtitle: 'Mood, anxiety, stress, and sleep support', icon: '🧠', value: 'mental_health'},
  {label: 'Dermatology', subtitle: 'Skin concerns, rashes, irritation, and photos', icon: '🩺', value: 'dermatology'},
  {label: 'General Health', subtitle: 'Everyday symptoms, pain, cough, and recovery', icon: '🏥', value: 'general'},
];

export const TriageCategoryScreen = (_props: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your symptom area</Text>
      <Text style={styles.subtitle}>Start with the category that best matches what you want reviewed today.</Text>
      {options.map(option => (
        <Pressable
          key={option.value}
          style={styles.card}
          onPress={() => navigation.navigate('TriageInput', {category: option.value})}>
          <Text style={styles.icon}>{option.icon}</Text>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{option.label}</Text>
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
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
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
