import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { loadFontSizeMode } from '@/utils/responsive';

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

  useEffect(() => {
    loadFontSizeMode().then(() => {
      setFontSizeLoaded(true);
    }).catch((error: unknown) => {
      console.error('[RootLayout] Failed to load font size mode:', error);
      setFontSizeLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded && fontSizeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fontSizeLoaded]);

  if (!loaded || !fontSizeLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(custom-tabs)" />
    </Stack>
  );
}
