import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';
import { fontSize, spacing, borderRadius, minTouchSize, useFontSizeMode } from '@/utils/responsive';
import { fetchRandomPoetry, type PoetryExcerpt } from '@/lib/poetry-api';
import { PoetryTheme } from '@/constants/Colors';

const HISTORY_KEY = '@poetry_dice_history';

export interface HistoryItem extends PoetryExcerpt {
  rollId: string;
  timestamp: number;
  isFavorite?: boolean;
}

export default function HomeScreen() {
  const [poetry, setPoetry] = useState<PoetryExcerpt | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const lastShakeTime = useRef(0);
  const { fontSizeMode, setFontSizeMode, fontScaleMultiplier } = useFontSizeMode();
  const styles = useMemo(() => createStyles(fontScaleMultiplier), [fontScaleMultiplier]);
  
  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonRotate = useRef(new Animated.Value(0)).current;

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
  }, [isRolling]);

  const onRoll = async () => {
    setIsRolling(true);
    const result = await fetchRandomPoetry();
    setPoetry(result);
    
    // Save to history
    const historyItem: HistoryItem = {
      ...result,
      rollId: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      const history: HistoryItem[] = stored ? JSON.parse(stored) : [];
      history.unshift(historyItem);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save to history', e);
    }
    
    setIsRolling(false);
  };

  const onCopy = async () => {
    if (!poetry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const text = `"${poetry.text}" — ${poetry.title} by ${poetry.poet}`;
    await Clipboard.setStringAsync(text);
  };

  const onShare = async () => {
    if (!poetry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const text = `"${poetry.text}" — ${poetry.title} by ${poetry.poet}`;
    try {
      await Share.share({
        title: 'Poetry Dice',
        message: text,
      });
    } catch {}
  };

  // Accelerometer for shake-to-roll
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      
      // Shake threshold: 1.5 g-force, Debounce: 500ms
      if (acceleration > 1.5 && !isRolling && now - lastShakeTime.current > 500) {
        lastShakeTime.current = now;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          .then(() => new Promise(resolve => setTimeout(resolve, 100)))
          .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))
          .catch(() => {});
        onRoll();
      }
    });

    return () => {
      subscription && subscription.remove();
    };
  }, [isRolling]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LiquidGlassBackground />
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
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
          </View>
        )}
        
        <Animated.View style={{
          transform: [
            { rotate: buttonRotate.interpolate({ inputRange: [-15, 0, 15], outputRange: ['-15deg', '0deg', '15deg'] }) },
            { scale: buttonScale }
          ]
        }}>
          <Pressable style={styles.button} onPress={onRoll} disabled={isRolling}>
          <LinearGradient
            colors={PoetryTheme.accent.gradient}
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
        
        {poetry && (
          <View style={styles.card}>
            <Text style={styles.poetName}>{poetry.poet}</Text>
            <Text style={styles.title2}>{poetry.title}</Text>
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
        
        <Text style={styles.credit}>App concept by James Lalonde</Text>
      </ScrollView>
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
  },
  container: {
    flexGrow: 1,
    padding: spacing(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: PoetryTheme.accent.primary,
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
    backgroundColor: PoetryTheme.accent.primary,
  },
  segmentText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Bold',
  },
  segmentTextActive: {
    color: '#1a1a1a',
  },
});
