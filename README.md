# 🎲 Poetry Dice

Discover random poems with a roll of the dice. A React Native mobile app for iOS and Android.

**Original Idea by James Lalonde**

## Features

### Home Tab
- 🎲 Roll for random poetry excerpts
- 📳 Shake your device to roll
- ⚙️ Adjustable text size (Normal/Large)
- 📋 Copy poems to clipboard
- 📤 Share poems with others
- Animated roll button with rotation and scaling effects

### History Tab
- 📚 View all previously rolled poems
- ⭐ Star/favorite your favorite poems
- 📋 Copy individual poems
- 🗑️ Clear all history with confirmation

## Poetry Collection

This v1.0.0 includes 5 public domain poems:
- Robert Frost - "The Road Not Taken" (1916)
- Emily Dickinson - "Hope is the thing with feathers" (1891)
- William Shakespeare - "Sonnet 18" (1609)
- Edgar Allan Poe - "The Raven" (1845)
- Walt Whitman - "O Captain! My Captain!" (1865)

## Tech Stack

- **Framework**: Expo ~54.0.30 + React Native
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs)
- **Storage**: AsyncStorage
- **Fonts**: Arsenal (Open Font License)
- **Animations**: React Native Animated API
- **Sensors**: Expo Sensors (Accelerometer)

## Getting Started

### Prerequisites
- Node.js (LTS)
- Expo CLI

### Installation

```bash
npm install
```

### Running the App

```bash
npm start
```

Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- `r` to reload

## Project Structure

```
poetry-dice-native/
├── app/
│   ├── (custom-tabs)/
│   │   ├── _layout.tsx       # Tab navigation
│   │   ├── index.tsx          # Home screen
│   │   └── history.tsx        # History screen
│   └── _layout.tsx            # Root layout with fonts
├── assets/
│   └── fonts/Arsenal/         # Local font files
├── components/
│   └── LiquidGlassBackground.tsx
├── constants/
│   └── Colors.ts
├── lib/
│   └── poetry-api.ts          # Hardcoded poetry data
└── utils/
    └── responsive.ts          # Responsive sizing utilities
```

## Key Features Implementation

### Shake-to-Roll
Uses Expo Sensors Accelerometer with:
- 1.5 g-force threshold
- 500ms debounce
- Haptic feedback on shake

### Font Size System
- Normal mode: 1x multiplier
- Large mode: 1.25x multiplier
- Persisted to AsyncStorage
- Affects all text globally

### Responsive Sizing
All UI elements scale proportionally based on:
- Base device: iPhone 14 Pro (393x852)
- Utilities: `fontSize()`, `spacing()`, `borderRadius()`, `minTouchSize()`

## Credits

- **Original Concept**: James Lalonde
- **Development**: Andrew
- **Font**: Arsenal by Andrij Shevchenko (OFL)

## License

This project is private.

## Version

v1.0.0
