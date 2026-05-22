import React, {useCallback, useLayoutEffect, useMemo, useState} from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {EmptyState} from '../../components/EmptyState';
import {useNotificationStore} from '../../store/notificationStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {RootStackParamList} from '../../navigation/types';
import type {Notification} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const iconByType: Record<Notification['type'], string> = {
  consultation: '📅',
  prescription: '💊',
  subscription: '💎',
  payment: '💳',
  video: '📹',
  system: '🔔',
};

const formatTimeAgo = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.round(diffHours / 24)}d ago`;
};

const isToday = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

export const NotificationScreen = ({navigation}: Props) => {
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const markRead = useNotificationStore(state => state.markRead);
  const markAllRead = useNotificationStore(state => state.markAllRead);
  const refresh = useNotificationStore(state => state.refresh);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Notifications',
      headerRight: () => (
        <Pressable disabled={unreadCount === 0} onPress={() => void markAllRead()}>
          <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}>Mark all as read</Text>
        </Pressable>
      ),
    });
  }, [markAllRead, navigation, unreadCount]);

  const sections = useMemo(() => {
    const today = notifications.filter(item => isToday(item.createdAt));
    const earlier = notifications.filter(item => !isToday(item.createdAt));

    return [
      {title: 'Today', data: today},
      {title: 'Earlier', data: earlier},
    ].filter(section => section.data.length > 0);
  }, [notifications]);

  return (
    <SectionList
      style={styles.screen}
      sections={sections}
      keyExtractor={item => item.id}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      contentContainerStyle={notifications.length === 0 ? styles.emptyContent : styles.content}
      ListHeaderComponent={
        notifications.length ? (
          <Text style={styles.helperText}>Tap any unread notification to mark it as read.</Text>
        ) : null
      }
      ListEmptyComponent={<EmptyState title="No notifications yet 🔔" description="We will show consultation updates, prescriptions, and reminders here." />}
      renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
      renderItem={({item}) => (
        <Pressable
          onPress={() => !item.isRead && void markRead(item.id)}
          style={({pressed}) => [
            styles.card,
            !item.isRead ? styles.cardUnread : null,
            pressed ? styles.cardPressed : null,
          ]}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{iconByType[item.type] ?? '🔔'}</Text>
          </View>
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.title}</Text>
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text style={styles.message}>{item.body}</Text>
            <Text style={styles.meta}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{height: spacing.sm}} />}
    />
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: '#CDE0FF',
    backgroundColor: '#F4F8FF',
  },
  cardPressed: {
    transform: [{scale: 0.995}],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  meta: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  markAllText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  markAllTextDisabled: {
    color: colors.textSecondary,
  },
});
