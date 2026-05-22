import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {EmptyState} from '../../components/EmptyState';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {useToast} from '../../components/ToastProvider';
import {triageService} from '../../services/triageService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {ProgressEntry} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

export const ProgressScreen = (_props: Props) => {
  const {showToast} = useToast();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [currentSymptoms, setCurrentSymptoms] = useState('');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [improvementRating, setImprovementRating] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = useCallback(async () => {
    const result = await triageService.getProgressEntries();
    setEntries(result);
  }, []);

  useFocusEffect(useCallback(() => { loadEntries(); }, [loadEntries]));

  const submit = async () => {
    try {
      setSubmitting(true);
      await triageService.submitProgress({currentSymptoms, improvementRating, newSymptoms});
      setCurrentSymptoms('');
      setNewSymptoms('');
      setImprovementRating(3);
      await loadEntries();
      showToast('Progress check-in saved.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save progress.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Daily check-in</Text>
        <TextInput multiline style={[styles.input, styles.textArea]} value={currentSymptoms} onChangeText={setCurrentSymptoms} placeholder="Current symptoms" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.label}>Improvement rating</Text>
        <View style={styles.ratingRow}>
          {[1,2,3,4,5].map(value => (
            <Pressable key={value} onPress={() => setImprovementRating(value)} style={[styles.ratingChip, improvementRating === value && styles.ratingChipSelected]}><Text style={[styles.ratingText, improvementRating === value && styles.ratingTextSelected]}>{value}</Text></Pressable>
          ))}
        </View>
        <TextInput multiline style={[styles.input, styles.textArea]} value={newSymptoms} onChangeText={setNewSymptoms} placeholder="New symptoms" placeholderTextColor={colors.textSecondary} />
        <Button title="Save check-in" onPress={submit} loading={submitting} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Progress chart</Text>
        {entries.length ? entries.slice(0, 5).map(entry => (
          <View key={entry.id} style={styles.chartRow}>
            <Text style={styles.chartLabel}>{entry.currentSymptoms.slice(0, 18) || 'Check-in'}</Text>
            <View style={styles.chartTrack}><View style={[styles.chartFill, {width: `${entry.improvementRating * 20}%`}]} /></View>
          </View>
        )) : <EmptyState title="No progress entries yet" description="Your check-ins will appear here to show how symptoms are changing." />}
      </View>
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {padding: spacing.lg, gap: spacing.lg},
  card: {backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, gap: spacing.md},
  title: {color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold},
  label: {color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold},
  input: {borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text},
  textArea: {minHeight: 110, textAlignVertical: 'top'},
  ratingRow: {flexDirection: 'row', gap: spacing.sm},
  ratingChip: {borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
  ratingChipSelected: {backgroundColor: colors.primary, borderColor: colors.primary},
  ratingText: {color: colors.textSecondary},
  ratingTextSelected: {color: colors.white, fontWeight: typography.weights.semibold},
  chartRow: {gap: spacing.xs},
  chartLabel: {color: colors.textSecondary, fontSize: typography.sizes.sm},
  chartTrack: {height: 10, backgroundColor: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden'},
  chartFill: {height: '100%', backgroundColor: colors.accent},
});
