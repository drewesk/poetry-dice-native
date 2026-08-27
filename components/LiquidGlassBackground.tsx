import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function LiquidGlassBackground() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  return (
    <>
      {/* Multi-tone gradient background */}
      <LinearGradient
        colors={['#2f4fb8', '#5b56c2', '#8a5b97', '#c97868', '#6a63c8']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />
      
      {/* Gradient orbs */}
      <View style={[styles.gradientOrb, styles.orb1]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(250, 210, 110, 0.38)', 'rgba(250, 210, 110, 0)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={[styles.gradientOrb, styles.orb2]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(146, 170, 92, 0.30)', 'rgba(146, 170, 92, 0)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={[styles.gradientOrb, styles.orb3]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(233, 134, 170, 0.32)', 'rgba(233, 134, 170, 0)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={[styles.gradientOrb, styles.orb4]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(239, 151, 82, 0.34)', 'rgba(239, 151, 82, 0)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={[styles.gradientOrb, styles.orb5]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(184, 132, 225, 0.24)', 'rgba(184, 132, 225, 0)']}
          style={styles.orbGradient}
        />
      </View>
      <View style={[styles.gradientOrb, styles.orb6]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(124, 176, 130, 0.24)', 'rgba(124, 176, 130, 0)']}
          style={styles.orbGradient}
        />
      </View>
    </>
  );
}
