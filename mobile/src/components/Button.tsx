import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  subtitle?: string;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  subtitle,
}: ButtonProps) => {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const textColor = isPrimary ? colors.white : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({pressed}) => [
        styles.base,
        isPrimary ? styles.primary : isGhost ? styles.ghost : styles.secondary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.title, {color: textColor}]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, {color: textColor}]}>{subtitle}</Text> : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{scale: 0.99}],
  },
  content: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    opacity: 0.8,
  },
});
