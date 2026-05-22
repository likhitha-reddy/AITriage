import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {ConsultationCard} from '../../components/ConsultationCard';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {consultationService} from '../../services/consultationService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {Consultation} from '../../types';
import type {MainTabParamList, RootStackParamList} from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Consultations'>;

export const ConsultationListScreen = (_props: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const result = await consultationService.listConsultations();
        setConsultations(result);
      } finally {
        setLoading(false);
      }
    };

    loadConsultations();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading consultations..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={consultations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Consultations</Text>
            <Text style={styles.subtitle}>
              Review your upcoming appointments and recent care conversations.
            </Text>
            <Button title="Book New Consultation" onPress={() => navigation.navigate('BookConsultation')} />
          </View>
        }
        renderItem={({item}) => <ConsultationCard consultation={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
});
