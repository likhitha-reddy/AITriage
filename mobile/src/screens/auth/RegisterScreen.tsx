import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {authService} from '../../services/authService';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {AuthStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({navigation}: Props) => {
  const setSession = useAuthStore(state => state.setSession);
  const [firstName, setFirstName] = useState('Avery');
  const [lastName, setLastName] = useState('Care');
  const [email, setEmail] = useState('avery@aitriage.app');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Complete all fields to continue.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Make sure both passwords match.');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      setSession(response.user, response.token);
    } catch (error) {
      Alert.alert('Unable to create account', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ios: 'padding', default: undefined})}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Create your care account</Text>
            <Text style={styles.subtitle}>
              Securely save consultations, prescriptions, and AI triage history.
            </Text>

            <Text style={styles.label}>First name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

            <Text style={styles.label}>Last name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button title="Create Account" onPress={handleRegister} loading={loading} />
            <Button title="Back to Sign In" onPress={() => navigation.goBack()} variant="secondary" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
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
});
