import React, {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import type {ToastVariant} from '../types';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

export const ToastProvider = ({children}: {children: React.ReactNode}) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    setToast({message, variant});
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const value = useMemo(() => ({showToast}), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.container}>
          <View style={[styles.toast, variantStyles[toast.variant]]}>
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
  },
  toast: {
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  },
  text: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  success: {
    backgroundColor: colors.success,
  },
  error: {
    backgroundColor: colors.danger,
  },
  info: {
    backgroundColor: colors.primary,
  },
});

const variantStyles = {
  success: styles.success,
  error: styles.error,
  info: styles.info,
};
