import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {LoginScreen} from '../screens/auth/LoginScreen';
import {RegisterScreen} from '../screens/auth/RegisterScreen';
import {colors} from '../theme/colors';
import type {AuthStackParamList} from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: colors.text,
      headerShadowVisible: false,
      contentStyle: {backgroundColor: colors.background},
    }}>
    <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{title: 'Create Account'}} />
  </Stack.Navigator>
);
