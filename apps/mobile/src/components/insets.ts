import { Platform, StatusBar, useWindowDimensions } from 'react-native';

export type ScreenInsets = { top: number; bottom: number };

/** Phones with a notch or Dynamic Island are at least 812 pt tall; Dynamic Island models start at 852 pt. */
const NOTCH_MIN_HEIGHT = 812;
const ISLAND_MIN_HEIGHT = 852;

/**
 * Approximate safe-area insets without `react-native-safe-area-context` (not a dependency, and RN's own
 * `SafeAreaView` is deprecated and warns on every launch). Android is edge-to-edge, so the status bar
 * height is the top inset; scrollable screens add their own bottom padding for the navigation bar.
 */
export function useScreenInsets(): ScreenInsets {
  const { height } = useWindowDimensions();
  if (Platform.OS === 'android') return { top: StatusBar.currentHeight ?? 24, bottom: 0 };
  if (Platform.OS === 'ios') {
    if (Platform.isPad || height < NOTCH_MIN_HEIGHT) return { top: 20, bottom: 0 };
    return { top: height >= ISLAND_MIN_HEIGHT ? 59 : 47, bottom: 34 };
  }
  return { top: 0, bottom: 0 };
}
