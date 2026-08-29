import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PoetryTheme } from '@/constants/Colors';

export function LiquidGlassBackground() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  return (
    <>
      {/* Monochrome gradient background */}
      <LinearGradient
        colors={PoetryTheme.background.gradient}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />
      
      {/* Gradient orbs - Monochrome + Amber */}
      <View style={[styles.gradientOrb, styles.orb1]} pointerEvents="none">
        <LinearGradient
          colors={[PoetryTheme.orbs.gray1, 'rgba(180, 180, 190, 0)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={[styles.gradientOrb, styles.orb2]} pointerEvents="none">
        <LinearGradient
          colors={[PoetryTheme.orbs.gray2, 'rgba(160, 160, 170, 0)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={[styles.gradientOrb, styles.orb3]} pointerEvents="none">
        <LinearGradient
          colors={[PoetryTheme.orbs.amber, 'rgba(212, 165, 116, 0)']}
          style={styles.orbGradient}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientOrb: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
    zIndex: 0,
  },
  orb1: {
    width: 300,
    height: 300,
    top: '10%',
    right: '-15%',
  },
  orb2: {
    width: 250,
    height: 250,
    top: '45%',
    left: '-20%',
  },
  orb3: {
    width: 350,
    height: 350,
    top: '30%',
    left: '25%',
  },
  orbGradient: {
    flex: 1,
  },
});
