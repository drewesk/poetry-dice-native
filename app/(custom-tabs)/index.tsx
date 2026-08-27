import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';
import { fontSize, spacing, borderRadius, minTouchSize } from '@/utils/responsive';
import { fetchRandomPoetry, type PoetryExcerpt } from '@/lib/poetry-api';

export default function HomeScreen() {
  const [poetry, setPoetry] = useState<PoetryExcerpt | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const lastShakeTime = useRef(0);
  
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
    setIsRolling(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LiquidGlassBackground />
      
      <View style={styles.container}>
        <Text style={styles.title}>🎲 Poetry Dice</Text>
        <Text style={styles.subtitle}>Discover a random poem</Text>
        
        <Animated.View style={{
          transform: [
            { rotate: buttonRotate.interpolate({ inputRange: [-15, 0, 15], outputRange: ['-15deg', '0deg', '15deg'] }) },
            { scale: buttonScale }
          ]
        }}>
          <Pressable style={styles.button} onPress={onRoll} disabled={isRolling}>
          <LinearGradient
            colors={['#ee5a52', '#d94942']}
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
          </View>
        )}
        
        <Text style={styles.credit}>Idea by James Lalonde</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6a73e6',
  },
  container: {
    flex: 1,
    padding: spacing(16),
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
  button: {
    borderRadius: borderRadius(30),
    marginBottom: spacing(16),
    shadowColor: '#ee5a52',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius(20),
    padding: spacing(20),
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 2,
  },
  poetName: {
    color: '#ffd700',
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
  },
  credit: {
    position: 'absolute',
    bottom: spacing(100),
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize(12),
    fontFamily: 'Arsenal-Regular',
  },
});
