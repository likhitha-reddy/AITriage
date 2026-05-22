import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {videoService} from '../../services/videoService';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {RootStackParamList} from '../../navigation/types';
import type {VideoSession} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;
type CallStage = 'connecting' | 'connected' | 'ended';

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

interface ControlButtonProps {
  icon: string;
  label: string;
  active?: boolean;
  destructive?: boolean;
  onPress: () => void;
}

const ControlButton = ({icon, label, active = false, destructive = false, onPress}: ControlButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [
      styles.controlButton,
      active ? styles.controlButtonActive : styles.controlButtonInactive,
      destructive ? styles.controlButtonDestructive : null,
      pressed ? styles.controlPressed : null,
    ]}>
    <Text style={styles.controlIcon}>{icon}</Text>
    <Text style={styles.controlLabel}>{label}</Text>
  </Pressable>
);

export const VideoCallScreen = ({navigation, route}: Props) => {
  const {consultationId, doctorName = 'Care Team Doctor', roomId} = route.params;
  const [session, setSession] = useState<VideoSession | null>(null);
  const [callStage, setCallStage] = useState<CallStage>('connecting');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');

  const doctorInitials = useMemo(
    () => doctorName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
    [doctorName],
  );

  useEffect(() => {
    let active = true;
    let statusTimer: ReturnType<typeof setTimeout> | null = null;

    const join = async () => {
      try {
        const existing = await videoService.getSession(consultationId);
        const nextSession = existing ?? await videoService.createSession(consultationId);
        if (!active) {
          return;
        }

        setSession(nextSession);
        setConnectionStatus('Joining secure room...');
        await videoService.joinSession(roomId ?? nextSession.roomId);
        if (!active) {
          return;
        }

        statusTimer = setTimeout(() => {
          setCallStage('connected');
          setConnectionStatus('In Call');
        }, 1200);
      } catch {
        if (!active) {
          return;
        }
        setConnectionStatus('Connected in demo mode');
        setCallStage('connected');
      }
    };

    void join();

    return () => {
      active = false;
      if (statusTimer) {
        clearTimeout(statusTimer);
      }
    };
  }, [consultationId, roomId]);

  useEffect(() => {
    if (callStage !== 'connected') {
      return;
    }

    const interval = setInterval(() => setDurationSeconds(current => current + 1), 1000);
    return () => clearInterval(interval);
  }, [callStage]);

  const handleEndCall = async () => {
    setCallStage('ended');
    setConnectionStatus('Wrapping up consultation...');
    if (session?.roomId) {
      await videoService.endSession(session.roomId);
    }
    navigation.replace('PostCall', {
      consultationId,
      doctorName,
      durationSeconds,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <Text style={styles.metaText}>{formatDuration(durationSeconds)} • {connectionStatus}</Text>
        </View>
        <View style={[styles.statusPill, callStage === 'connected' ? styles.statusActive : styles.statusConnecting]}>
          <Text style={styles.statusText}>{callStage === 'connected' ? 'LIVE' : callStage.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.videoStage}>
        <View style={styles.videoPlaceholder}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{doctorInitials}</Text>
          </View>
          <Text style={styles.placeholderTitle}>{callStage === 'connected' ? 'In Call' : 'Connecting...'}</Text>
          <Text style={styles.placeholderSubtitle}>
            {callStage === 'connected'
              ? 'Secure consultation room is active.'
              : 'Preparing the doctor video feed and connection.'}
          </Text>
        </View>

        <View style={styles.selfView}>
          <Text style={styles.selfTitle}>You</Text>
          <View style={[styles.selfPreview, !isCameraOn && styles.selfPreviewOff]}>
            <Text style={styles.selfPreviewText}>{isCameraOn ? `Camera ${cameraFacing}` : 'Camera off'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.controlBar}>
        <ControlButton icon={isMuted ? '🔇' : '🎤'} label={isMuted ? 'Unmute' : 'Mute'} active={!isMuted} onPress={() => setIsMuted(value => !value)} />
        <ControlButton icon={isCameraOn ? '📹' : '🚫'} label={isCameraOn ? 'Camera' : 'Camera Off'} active={isCameraOn} onPress={() => setIsCameraOn(value => !value)} />
        <ControlButton icon={isSpeakerOn ? '🔊' : '🎧'} label="Speaker" active={isSpeakerOn} onPress={() => setIsSpeakerOn(value => !value)} />
        <ControlButton icon="📱" label="Flip" active onPress={() => setCameraFacing(value => value === 'front' ? 'back' : 'front')} />
        <ControlButton icon="🔴" label="End" destructive onPress={handleEndCall} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081A29',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  doctorName: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  metaText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  statusConnecting: {
    backgroundColor: 'rgba(77,135,226,0.18)',
  },
  statusActive: {
    backgroundColor: 'rgba(31,157,116,0.18)',
  },
  statusText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  videoStage: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#10283D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 42,
    fontWeight: typography.weights.bold,
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  placeholderSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  selfView: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 120,
    borderRadius: 20,
    padding: spacing.sm,
    backgroundColor: 'rgba(8,26,41,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: spacing.sm,
  },
  selfTitle: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  selfPreview: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#1A3B57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfPreviewOff: {
    backgroundColor: '#33495E',
  },
  selfPreviewText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  controlBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  controlButton: {
    width: '18%',
    minWidth: 64,
    borderRadius: 22,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(77,135,226,0.18)',
  },
  controlButtonDestructive: {
    backgroundColor: colors.danger,
  },
  controlPressed: {
    transform: [{scale: 0.98}],
  },
  controlIcon: {
    fontSize: 20,
  },
  controlLabel: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
