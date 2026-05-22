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
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !dateOfBirth.trim()) {
      return 'Complete every field to create your account.';
    }
    if (!emailPattern.test(email.trim())) {
      return 'Enter a valid email address.';
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
  }, [acceptedTerms, confirmPassword, dateOfBirth, email, name, password, phone]);

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
        dateOfBirth: dateOfBirth.trim(),
      });
      setSession(response.user, response.accessToken);
      showToast('Account created successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create your care account</Text>
        <Text style={styles.subtitle}>
          Save triage results, track progress, and manage specialist consultations securely.
        </Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jordan Rivera" placeholderTextColor={colors.textSecondary} />

        <Text style={styles.label}>Email</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textSecondary} />

        <Text style={styles.label}>Phone</Text>
        <TextInput keyboardType="phone-pad" style={styles.input} value={phone} onChangeText={setPhone} placeholder="+1 555 000 0000" placeholderTextColor={colors.textSecondary} />

        <Text style={styles.label}>Date of birth</Text>
        <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />

        <Text style={styles.label}>Password</Text>
        <TextInput secureTextEntry style={styles.input} value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" placeholderTextColor={colors.textSecondary} />

        <Text style={styles.label}>Confirm password</Text>
        <TextInput secureTextEntry style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" placeholderTextColor={colors.textSecondary} />

        <Pressable style={styles.checkboxRow} onPress={() => setAcceptedTerms(value => !value)}>
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]} />
          <Text style={styles.checkboxLabel}>I agree to the care platform terms and consent to secure health data processing.</Text>
        </Pressable>

        {validationMessage ? <Text style={styles.helper}>{validationMessage}</Text> : null}

        <Button title="Create Account" onPress={handleRegister} loading={loading} />
        <Button title="Back to Sign In" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
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
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  helper: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
});
