import { useState } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { colors } from '../theme';

/** Tracks whether a scroll view has moved off its top (spread `onScroll` on it, give it `scrollEventThrottle`). */
export function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrolled(event.nativeEvent.contentOffset.y > 2);
  };
  return { scrolled, onScroll };
}

/** Hairline along the top of a scroll area, drawn once content has scrolled beneath the fixed header. */
export function ScrollEdge({ visible }: { visible: boolean }) {
  return <View pointerEvents="none" style={[styles.edge, visible && styles.visible]} />;
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  visible: { backgroundColor: colors.line2 },
});
