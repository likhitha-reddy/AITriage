import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {useToast} from '../../components/ToastProvider';
import {authService} from '../../services/authService';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {AuthStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen = ({navigation}: Props) => {
  const {showToast} = useToast();
  const setSession = useAuthStore(state => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validationMessage = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return 'Enter your email and password to continue.';
    }
    if (!emailPattern.test(email.trim())) {
      return 'Use a valid email address.';
    }
    if (password.trim().length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  }, [email, password]);

  const handleLogin = async () => {
    if (validationMessage) {
      showToast(validationMessage, 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(email.trim().toLowerCase(), password.trim());
      setSession(response.user, response.accessToken);
      showToast('Welcome back! Your health dashboard is ready.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to sign in.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      {/* Healthcare Hero */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <View style={styles.medicalCross}>
            <Text style={styles.crossIcon}>✚</Text>
          </View>
        </View>
        <Text style={styles.brandName}>AITriage</Text>
        <Text style={styles.tagline}>Intelligent Healthcare at Your Fingertips</Text>

        <View style={styles.featureRow}>
          <View style={styles.featureChip}>
            <Text style={styles.featureText}>🧠 AI Diagnosis</Text>
          </View>
          <View style={styles.featureChip}>
            <Text style={styles.featureText}>👨‍⚕️ Doctor Consult</Text>
          </View>
          <View style={styles.featureChip}>
            <Text style={styles.featureText}>💊 Prescriptions</Text>
          </View>
        </View>
      </View>

      {/* Login Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>🔐</Text>
          <Text style={styles.title}>Patient Sign In</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="patient@email.com"
            placeholderTextColor={colors.textSecondary}
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.textSecondary}
            autoComplete="current-password"
          />
        </View>

        {validationMessage ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>ℹ️</Text>
            <Text style={styles.alertText}>{validationMessage}</Text>
          </View>
        ) : null}

        <Button title="🏥 Sign In to Dashboard" onPress={handleLogin} loading={loading} />
        <Button title="New Patient? Create Account" onPress={() => navigation.navigate('Register')} variant="secondary" />
      </View>

      {/* Trust indicators */}
      <View style={styles.trustSection}>
        <Text style={styles.trustText}>🔒 Your health data is encrypted & secure</Text>
        <Text style={styles.trustSubtext}>Trusted by 10,000+ patients across India</Text>
      </View>
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoContainer: {
    marginBottom: spacing.xs,
  },
  medicalCross: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  crossIcon: {
    fontSize: 28,
    color: '#2E7D32',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  featureChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500' as const,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardHeaderIcon: {
    fontSize: 22,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E3F2FD',
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    flex: 1,
    color: '#1565C0',
    fontSize: typography.sizes.sm,
  },
  trustSection: {
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  trustSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.7,
  },
});
