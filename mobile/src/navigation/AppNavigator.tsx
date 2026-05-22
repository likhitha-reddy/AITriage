import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {NotificationBadge} from '../components/NotificationBadge';
import {BookConsultationScreen} from '../screens/consultations/BookConsultationScreen';
import {ConsultationListScreen} from '../screens/consultations/ConsultationListScreen';
import {PostCallScreen} from '../screens/consultations/PostCallScreen';
import {VideoCallScreen} from '../screens/consultations/VideoCallScreen';
import {HomeScreen} from '../screens/home/HomeScreen';
import {NotificationScreen} from '../screens/notifications/NotificationScreen';
import {PrescriptionScreen} from '../screens/prescriptions/PrescriptionScreen';
import {ProfileScreen} from '../screens/profile/ProfileScreen';
import {ProgressScreen} from '../screens/progress/ProgressScreen';
import {SubscriptionScreen} from '../screens/subscription/SubscriptionScreen';
import {TriageCategoryScreen} from '../screens/triage/TriageCategoryScreen';
import {TriageResultScreen} from '../screens/triage/TriageResultScreen';
import {TriageScreen} from '../screens/triage/TriageScreen';
import {useNotificationStore} from '../store/notificationStore';
import {colors} from '../theme/colors';
import type {MainTabParamList, RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Triage: '🩺',
  Consultations: '📅',
  Profile: '👤',
};

const tabTitles: Record<keyof MainTabParamList, string> = {
  Home: 'Home',
  Triage: 'AI Triage',
  Consultations: 'Consultations',
  Profile: 'Profile',
};

const HeaderNotificationButton = ({onPress}: {onPress: () => void}) => {
  const unreadCount = useNotificationStore(state => state.unreadCount);

  return (
    <Pressable onPress={onPress} style={styles.bellButton}>
      <Text style={styles.bellIcon}>🔔</Text>
      <View style={styles.badgeWrap}>
        <NotificationBadge count={unreadCount} />
      </View>
    </Pressable>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({route, navigation}) => ({
      title: tabTitles[route.name],
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerRight: () => (
        <HeaderNotificationButton onPress={() => navigation.getParent()?.navigate('Notifications' as never)} />
      ),
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingTop: 8,
        height: 72,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        paddingBottom: 6,
      },
      tabBarIcon: ({color}) => <Text style={{fontSize: 18, color}}>{tabIcons[route.name]}</Text>,
    })}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Triage" component={TriageCategoryScreen} />
    <Tab.Screen name="Consultations" component={ConsultationListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: colors.text,
      headerShadowVisible: false,
      contentStyle: {backgroundColor: colors.background},
    }}>
    <Stack.Screen name="Tabs" component={MainTabs} options={{headerShown: false}} />
    <Stack.Screen name="TriageInput" component={TriageScreen} options={{title: 'Symptom Check'}} />
    <Stack.Screen name="TriageResult" component={TriageResultScreen} options={{title: 'AI Triage Result'}} />
    <Stack.Screen name="BookConsultation" component={BookConsultationScreen} options={{title: 'Book Consultation'}} />
    <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{title: 'Prescription'}} />
    <Stack.Screen name="Progress" component={ProgressScreen} options={{title: 'Progress Check-In'}} />
    <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{title: 'Subscription Plans'}} />
    <Stack.Screen name="Notifications" component={NotificationScreen} options={{title: 'Notifications'}} />
    <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{headerShown: false}} />
    <Stack.Screen name="PostCall" component={PostCallScreen} options={{title: 'Consultation Summary'}} />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  badgeWrap: {
    position: 'absolute',
    top: 3,
    right: 1,
  },
});
