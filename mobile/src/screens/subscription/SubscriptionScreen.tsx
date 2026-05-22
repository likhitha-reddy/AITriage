import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {useToast} from '../../components/ToastProvider';
import {subscriptionService} from '../../services/subscriptionService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {PLAN_PERKS} from '../../utils/constants';
import type {Subscription} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

export const SubscriptionScreen = (_props: Props) => {
  const {showToast} = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const status = await subscriptionService.getStatus();
      setSubscription(status);
    };
    load();
  }, []);

  const subscribe = async (plan: string) => {
    try {
      setLoadingPlan(plan);
      const next = await subscriptionService.subscribe(plan);
      setSubscription(next);
      showToast(`${plan} plan activated.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update subscription.', 'error');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      {Object.entries(PLAN_PERKS).map(([plan, perks]) => (
        <View key={plan} style={styles.card}>
          <Text style={styles.title}>{plan.toUpperCase()}</Text>
          {perks.map(perk => <Text key={perk} style={styles.copy}>• {perk}</Text>)}
          <Button title={subscription?.plan === plan ? 'Current plan' : 'Subscribe'} onPress={() => subscribe(plan)} disabled={subscription?.plan === plan} loading={loadingPlan === plan} />
        </View>
      ))}
      {subscription ? <Button title="Cancel current subscription" variant="secondary" onPress={async () => { const next = await subscriptionService.cancel(); setSubscription(next); showToast('Subscription cancelled.', 'success'); }} /> : null}
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {padding: spacing.lg, gap: spacing.lg},
  card: {backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, gap: spacing.sm},
  title: {color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold},
  copy: {color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20},
});
