/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

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
    card: '#f8f9fa', // A light grey for card backgrounds
    border: '#dee2e6', // A light grey for borders
    textMuted: '#6c757d', // A muted text color
    danger: '#dc3545', // A standard danger/error color
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#212529', // A dark grey for card backgrounds
    border: '#343a40', // A darker grey for borders
    textMuted: '#adb5bd', // A muted text color for dark mode
    danger: '#f04141', // A slightly brighter danger color for dark mode
  },
};
