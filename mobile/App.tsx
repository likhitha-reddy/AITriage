import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import type {LinkingOptions} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {LoadingSpinner} from './src/components/LoadingSpinner';
import {ToastProvider, useToast} from './src/components/ToastProvider';
import {AppNavigator} from './src/navigation/AppNavigator';
import {AuthNavigator} from './src/navigation/AuthNavigator';
import type {RootStackParamList} from './src/navigation/types';
import {authService} from './src/services/authService';
import {registerApiHandlers} from './src/services/api';
import {useAuthStore} from './src/store/authStore';
import {useNotificationStore} from './src/store/notificationStore';
import {colors} from './src/theme/colors';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['aitriage://', 'https://aitriage.app'],
  config: {
    screens: {
      Tabs: {
        path: '',
        screens: {
          Home: 'home',
          Triage: 'triage',
          Consultations: 'consultations',
          Profile: 'profile',
        },
      },
      TriageInput: 'triage/form/:category?',
      TriageResult: 'triage/result/:triageId?',
      BookConsultation: 'consultations/book/:specialization?',
      Prescription: 'consultations/:consultationId/prescription',
      Progress: 'progress',
      Subscription: 'subscription',
      Notifications: 'notifications',
      VideoCall: 'consultations/:consultationId/video',
      PostCall: 'consultations/:consultationId/post-call',
    },
  },
};

const AppShell = (): React.JSX.Element => {
  const {showToast} = useToast();
  const {
    isAuthenticated,
    isHydrating,
    setSession,
    clearSession,
    setHydrating,
  } = useAuthStore();
  const initializeNotifications = useNotificationStore(state => state.initialize);
  const clearNotifications = useNotificationStore(state => state.clear);

  useEffect(() => {
    registerApiHandlers({
      onUnauthorized: () => clearSession(),
      onError: message => showToast(message, 'error'),
    });
  }, [clearSession, showToast]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const session = await authService.getStoredSession();

        if (!isMounted) {
          return;
        }

        if (session?.accessToken && session.user) {
          setSession(session.user, session.accessToken);
        } else {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setHydrating(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [clearSession, setHydrating, setSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearNotifications();
      return;
    }

    void initializeNotifications();

    return () => {
      clearNotifications();
    };
  }, [clearNotifications, initializeNotifications, isAuthenticated]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {isHydrating ? (
        <LoadingSpinner label="Loading your care dashboard..." fullScreen />
      ) : (
        <NavigationContainer linking={linking} theme={navigationTheme}>
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      )}
    </>
  );
};

const App = (): React.JSX.Element => (
  <SafeAreaProvider>
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  </SafeAreaProvider>
);

export default App;
