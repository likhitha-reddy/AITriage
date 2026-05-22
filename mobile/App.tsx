import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppNavigator} from './src/navigation/AppNavigator';
import {AuthNavigator} from './src/navigation/AuthNavigator';
import {LoadingSpinner} from './src/components/LoadingSpinner';
import {authService} from './src/services/authService';
import {useAuthStore} from './src/store/authStore';
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
  },
};

const App = (): React.JSX.Element => {
  const {
    isAuthenticated,
    isHydrating,
    setSession,
    clearSession,
    setHydrating,
  } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const session = await authService.getStoredSession();

        if (!isMounted) {
          return;
        }

        if (session?.token && session.user) {
          setSession(session.user, session.token);
        } else {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setHydrating(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [clearSession, setHydrating, setSession]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {isHydrating ? (
        <LoadingSpinner label="Loading your care dashboard..." fullScreen />
      ) : (
        <NavigationContainer theme={navigationTheme}>
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
};

export default App;
