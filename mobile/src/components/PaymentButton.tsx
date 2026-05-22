import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface PaymentButtonProps {
  amount: number;
  label: string;
  onPaymentComplete: () => void | Promise<void>;
  accentColor?: string;
  alertMessage?: string;
  disabled?: boolean;
  loading?: boolean;
}

const formatAmount = (amount: number) =>
  amount <= 0 ? 'Free' : `₹${amount.toLocaleString('en-IN')}`;

export const PaymentButton = ({
  amount,
  label,
  onPaymentComplete,
  accentColor = colors.primary,
  alertMessage = 'Payment integration coming soon! 🚀',
  disabled = false,
  loading = false,
}: PaymentButtonProps) => {
  const [processing, setProcessing] = useState(false);

  const handleContinue = () => {
    setProcessing(true);
    Promise.resolve(onPaymentComplete())
      .catch(() => undefined)
      .finally(() => setProcessing(false));
  };

  const handlePress = () => {
    Alert.alert('Payment coming soon', alertMessage, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Continue', onPress: handleContinue},
    ]);
  };

  const busy = loading || processing;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={handlePress}
      style={({pressed}) => [
        styles.button,
        {backgroundColor: accentColor},
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      {busy ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.amount}>{formatAmount(amount)}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 68,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  content: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  amount: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  pressed: {
    transform: [{scale: 0.99}],
  },
  disabled: {
    opacity: 0.6,
  },
});
