import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {EmptyState} from '../../components/EmptyState';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {triageService} from '../../services/triageService';
import {useTriageStore} from '../../store/triageStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {formatDate} from '../../utils/formatDate';
import type {RootStackParamList} from '../../navigation/types';
import type {TriageResult} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TriageResult'>;

export const TriageResultScreen = ({navigation, route}: Props) => {
  const storedResult = useTriageStore(state => state.lastResult);
  const [result, setResult] = useState<TriageResult | null>(route.params.result ?? storedResult ?? null);
  const [loading, setLoading] = useState(Boolean(route.params.triageId && !route.params.result));

  useEffect(() => {
    const load = async () => {
      if (!route.params.triageId || route.params.result) {
        return;
      }
      try {
        const fetched = await triageService.getTriageResult(route.params.triageId);
        setResult(fetched);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [route.params.result, route.params.triageId]);

  const severityColor = useMemo(() => {
    if (!result) {
      return colors.primary;
    }
    if (result.severity === 'red') {
      return colors.severityRed;
    }
    if (result.severity === 'orange') {
      return colors.severityOrange;
    }
    if (result.severity === 'yellow') {
      return colors.severityYellow;
    }
    return colors.severityGreen;
  }, [result]);

  if (loading) {
    return <LoadingSpinner label="Loading triage result..." fullScreen />;
  }

  if (!result) {
    return (
      <View style={[styles.container, styles.centered]}>
        <EmptyState title="No triage result yet" description="Complete a symptom triage to unlock AI guidance and next steps." />
      </View>
    );
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={[styles.heroCard, {borderColor: severityColor}]}> 
        <Text style={[styles.severity, {color: severityColor}]}>{result.severity.toUpperCase()} PRIORITY</Text>
        <Text style={styles.summary}>{result.summary}</Text>
        <Text style={styles.timestamp}>Updated {formatDate(result.createdAt)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Possible diagnoses</Text>
        {result.possibleDiagnoses.map(item => (
          <View key={item.id} style={styles.diagnosisCard}>
            <View style={styles.diagnosisHeader}>
              <Text style={styles.diagnosisTitle}>{item.name}</Text>
              <Text style={styles.confidence}>{Math.round(item.confidence * 100)}%</Text>
            </View>
            <View style={styles.barTrack}><View style={[styles.barFill, {width: `${Math.round(item.confidence * 100)}%`}]} /></View>
            <Text style={styles.bodyText}>{item.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended action</Text>
        <Text style={styles.bodyText}>{result.recommendedAction}</Text>
        <Text style={styles.meta}>Follow-up window: {result.followUpWindow}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Care tips</Text>
        {result.careTips.map(tip => <Text key={tip} style={styles.tip}>• {tip}</Text>)}
      </View>

      {result.crisisSupport?.length ? (
        <View style={styles.crisisCard}>
          <Text style={styles.sectionTitle}>Immediate crisis support</Text>
          {result.crisisSupport.map(item => <Text key={item} style={styles.tip}>• {item}</Text>)}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.disclaimer}>Safety disclaimer: AI triage is informational only and does not replace emergency care or clinician judgment.</Text>
      </View>

      <Button title="Book Consultation" onPress={() => navigation.navigate('BookConsultation', {specialization: result.recommendedSpecialization, triageResultId: result.id, notes: `Follow-up for ${result.recommendedSpecialization} recommendation`})} />
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {padding: spacing.lg, gap: spacing.lg},
  centered: {flex: 1, justifyContent: 'center', backgroundColor: colors.background},
  heroCard: {backgroundColor: colors.surface, borderRadius: 24, padding: spacing.xl, gap: spacing.sm, borderWidth: 2},
  severity: {fontSize: typography.sizes.sm, fontWeight: typography.weights.bold},
  summary: {color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, lineHeight: 28},
  timestamp: {color: colors.textSecondary, fontSize: typography.sizes.sm},
  section: {backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, gap: spacing.sm},
  sectionTitle: {color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold},
  diagnosisCard: {gap: spacing.xs},
  diagnosisHeader: {flexDirection: 'row', justifyContent: 'space-between'},
  diagnosisTitle: {color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold},
  confidence: {color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold},
  barTrack: {height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden'},
  barFill: {height: '100%', backgroundColor: colors.primary, borderRadius: 999},
  bodyText: {color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20},
  meta: {color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold},
  tip: {color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20},
  crisisCard: {backgroundColor: '#FFF1F1', borderRadius: 20, padding: spacing.lg, gap: spacing.sm},
  disclaimer: {color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20},
});
