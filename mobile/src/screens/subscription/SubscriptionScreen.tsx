import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {PaymentButton} from '../../components/PaymentButton';
import {useToast} from '../../components/ToastProvider';
import {subscriptionService} from '../../services/subscriptionService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import {PLAN_PERKS, PLAN_PRICES} from '../../utils/constants';
import type {Subscription} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

const PLAN_COLORS: Record<string, string> = {
  free: colors.success,
  basic: colors.primary,
  premium: '#7B4DFF',
};

export const SubscriptionScreen = (_props: Props) => {
  const {showToast} = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const status = await subscriptionService.getStatus();
      setSubscription(status);
    };
    void load();
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
      {Object.entries(PLAN_PERKS).map(([plan, perks]) => {
        const isCurrent = subscription?.plan === plan;
        const accentColor = PLAN_COLORS[plan] ?? colors.primary;
        const amount = PLAN_PRICES[plan] ?? 0;

        return (
          <View key={plan} style={[styles.card, {borderTopColor: accentColor}]}> 
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{plan.toUpperCase()}</Text>
              <Text style={[styles.price, {color: accentColor}]}>{amount === 0 ? 'Free' : `₹${amount}/month`}</Text>
            </View>
            {perks.map(perk => <Text key={perk} style={styles.copy}>• {perk}</Text>)}
            <PaymentButton
              amount={amount}
              label={isCurrent ? 'Current plan' : plan === 'free' ? 'Start Free' : 'Subscribe'}
              accentColor={accentColor}
              disabled={isCurrent}
              loading={loadingPlan === plan}
              onPaymentComplete={() => subscribe(plan)}
            />
          </View>
        );
      })}
      {subscription ? (
        <Button
          title="Cancel current subscription"
          variant="secondary"
          onPress={async () => {
            try {
              const next = await subscriptionService.cancel();
              setSubscription(next);
              showToast('Subscription cancelled.', 'success');
            } catch (error) {
              showToast(error instanceof Error ? error.message : 'Unable to cancel subscription.', 'error');
            }
          }}
        />
      ) : null}
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {padding: spacing.lg, gap: spacing.lg},
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderTopWidth: 5,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold},
  price: {fontSize: typography.sizes.md, fontWeight: typography.weights.bold},
  copy: {color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20},
});
