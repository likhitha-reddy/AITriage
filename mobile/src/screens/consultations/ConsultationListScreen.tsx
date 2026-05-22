import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {ConsultationCard} from '../../components/ConsultationCard';
import {EmptyState} from '../../components/EmptyState';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {useToast} from '../../components/ToastProvider';
import {consultationService} from '../../services/consultationService';
import {videoService} from '../../services/videoService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {CURRENT_DATETIME} from '../../utils/constants';
import type {Consultation, VideoSession} from '../../types';
import type {MainTabParamList, RootStackParamList} from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Consultations'>;
type TabKey = 'upcoming' | 'past' | 'cancelled';

export const ConsultationListScreen = (_props: Props) => {
  const {showToast} = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [callStatuses, setCallStatuses] = useState<Record<string, VideoSession['status']>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const hydrateCallStatuses = useCallback(async (items: Consultation[]) => {
    const entries = await Promise.all(items.map(async item => {
      if (item.status === 'cancelled' || item.status === 'completed' || item.scheduledAt < CURRENT_DATETIME) {
        return [item.id, 'ended'] as const;
      }

      const session = await videoService.getSession(item.id);
      return [item.id, session?.status ?? 'waiting'] as const;
    }));

    setCallStatuses(Object.fromEntries(entries));
  }, []);

  const loadConsultations = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const result = await consultationService.listConsultations();
      setConsultations(result);
      await hydrateCallStatuses(result);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hydrateCallStatuses]);

  useFocusEffect(useCallback(() => {
    void loadConsultations();
  }, [loadConsultations]));

  const filtered = useMemo(() => consultations.filter(item => {
    if (activeTab === 'cancelled') {
      return item.status === 'cancelled';
    }
    const isPast = item.status === 'completed' || item.scheduledAt < CURRENT_DATETIME;
    return activeTab === 'past' ? isPast && item.status !== 'cancelled' : !isPast && item.status !== 'cancelled';
  }), [activeTab, consultations]);

  const handleCancel = async (consultationId: string) => {
    try {
      await consultationService.cancelConsultation(consultationId);
      showToast('Consultation cancelled.', 'success');
      void loadConsultations(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to cancel consultation.', 'error');
    }
  };

  const handleJoinCall = async (consultation: Consultation) => {
    try {
      const session = await videoService.getSession(consultation.id) ?? await videoService.createSession(consultation.id);
      navigation.navigate('VideoCall', {
        consultationId: consultation.id,
        doctorName: consultation.doctor?.name,
        roomId: session.roomId,
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to start the call right now.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading consultations..." fullScreen />;
  }

  return (
    <FlatList
      style={styles.safeArea}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadConsultations(true)} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Consultations</Text>
          <View style={styles.tabRow}>
            {(['upcoming', 'past', 'cancelled'] as TabKey[]).map(tab => (
              <Button key={tab} title={tab[0].toUpperCase() + tab.slice(1)} variant={activeTab === tab ? 'primary' : 'secondary'} onPress={() => setActiveTab(tab)} />
            ))}
          </View>
          <Button title="Book New Consultation" onPress={() => navigation.navigate('BookConsultation')} />
        </View>
      }
      renderItem={({item}) => {
        const callStatus = callStatuses[item.id] ?? 'waiting';
        const canJoin = item.status === 'scheduled' && activeTab === 'upcoming' && callStatus !== 'ended';

        return (
          <ConsultationCard
            consultation={item}
            callStatus={callStatus}
            onCancel={item.status === 'scheduled' ? () => handleCancel(item.id) : undefined}
            onJoinCall={canJoin ? () => void handleJoinCall(item) : undefined}
            onViewPrescription={item.prescriptionId ? () => navigation.navigate('Prescription', {consultationId: item.id}) : undefined}
          />
        );
      }}
      ItemSeparatorComponent={() => <View style={{height: spacing.md}} />}
      ListEmptyComponent={<EmptyState title="No consultations yet" description="Book your first consultation after triage to see it here." />}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.lg},
  header: {gap: spacing.sm, marginBottom: spacing.lg},
  title: {color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold},
  tabRow: {gap: spacing.sm},
});
