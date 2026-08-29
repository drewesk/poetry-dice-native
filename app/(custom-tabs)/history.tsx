import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';
import { fontSize, spacing, borderRadius, minTouchSize, useFontSizeMode } from '@/utils/responsive';
import type { HistoryItem } from './index';
import { PoetryTheme } from '@/constants/Colors';

const HISTORY_KEY = '@poetry_dice_history';

export default function HistoryScreen() {
  const { fontScaleMultiplier } = useFontSizeMode();
  const styles = useMemo(() => createStyles(fontScaleMultiplier), [fontScaleMultiplier]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        const items = JSON.parse(stored) as HistoryItem[];
        setHistory(Array.isArray(items) ? items : []);
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error('Failed to load history', e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Reload history when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadHistory();
      return () => {};
    }, [])
  );

  const toggleFavorite = useCallback(async (rollId: string) => {
    const updated = history.map(item =>
      item.rollId === rollId ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [history]);

  const onCopy = useCallback(async (item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const text = `"${item.text}" — ${item.title} by ${item.poet}`;
    await Clipboard.setStringAsync(text);
  }, []);

  const clearHistory = () => {
    const performClear = async () => {
      try {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
        setHistory([]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } catch (e) {
        console.error('Failed to clear history', e);
        Alert.alert('Error', 'Failed to clear history');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = confirm('This will remove all saved poems. Are you sure?');
      if (confirmed) performClear();
    } else {
      Alert.alert(
        'Clear History',
        'This will remove all saved poems. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: performClear }
        ]
      );
    }
  };

  // Split history into favorites and recent
  const favorites = history.filter(item => item.isFavorite);
  const recent = history.filter(item => !item.isFavorite);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LiquidGlassBackground />
      
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        {history.length > 0 && (
          <Pressable onPress={clearHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No poems rolled yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {favorites.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⭐ Favorites</Text>
              {favorites.map((item) => (
                <View key={item.rollId} style={styles.historyItem}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.poetName}>{item.poet}</Text>
                    <Pressable onPress={() => toggleFavorite(item.rollId)}>
                      <Text style={styles.starIcon}>{item.isFavorite ? '⭐' : '☆'}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.titleText}>{item.title}</Text>
                  <Text style={styles.excerptText} numberOfLines={2}>{item.text}</Text>
                  <Pressable style={styles.copyButton} onPress={() => onCopy(item)}>
                    <Text style={styles.copyButtonText}>📋 Copy</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}

          {recent.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🕐 Recent</Text>
              {recent.map((item) => (
                <View key={item.rollId} style={styles.historyItem}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.poetName}>{item.poet}</Text>
                    <Pressable onPress={() => toggleFavorite(item.rollId)}>
                      <Text style={styles.starIcon}>{item.isFavorite ? '⭐' : '☆'}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.titleText}>{item.title}</Text>
                  <Text style={styles.excerptText} numberOfLines={2}>{item.text}</Text>
                  <Pressable style={styles.copyButton} onPress={() => onCopy(item)}>
                    <Text style={styles.copyButtonText}>📋 Copy</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (fontScaleMultiplier: number) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PoetryTheme.background.safeArea,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing(16),
    paddingBottom: spacing(8),
  },
  title: {
    color: '#fff',
    fontSize: fontSize(32),
    fontWeight: '800',
    fontFamily: 'Arsenal-Bold',
  },
  clearButton: {
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(8),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius(8),
  },
  clearButtonText: {
    color: '#fff',
    fontSize: fontSize(14),
    fontFamily: 'Arsenal-Bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize(16),
    fontFamily: 'Arsenal-Regular',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(16),
    paddingTop: spacing(8),
  },
  sectionTitle: {
    color: PoetryTheme.accent.primary,
    fontSize: fontSize(18),
    fontWeight: '800',
    fontFamily: 'Arsenal-Bold',
    marginTop: spacing(16),
    marginBottom: spacing(12),
    paddingLeft: spacing(4),
  },
  historyItem: {
    backgroundColor: PoetryTheme.glass.cardBackground,
    borderRadius: borderRadius(16),
    padding: spacing(16),
    marginBottom: spacing(12),
    borderColor: PoetryTheme.glass.cardBorder,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(4),
  },
  poetName: {
    color: PoetryTheme.accent.primary,
    fontSize: fontSize(14),
    fontWeight: '800',
    fontFamily: 'Arsenal-Bold',
  },
  starIcon: {
    fontSize: fontSize(20),
  },
  titleText: {
    color: '#fff',
    fontSize: fontSize(13),
    fontStyle: 'italic',
    marginBottom: spacing(8),
    fontFamily: 'Arsenal-Italic',
  },
  excerptText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize(14),
    marginBottom: spacing(12),
    fontFamily: 'Arsenal-Regular',
  },
  copyButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(6),
    backgroundColor: PoetryTheme.glass.lightOverlay,
    borderRadius: borderRadius(12),
    borderWidth: 1,
    borderColor: PoetryTheme.glass.cardBorder,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: fontSize(12),
    fontFamily: 'Arsenal-Bold',
  },
});