import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterScreen = ({navigation}: Props) => {
  const {showToast} = useToast();
  const setSession = useAuthStore(state => state.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const validationMessage = useMemo(() => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      return 'Please fill in all required fields.';
    }
    if (!emailPattern.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    if (phone.trim().length < 10) {
      return 'Enter a valid phone number.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    if (!acceptedTerms) {
      return 'Accept the terms to continue.';
    }
    return '';
  }, [acceptedTerms, confirmPassword, email, name, password, phone]);

  const handleRegister = async () => {
    if (validationMessage) {
      showToast(validationMessage, 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        dateOfBirth: dateOfBirth.trim() || undefined,
      });
      setSession(response.user, response.accessToken);
      showToast('Welcome to AITriage! Your health journey starts now.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      {/* Healthcare Header */}
      <View style={styles.header}>
        <View style={styles.medicalIconRow}>
          <View style={styles.medicalCross}>
            <Text style={styles.crossIcon}>✚</Text>
          </View>
          <View style={styles.pulseLineContainer}>
            <Text style={styles.pulseLine}>───╱╲╱╲───</Text>
          </View>
        </View>
        <Text style={styles.brandName}>AITriage</Text>
        <Text style={styles.tagline}>Your AI-Powered Health Companion</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderIcon}>🏥</Text>
          <Text style={styles.title}>Patient Registration</Text>
        </View>
        <Text style={styles.subtitle}>
          Create your secure health profile to access AI triage, specialist consultations, and personalized care tracking.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
            autoComplete="name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
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
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            keyboardType="phone-pad"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.textSecondary}
            autoComplete="tel"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth (Optional)</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 characters"
            placeholderTextColor={colors.textSecondary}
            autoComplete="new-password"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            placeholderTextColor={colors.textSecondary}
            autoComplete="new-password"
          />
        </View>

        <Pressable style={styles.checkboxRow} onPress={() => setAcceptedTerms(value => !value)}>
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]}>
            {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I consent to secure processing of my health data and agree to the platform's terms of service and privacy policy.
          </Text>
        </Pressable>

        {validationMessage ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>{validationMessage}</Text>
          </View>
        ) : null}

        <Button title="🏥 Create Health Account" onPress={handleRegister} loading={loading} />
        <Button title="Already have an account? Sign In" onPress={() => navigation.goBack()} variant="secondary" />
      </View>

      {/* Footer trust badges */}
      <View style={styles.trustBadges}>
        <Text style={styles.badge}>🔒 256-bit Encrypted</Text>
        <Text style={styles.badge}>🏥 HIPAA Compliant</Text>
        <Text style={styles.badge}>👨‍⚕️ Doctor Verified</Text>
      </View>
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  medicalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  medicalCross: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossIcon: {
    fontSize: 22,
    color: '#2E7D32',
  },
  pulseLineContainer: {
    opacity: 0.6,
  },
  pulseLine: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  },
  cardHeaderIcon: {
    fontSize: 24,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF3E0',
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    flex: 1,
    color: '#E65100',
    fontSize: typography.sizes.sm,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
