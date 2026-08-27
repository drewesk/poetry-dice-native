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
    width: 200,
    height: 200,
    bottom: '20%',
    right: '10%',
  },
  orb4: {
    width: 220,
    height: 220,
    top: '5%',
    left: '15%',
  },
  orb5: {
    width: 280,
    height: 280,
    top: '35%',
    right: '-10%',
  },
  orb6: {
    width: 190,
    height: 190,
    bottom: '10%',
    left: '-15%',
  },
  orbGradient: {
    flex: 1,
  },
});
