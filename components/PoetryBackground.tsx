import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LiquidGlassBackground } from './LiquidGlassBackground';

export function PoetryBackground() {
  return (
    <>
      <View style={styles.dimmedBackground} pointerEvents="none">
        <LiquidGlassBackground />
      </View>
      <View style={styles.parchmentOverlay} pointerEvents="none">
        <Image
          source={require('@/assets/images/parchment-texture.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 180, 160, 0.3)' }]} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dimmedBackground: {
    opacity: 0.3,
  },
  parchmentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
    zIndex: 1,
  },
});
