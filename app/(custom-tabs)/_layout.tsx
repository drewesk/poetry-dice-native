import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { fontSize, useFontSizeMode } from '@/utils/responsive';

import HomeScreen from './index';
import HistoryScreen from './history';

const Tab = createBottomTabNavigator();

export default function CustomTabLayout() {
  const { fontSizeMode } = useFontSizeMode();

  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="index"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon name="house.fill" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="history"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <TabIcon name="clock.fill" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
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