import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, Text, AppState, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { loadFontSizeMode } from '@/utils/responsive';
import { fontSize, spacing } from '@/utils/responsive';
import { PoetryTheme } from '@/constants/Colors';
import UpdateModal from '@/components/UpdateModal';
import { checkForUpdate, shouldCheckForUpdate, skipVersion, remindLater, type UpdateInfo } from '@/utils/updateChecker';

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Arsenal-Regular': require('../assets/fonts/Arsenal/Arsenal-Regular.ttf'),
    'Arsenal-Bold': require('../assets/fonts/Arsenal/Arsenal-Bold.ttf'),
    'Arsenal-Italic': require('../assets/fonts/Arsenal/Arsenal-Italic.ttf'),
    'Arsenal-BoldItalic': require('../assets/fonts/Arsenal/Arsenal-BoldItalic.ttf'),
  });
  const [fontSizeLoaded, setFontSizeLoaded] = useState(false);
  const [booting, setBooting] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const appState = useRef(AppState.currentState);

  // Fancy loader animations
  const bandWidth = 240;
  const screenWidth = Dimensions.get('window').width;
  const shimmerX = useRef(new Animated.Value(-bandWidth)).current;
  const diceScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFontSizeMode().then(() => {
      setFontSizeLoaded(true);
    }).catch((error: unknown) => {
      console.error('[RootLayout] Failed to load font size mode:', error);
      setFontSizeLoaded(true);
    });
  }, []);

  // Animations for loading screen
  useEffect(() => {
    if (!booting) return;
    // Pulsing dice
    Animated.loop(
      Animated.sequence([
        Animated.timing(diceScale, { toValue: 1.12, duration: 450, useNativeDriver: true }),
        Animated.timing(diceScale, { toValue: 1, duration: 450, useNativeDriver: true })
      ])
    ).start();
    // Shimmer sweep
    shimmerX.setValue(-bandWidth);
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, { toValue: screenWidth + bandWidth, duration: 1600, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -bandWidth, duration: 0, useNativeDriver: true })
      ])
    ).start();
  }, [booting, screenWidth, shimmerX, diceScale, bandWidth]);

  // Show custom loader for 3 seconds after fonts load
  useEffect(() => {
    if (loaded && fontSizeLoaded) {
      SplashScreen.hideAsync();
      const t = setTimeout(() => {
        setBooting(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [loaded, fontSizeLoaded]);

  // Function to perform update check (used both on boot and resume)
  const performUpdateCheck = async () => {
    try {
      // ===== TEST MODE: Uncomment to always show the update modal for testing =====
      // const testMode = true; // Set to false to disable test mode
      // if (testMode) {
      //   setUpdateInfo({
      //     isUpdateAvailable: true,
      //     currentVersion: '1.0.2',
      //     latestVersion: '1.0.3',
      //     releaseNotes: 'New Features:\n• Auto-scroll to poetry after roll\n• Fixed tab icon alignment\n• Improved network handling\n• Bug fixes and performance improvements',
      //     updateUrl: 'itms-apps://apps.apple.com/us/app/poetry-dice/id[your-app-id]'
      //   });
      //   setShowUpdateModal(true);
      //   return;
      // }
      // ===== END TEST MODE =====
      
      const shouldCheck = await shouldCheckForUpdate();
      if (shouldCheck) {
        const update = await checkForUpdate();
        if (update && update.isUpdateAvailable) {
          setUpdateInfo(update);
          setShowUpdateModal(true);
        }
      }
    } catch (error) {
      console.log('[RootLayout] Error checking for update:', error);
    }
  };

  // Check for app updates after booting completes
  useEffect(() => {
    if (!booting) {
      // Delay check by 2 seconds after boot to let app settle
      const timer = setTimeout(performUpdateCheck, 2000);
      return () => clearTimeout(timer);
    }
  }, [booting]);

  // Check for updates when app resumes from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // When app comes to foreground from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Don't show modal if already visible
        if (!showUpdateModal) {
          await performUpdateCheck();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [showUpdateModal]);

  const handleUpdateNow = async () => {
    if (updateInfo?.updateUrl) {
      try {
        const canOpen = await Linking.canOpenURL(updateInfo.updateUrl);
        if (canOpen) {
          await Linking.openURL(updateInfo.updateUrl);
        } else {
          console.log('[RootLayout] Cannot open App Store URL (normal in simulator)');
          // On a real device, this will work fine
        }
      } catch (error) {
        console.log('[RootLayout] App Store not available (simulator only)', error);
      }
    }
    setShowUpdateModal(false);
  };

  const handleLater = async () => {
    // Set reminder for 2 hours from now
    await remindLater();
    setShowUpdateModal(false);
  };

  const handleSkip = async () => {
    if (updateInfo?.latestVersion) {
      await skipVersion(updateInfo.latestVersion);
    }
    setShowUpdateModal(false);
  };

  const diceStyle = {
    transform: [{ scale: diceScale }],
  };

  const shimmerStyle = {
    transform: [{ translateX: shimmerX }],
  };

  if (!loaded || !fontSizeLoaded || booting) {
    return (
      <LinearGradient
        colors={[PoetryTheme.background.gradient[0], PoetryTheme.background.gradient[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.splashContainer}
      >
        <StatusBar style="light" />
        {/* Shimmer band */}
        <Animated.View pointerEvents="none" style={[styles.splashShimmer, { width: bandWidth }, shimmerStyle]}>
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.25)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.splashShimmerFill}
          />
        </Animated.View>

        {/* Bouncy dice */}
        <Animated.Text style={[styles.splashDice, diceStyle]}>🎲</Animated.Text>

        <Text style={styles.splashTitle}>
          <Text style={{ fontFamily: 'Arsenal-Bold' }}>🎲 </Text>Poetry Dice
        </Text>
        <Text style={styles.splashSubtitle}>Preparing poetic inspiration…</Text>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(custom-tabs)" />
      </Stack>
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onUpdateNow={handleUpdateNow}
        onLater={handleLater}
        onSkip={handleSkip}
      />
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  splashShimmer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    transform: [{ skewX: '-20deg' }],
  },
  splashShimmerFill: {
    flex: 1,
  },
  splashDice: {
    fontSize: 80,
    marginBottom: spacing(20),
  },
  splashTitle: {
    fontSize: fontSize(32),
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing(8),
    fontFamily: 'Arsenal-Regular',
  },
  splashSubtitle: {
    fontSize: fontSize(16),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing(24),
    fontFamily: 'Arsenal-Regular',
  },
});
