import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { fontSize, useFontSizeMode } from '@/utils/responsive';

export default function CustomTabLayout() {
  const { fontSizeMode } = useFontSizeMode();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.tint,
        headerShown: false,
        tabBarLabelStyle: fontSizeMode === 'large' ? {
          fontSize: fontSize(10),
        } : undefined,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <TabIcon name="clock.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple icon component using emoji
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    'house.fill': '🏠',
    'clock.fill': '🕐',
  };
  return <Text style={{ fontSize: 28, color }}>{icons[name] || '❓'}</Text>;
}