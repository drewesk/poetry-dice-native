const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Poetry Dice Monochrome + Amber Literary Theme
export const PoetryTheme = {
  // Background gradients
  background: {
    gradient: ['#1a1a1d', '#2d2d34', '#3a3a44', '#4a4a54', '#2a2a30'],
    safeArea: '#1a1a1d',
  },
  
  // Amber literary accent
  accent: {
    primary: '#d4a574',
    gradient: ['#c49961', '#a67c52'],
    light: '#e6c79d',
    dark: '#9d7a54',
  },
  
  // Gradient orbs (monochrome + accent)
  orbs: {
    gray1: 'rgba(180, 180, 190, 0.12)',
    gray2: 'rgba(160, 160, 170, 0.10)',
    amber: 'rgba(212, 165, 116, 0.15)',
  },
  
  // Glass morphism
  glass: {
    cardBackground: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.45)',
    lightOverlay: 'rgba(0, 0, 0, 0.25)',
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.85)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    muted: 'rgba(255, 255, 255, 0.4)',
  },
};
