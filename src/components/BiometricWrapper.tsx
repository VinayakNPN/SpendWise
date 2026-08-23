import React, { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../state/ThemeContext';
import { PressableScale } from './PressableScale';
import type { ThemeColors } from '../utils/theme';
import { FontSize, Radius, Spacing } from '../utils/theme';

const createStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '800',
    color: c.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: c.textSecondary,
    marginBottom: Spacing.xl,
  },
  btn: {
    backgroundColor: c.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
  },
  btnText: {
    color: c.primaryText,
    fontWeight: '700',
    fontSize: FontSize.bodyLarge,
  }
});

export const BiometricWrapper = ({ children }: { children: React.ReactNode }) => {
  const { preferences } = useAppStore();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const appState = useRef(AppState.currentState);
  const [isLocked, setIsLocked] = useState(preferences.biometricLock);

  const authenticate = async () => {
    if (!preferences.biometricLock) return;

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setIsLocked(false);
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Velnora',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
      } else {
        setIsLocked(true);
      }
    } catch (e) {
      setIsLocked(true);
    }
  };

  useEffect(() => {
    if (preferences.biometricLock) {
      setIsLocked(true);
      authenticate();
    } else {
      setIsLocked(false);
    }
  }, [preferences.biometricLock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        preferences.biometricLock
      ) {
        setIsLocked(true);
        authenticate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [preferences.biometricLock]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {isLocked && (
        <View style={styles.overlay}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="shield-lock-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Velnora is locked</Text>
          <Text style={styles.subtitle}>Authenticate to view your data.</Text>
          <PressableScale style={styles.btn} onPress={authenticate}>
            <Text style={styles.btnText}>Unlock</Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
};
