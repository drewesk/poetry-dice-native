import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Dimensions, PixelRatio } from 'react-native';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Calculate scale factors
const widthScale = screenWidth / BASE_WIDTH;
const heightScale = screenHeight / BASE_HEIGHT;

// Use the smaller scale to maintain proportions
const scale = Math.min(widthScale, heightScale);

// Pixel ratio for high DPI screens
const pixelRatio = PixelRatio.get();

export type FontSizeMode = 'normal' | 'large';

const FONT_SIZE_MODE_STORAGE_KEY = '@poetry_dice_font_size_mode';

const FONT_SIZE_MULTIPLIERS: Record<FontSizeMode, number> = {
  normal: 1,
  large: 1.25,
};

let globalFontSizeMode: FontSizeMode = 'normal';
const fontSizeListeners = new Set<() => void>();

const notifyFontSizeListeners = () => {
  fontSizeListeners.forEach((listener) => listener());
};

export const getFontSizeMode = (): FontSizeMode => globalFontSizeMode;

export const getFontScaleMultiplier = (): number => {
  return FONT_SIZE_MULTIPLIERS[globalFontSizeMode];
};

const subscribeToFontSizeMode = (listener: () => void) => {
  fontSizeListeners.add(listener);
  return () => fontSizeListeners.delete(listener);
};

export const setFontSizeMode = async (mode: FontSizeMode) => {
  globalFontSizeMode = mode;
  notifyFontSizeListeners();
  await AsyncStorage.setItem(FONT_SIZE_MODE_STORAGE_KEY, mode);
};

export const loadFontSizeMode = async () => {
  const storedMode = await AsyncStorage.getItem(FONT_SIZE_MODE_STORAGE_KEY);
  if (storedMode === 'normal' || storedMode === 'large') {
    globalFontSizeMode = storedMode;
    notifyFontSizeListeners();
  }
};

export const useFontSizeMode = () => {
  const fontSizeMode = useSyncExternalStore(subscribeToFontSizeMode, getFontSizeMode);

  return {
    fontSizeMode,
    fontScaleMultiplier: FONT_SIZE_MULTIPLIERS[fontSizeMode],
    setFontSizeMode,
  };
};

/**
 * Responsive font sizing
 */
export const fontSize = (size: number, multiplier = getFontScaleMultiplier()): number => {
  const newSize = size * scale * multiplier;
  
  if (screenWidth < 320) {
    return Math.max(newSize, size * 0.8);
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Responsive spacing (padding, margin)
 */
export const spacing = (size: number): number => {
  const newSize = size * scale;
  
  if (screenWidth < 320) {
    return Math.max(newSize, size * 0.75);
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Responsive border radius
 */
export const borderRadius = (size: number): number => {
  const newSize = size * scale;
  return Math.round(newSize);
};

/**
 * Minimum touch target size for iOS (44pt)
 */
export const minTouchSize = (size: number): number => {
  const minSize = 44 * Math.max(scale, 1);
  const scaledSize = size * scale;
  return Math.max(scaledSize, minSize);
};
