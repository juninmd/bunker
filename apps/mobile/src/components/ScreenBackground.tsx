import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, colors } from '../theme';
import { useScreenInsets } from './insets';

const GLOW_HEIGHT = 380;

type Props = { children: ReactNode };

/**
 * Near-black canvas with a soft gold light from the top edge (docs/DESIGN.md: "brilho de fundo").
 * Linear gradients only: the vertical one is the light, the two side ones dissolve it into the
 * background so it reads as an ellipse. Children are laid out inside the top safe area.
 */
export function ScreenBackground({ children }: Props) {
  const insets = useScreenInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View pointerEvents="none" style={styles.glow}>
        <LinearGradient
          colors={[alpha(colors.accent, 0.14), alpha(colors.accent, 0.05), alpha(colors.accent, 0)]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.bg, alpha(colors.bg, 0)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fade, styles.fadeLeft]}
        />
        <LinearGradient
          colors={[alpha(colors.bg, 0), colors.bg]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fade, styles.fadeRight]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: GLOW_HEIGHT },
  fade: { position: 'absolute', top: 0, bottom: 0, width: '42%' },
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
});
