import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated, Share, ScrollView, LayoutAnimation, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer } from 'expo-sensors';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';
import { fontSize, spacing, borderRadius, minTouchSize, useFontSizeMode } from '@/utils/responsive';
import { fetchRandomPoetry, type PoetryExcerpt } from '@/lib/poetry-api';
import { PoetryTheme } from '@/constants/Colors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { preloadOfflinePoems } from '@/lib/offline-api';

const HISTORY_KEY = '@poetry_dice_history';
const WELCOME_STORAGE_KEY = '@poetry_dice_welcome_v1';
const WELCOME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const WELCOME_OPEN_THRESHOLD = 5;
const SHAKE_ENABLED_STORAGE_KEY = '@poetry_dice_shake_enabled';
const SHAKE_TOOLTIP_STORAGE_KEY = '@poetry_dice_shake_tooltip_v3';

type WelcomeState = {
  lastSeenAppVersion: string | null;
  lastShownAt: number | null;
  opensSinceLastShow: number;
};

function createDefaultWelcomeState(): WelcomeState {
  return {
    lastSeenAppVersion: null,
    lastShownAt: null,
    opensSinceLastShow: 0,
  };
}

export interface HistoryItem extends PoetryExcerpt {
  rollId: string;
  timestamp: number;
  isFavorite?: boolean;
}

function Dice({ value, rolling, uiStyles }: { value: number; rolling: boolean; uiStyles: ReturnType<typeof createStyles> }) {
  const map: Record<number, string> = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

  const rot = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const scaleAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (rolling) {
      rotAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(rot, { toValue: 15, duration: 60, useNativeDriver: true }),
          Animated.timing(rot, { toValue: -15, duration: 60, useNativeDriver: true })
        ])
      );
      rotAnimationRef.current.start();

      scaleAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 60, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.95, duration: 60, useNativeDriver: true })
        ])
      );
      scaleAnimationRef.current.start();
    } else {
      if (rotAnimationRef.current) {
        rotAnimationRef.current.stop();
        rotAnimationRef.current = null;
      }
      if (scaleAnimationRef.current) {
        scaleAnimationRef.current.stop();
        scaleAnimationRef.current = null;
      }

      Animated.timing(rot, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [rolling, rot, scale]);

  const animStyle = {
    transform: [
      {
        rotate: rot.interpolate({
          inputRange: [-15, 0, 15],
          outputRange: ['-15deg', '0deg', '15deg']
        })
      },
      { scale }
    ]
  };

  return (
    <Animated.View style={[uiStyles.diceContainer, animStyle]}>
      <LinearGradient
        colors={['#ffffff', '#f0f0f0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={uiStyles.diceGradient}
      >
        <View style={uiStyles.diceBorder}>
          <Text style={uiStyles.diceFace}>{map[value] || '⚀'}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [poetry, setPoetry] = useState<PoetryExcerpt | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollError, setRollError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [shakePreferenceLoaded, setShakePreferenceLoaded] = useState(false);
  const [showShakeTooltip, setShowShakeTooltip] = useState(false);
  const lastShakeTime = useRef(0);
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'unknown';
  const { fontSizeMode, setFontSizeMode, fontScaleMultiplier } = useFontSizeMode();
  const styles = useMemo(() => createStyles(fontScaleMultiplier), [fontScaleMultiplier]);
  const networkStatus = useNetworkStatus();
  
  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonRotate = useRef(new Animated.Value(0)).current;
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const poetryCardRef = useRef<View>(null);

  useEffect(() => {
    preloadOfflinePoems().catch(console.error);
  }, []);

  const loadWelcomeState = useCallback(async (): Promise<WelcomeState> => {
    try {
      const stored = await AsyncStorage.getItem(WELCOME_STORAGE_KEY);
      if (!stored) return createDefaultWelcomeState();
      const parsed = JSON.parse(stored) as Partial<WelcomeState>;
      return {
        lastSeenAppVersion: typeof parsed.lastSeenAppVersion === 'string' ? parsed.lastSeenAppVersion : null,
        lastShownAt: typeof parsed.lastShownAt === 'number' ? parsed.lastShownAt : null,
        opensSinceLastShow: typeof parsed.opensSinceLastShow === 'number' ? parsed.opensSinceLastShow : 0,
      };
    } catch {
      return createDefaultWelcomeState();
    }
  }, []);

  const persistWelcomeState = useCallback(async (state: WelcomeState) => {
    try {
      await AsyncStorage.setItem(WELCOME_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, []);

  useEffect(() => {
    const syncWelcomeState = async () => {
      const stored = await loadWelcomeState();
      const next = {
        ...stored,
        lastSeenAppVersion: appVersion,
        opensSinceLastShow: stored.opensSinceLastShow + 1,
      };
      const versionChanged = stored.lastSeenAppVersion !== null && stored.lastSeenAppVersion !== appVersion;
      const firstInstall = stored.lastShownAt === null;
      const cooldownElapsed = stored.lastShownAt !== null && Date.now() - stored.lastShownAt >= WELCOME_COOLDOWN_MS;
      const shouldShow = firstInstall || versionChanged || (cooldownElapsed && next.opensSinceLastShow >= WELCOME_OPEN_THRESHOLD);
      setShowWelcome(shouldShow);
      await persistWelcomeState(next);
    };
    void syncWelcomeState();
  }, [appVersion, loadWelcomeState, persistWelcomeState]);

  const loadShakeEnabled = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SHAKE_ENABLED_STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  }, []);

  const persistShakeEnabled = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SHAKE_ENABLED_STORAGE_KEY, enabled.toString());
    } catch {}
  }, []);

  useEffect(() => {
    loadShakeEnabled()
      .then((enabled) => {
        setShakeEnabled(enabled);
        setShakePreferenceLoaded(true);
      })
      .catch(() => setShakePreferenceLoaded(true));
  }, [loadShakeEnabled]);

  // Progressive shake tooltip: first launch, 7 days, 30 days, then never
  useEffect(() => {
    if (!shakePreferenceLoaded) return;
    if (!shakeEnabled) {
      setShowShakeTooltip(false);
      return;
    }

    let cancelled = false;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleShow = (showCount: number) => {
      initialTimer = setTimeout(() => {
        if (cancelled) return;
        setShowShakeTooltip(true);
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setShowShakeTooltip(false);
          AsyncStorage.setItem(
            SHAKE_TOOLTIP_STORAGE_KEY,
            JSON.stringify({ lastShown: Date.now(), showCount })
          ).catch(() => {});
        }, 4000);
      }, 2000);
    };

    const check = async () => {
      try {
        const data = await AsyncStorage.getItem(SHAKE_TOOLTIP_STORAGE_KEY);
        if (cancelled) return;
        if (!data) {
          scheduleShow(1);
        } else {
          const { lastShown, showCount } = JSON.parse(data);
          const daysSince = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);
          if (showCount === 1 && daysSince >= 7) scheduleShow(2);
          else if (showCount === 2 && daysSince >= 30) scheduleShow(3);
        }
      } catch {}
    };

    check();
    return () => {
      cancelled = true;
      if (initialTimer) clearTimeout(initialTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [shakeEnabled, shakePreferenceLoaded]);

  const handleShakeToggle = useCallback((enabled: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShakeEnabled(enabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void persistShakeEnabled(enabled);
  }, [persistShakeEnabled]);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    void persistWelcomeState({
      lastSeenAppVersion: appVersion,
      lastShownAt: Date.now(),
      opensSinceLastShow: 0,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [appVersion, persistWelcomeState]);

  // Auto-scroll to poetry card when new poetry loads
  useEffect(() => {
    if (poetry && scrollViewRef.current && poetryCardRef.current) {
      // Small delay to ensure the card is rendered, then measure and scroll to it
      setTimeout(() => {
        poetryCardRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {
            // Fallback if measureLayout fails
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
      }, 400);
    }
  }, [poetry]);

  useEffect(() => {
    if (isRolling) {
      // Rotation animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonRotate, { toValue: 15, duration: 60, useNativeDriver: true }),
          Animated.timing(buttonRotate, { toValue: -15, duration: 60, useNativeDriver: true })
        ])
      ).start();
      
      // Scale animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, { toValue: 1.15, duration: 60, useNativeDriver: true }),
          Animated.timing(buttonScale, { toValue: 0.95, duration: 60, useNativeDriver: true })
        ])
      ).start();
    } else {
      buttonRotate.stopAnimation();
      buttonScale.stopAnimation();
      Animated.timing(buttonRotate, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      Animated.timing(buttonScale, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [buttonRotate, buttonScale, isRolling]);

  useEffect(() => {
    return () => {
      if (rollTimer.current) {
        clearInterval(rollTimer.current);
        rollTimer.current = null;
      }
    };
  }, []);

  const rollDiceOnce = () => {
    setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
  };

  const onRoll = async () => {
    if (isRolling) return;

    setIsRolling(true);
    setRollError(null);

    let ticks = 0;
    rollDiceOnce();
    if (rollTimer.current) {
      clearInterval(rollTimer.current);
    }
    rollTimer.current = setInterval(() => {
      rollDiceOnce();
      ticks++;
      if (ticks > 10 && rollTimer.current) {
        clearInterval(rollTimer.current);
        rollTimer.current = null;
      }
    }, 100);

    try {
      const result = await fetchRandomPoetry();
      setPoetry(result);

      // Save to history only after receiving a fully credited excerpt.
      const historyItem: HistoryItem = {
        ...result,
        rollId: Date.now().toString(),
        timestamp: Date.now(),
      };

      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      const history: HistoryItem[] = stored ? JSON.parse(stored) : [];
      history.unshift(historyItem);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to roll poetry', e);
      setRollError('Could not find a fully credited excerpt. Try rolling again.');
    } finally {
      setIsRolling(false);
    }
  };

  const onCopy = async () => {
    if (!poetry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const text = `"${poetry.text}" — ${poetry.title} by ${poetry.poet}\nSource: ${poetry.source}`;
    await Clipboard.setStringAsync(text);
  };

  const onShare = async () => {
    if (!poetry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const text = `"${poetry.text}" — ${poetry.title} by ${poetry.poet}\nSource: ${poetry.source}`;
    try {
      await Share.share({
        title: 'Poetry Dice',
        message: text,
      });
    } catch {}
  };

  // Shake-to-roll - only active when Home tab is focused and shake is enabled
  useFocusEffect(
    useCallback(() => {
      let subscription: any;
      if (shakePreferenceLoaded && shakeEnabled) {
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (acceleration > 1.5 && !isRolling && now - lastShakeTime.current > 500) {
            lastShakeTime.current = now;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
              .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
              .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))
              .catch(() => {});
            onRoll();
          }
        });
      }
      return () => {
        subscription && subscription.remove();
      };
    }, [isRolling, shakeEnabled, shakePreferenceLoaded])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LiquidGlassBackground />
      
      <ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>🎲 Poetry Dice</Text>
        <Text style={styles.subtitle}>Discover a random poem</Text>
        
        {/* Settings gear button */}
        <View style={styles.centerGearRow}>
          <Pressable
            style={styles.centerSettingsButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </Pressable>
        </View>

        {/* Settings menu */}
        {showSettings && (
          <View style={styles.centerMenu}>
            <Text style={styles.settingsHeader}>Settings</Text>
            <Text style={styles.settingsSectionLabel}>Text Size</Text>
            <View style={styles.segmentedControl}>
              {(['normal', 'large'] as const).map((mode) => {
                const selected = fontSizeMode === mode;
                return (
                  <Pressable
                    key={mode}
                    style={[styles.segment, selected && styles.segmentActive]}
                    onPress={() => setFontSizeMode(mode)}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                      {mode === 'normal' ? 'Normal' : 'Large'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.settingsDivider} />
            <Text style={styles.settingsSectionLabel}>Shake to Roll</Text>
            <View style={styles.settingsSwitchRow}>
              <Text style={styles.settingsRowLabel}>Enable shake gesture</Text>
              <Switch
                value={shakeEnabled}
                onValueChange={handleShakeToggle}
                trackColor={{ false: 'rgba(255,255,255,0.25)', true: 'rgba(139, 157, 179, 0.65)' }}
                thumbColor={shakeEnabled ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="rgba(255,255,255,0.25)"
              />
            </View>
          </View>
        )}

        {(networkStatus.isInternetReachable === false || !networkStatus.isConnected) && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>📵 Offline Mode</Text>
          </View>
        )}

        <View style={styles.diceRow}>
          <Dice value={dice[0]} rolling={isRolling} uiStyles={styles} />
          <Dice value={dice[1]} rolling={isRolling} uiStyles={styles} />
        </View>
        
        <Animated.View style={{
          transform: [
            { rotate: buttonRotate.interpolate({ inputRange: [-15, 0, 15], outputRange: ['-15deg', '0deg', '15deg'] }) },
            { scale: buttonScale }
          ]
        }}>
          <Pressable 
            style={styles.button} 
            onPress={onRoll} 
            onPressIn={() => Animated.spring(buttonScale, { toValue: 0.92, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
            disabled={isRolling}
          >
          <LinearGradient
            colors={['#8b9db3', '#6d7f93']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            {isRolling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Roll for Poetry</Text>
            )}
          </LinearGradient>
        </Pressable>
        </Animated.View>

        {rollError && (
          <Text style={styles.errorText}>{rollError}</Text>
        )}
        
        {poetry && (
          <View ref={poetryCardRef} style={styles.card}>
            <Text style={styles.poetName}>{poetry.poet}</Text>
            <Text style={styles.title2}>{poetry.title}</Text>
            <Text style={styles.sourceText}>{poetry.source}</Text>
            <Text style={styles.text}>{poetry.text}</Text>
            
            <View style={styles.actionsRow}>
              <Pressable style={styles.actionButton} onPress={onCopy}>
                <Text style={styles.actionText}>📋 Copy</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={onShare}>
                <Text style={styles.actionText}>📤 Share</Text>
              </Pressable>
            </View>
          </View>
        )}
        
        <Text style={styles.credit}>App inspired by James Lalonde</Text>
      </ScrollView>

      {showWelcome && (
        <View style={styles.popupBackdrop}>
          <View style={styles.popupCard}>
            <View style={styles.popupContent}>
              <View style={styles.popupIconContainer}>
                <LinearGradient
                  colors={['#8b9db3', '#6d7f93']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.popupIconGradient}
                >
                  <Text style={styles.popupIcon}>🎲</Text>
                </LinearGradient>
              </View>
              <Text style={styles.popupTitle}>Welcome to Poetry Dice!</Text>
              <Pressable
                style={({ pressed }) => [styles.popupButton, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
                onPress={dismissWelcome}
                hitSlop={10}
              >
                <LinearGradient
                  colors={['#8b9db3', '#6d7f93']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.popupButtonGradient}
                >
                  <Text style={styles.popupButtonText}>Get Started</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {showShakeTooltip && (
        <View style={styles.shakeTooltip}>
          <View style={styles.shakeTooltipInner}>
            <Text style={styles.shakeTooltipText}>🤳 Shake to roll!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (fontScaleMultiplier: number) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PoetryTheme.background.safeArea,
  },
  scroll: {
    flex: 1,
    zIndex: 2,
  },
  container: {
    flexGrow: 1,
    padding: spacing(16),
    paddingBottom: spacing(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: fontSize(39),
    fontWeight: '800',
    marginBottom: spacing(8),
    fontFamily: 'Arsenal-Bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing(40),
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Regular',
  },
  diceRow: {
    flexDirection: 'row',
    gap: spacing(20),
    marginBottom: spacing(20),
  },
  diceContainer: {
    borderRadius: borderRadius(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.3,
    elevation: 12,
  },
  diceGradient: {
    borderRadius: borderRadius(20),
    padding: 3,
  },
  diceBorder: {
    backgroundColor: '#f5e6d3',
    borderRadius: borderRadius(17),
    borderWidth: 2,
    borderColor: 'rgba(139, 115, 85, 0.3)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
  },
  diceFace: {
    fontSize: fontSize(64),
    color: '#3a2d23',
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(24),
    textAlign: 'center',
    fontWeight: '700',
  },
  button: {
    borderRadius: borderRadius(30),
    marginBottom: spacing(16),
    shadowColor: PoetryTheme.accent.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: spacing(18),
    paddingHorizontal: spacing(40),
    minHeight: minTouchSize(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: fontSize(20),
    fontFamily: 'Arsenal-Bold',
  },
  errorText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize(13),
    fontFamily: 'Arsenal-Regular',
    marginBottom: spacing(16),
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: PoetryTheme.glass.cardBackground,
    borderRadius: borderRadius(20),
    padding: spacing(20),
    borderColor: PoetryTheme.glass.cardBorder,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  poetName: {
    color: PoetryTheme.accent.primary,
    fontWeight: '800',
    marginBottom: spacing(8),
    fontSize: fontSize(16),
    fontFamily: 'Arsenal-Bold',
  },
  title2: {
    color: '#fff',
    fontStyle: 'italic',
    fontSize: fontSize(14),
    marginBottom: spacing(8),
    fontFamily: 'Arsenal-Italic',
  },
  sourceText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: fontSize(12),
    marginBottom: spacing(12),
    fontFamily: 'Arsenal-Regular',
  },
  text: {
    color: '#fff',
    fontSize: fontSize(16),
    fontFamily: 'Arsenal-Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(12),
    marginTop: spacing(12),
  },
  actionButton: {
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(20),
    borderRadius: borderRadius(24),
    minHeight: minTouchSize(44),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PoetryTheme.glass.lightOverlay,
    borderWidth: 1.5,
    borderColor: PoetryTheme.glass.cardBorder,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Bold',
  },
  credit: {
    marginTop: spacing(20),
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize(12),
    fontFamily: 'Arsenal-Regular',
  },
  centerGearRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing(6),
    marginBottom: spacing(6),
  },
  centerSettingsButton: {
    width: minTouchSize(54),
    height: minTouchSize(54),
    borderRadius: borderRadius(27),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PoetryTheme.glass.lightOverlay,
    borderColor: PoetryTheme.glass.cardBorder,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: fontSize(24),
  },
  centerMenu: {
    marginBottom: spacing(12),
    padding: spacing(16),
    borderRadius: borderRadius(16),
    backgroundColor: PoetryTheme.glass.overlay,
    borderColor: PoetryTheme.glass.cardBorder,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    width: '90%',
  },
  settingsHeader: {
    color: '#fff',
    fontSize: fontSize(18),
    fontFamily: 'Arsenal-Bold',
    marginBottom: spacing(12),
  },
  settingsSectionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize(12),
    fontFamily: 'Arsenal-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing(8),
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: borderRadius(10),
    padding: spacing(3),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(10),
    borderRadius: borderRadius(8),
    minHeight: minTouchSize(40),
  },
  segmentActive: {
    backgroundColor: '#7d8fa3',
  },
  segmentText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Bold',
  },
  segmentTextActive: {
    color: '#1a1a1a',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: spacing(14),
  },
  settingsSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: minTouchSize(44),
    gap: spacing(12),
  },
  settingsRowLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize(16),
    fontFamily: 'Arsenal-Regular',
    flexShrink: 1,
    paddingRight: spacing(8),
  },
  offlineIndicator: {
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(6),
    borderRadius: borderRadius(16),
    backgroundColor: 'rgba(212, 165, 116, 0.9)',
    marginBottom: spacing(12),
  },
  offlineText: {
    color: '#1a1a1a',
    fontSize: fontSize(12),
    fontWeight: '700',
  },
  popupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
  },
  popupCard: {
    width: '88%',
    maxWidth: 400,
    borderRadius: borderRadius(24),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(45, 58, 74, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
    shadowOpacity: 0.5,
    elevation: 20,
  },
  popupContent: {
    padding: spacing(32),
    alignItems: 'center',
  },
  popupIconContainer: {
    marginBottom: spacing(20),
    borderRadius: borderRadius(30),
    overflow: 'hidden',
  },
  popupIconGradient: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupIcon: {
    fontSize: fontSize(40),
  },
  popupTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: fontSize(26),
    marginBottom: spacing(12),
    textAlign: 'center',
    fontFamily: 'Arsenal-Bold',
  },
  popupMessage: {
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    fontSize: fontSize(16),
    lineHeight: fontSize(24),
    marginBottom: spacing(24),
    fontFamily: 'Arsenal-Regular',
  },
  popupButton: {
    width: '100%',
    borderRadius: borderRadius(16),
    overflow: 'hidden',
  },
  popupButtonGradient: {
    paddingVertical: spacing(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSize(18),
    fontFamily: 'Arsenal-Bold',
  },
  shakeTooltip: {
    position: 'absolute',
    bottom: spacing(120),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9998,
  },
  shakeTooltipInner: {
    paddingHorizontal: spacing(18),
    paddingVertical: spacing(10),
    borderRadius: borderRadius(20),
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  shakeTooltipText: {
    color: '#fff',
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Bold',
  },
});
