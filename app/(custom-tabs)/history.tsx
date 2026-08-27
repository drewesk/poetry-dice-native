import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';
import { fontSize, spacing } from '@/utils/responsive';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LiquidGlassBackground />
      
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.emptyText}>No poems rolled yet</Text>
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
    marginBottom: spacing(20),
    fontFamily: 'Arsenal-Bold',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize(16),
    fontFamily: 'Arsenal-Regular',
  },
});