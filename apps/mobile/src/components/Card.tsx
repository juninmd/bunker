import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, colors, fills, gradients, radius } from '../theme';

type Props = ViewProps & {
  /** Optional state colour (ok / warn): tints the sheen and the border. */
  tint?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Translucent card of docs/DESIGN.md: white sheen over the canvas, hairline border, lit top edge. */
export function Card({ tint, style, children, ...rest }: Props) {
  const border = tint ? { borderColor: alpha(tint, 0.3), borderTopColor: alpha(tint, 0.45) } : null;
  return (
    <View {...rest} style={[styles.card, border, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={tint ? [alpha(tint, 0.14), alpha(tint, 0.05)] : gradients.card}
        style={StyleSheet.absoluteFill as any}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: fills.cardEdge,
    overflow: 'hidden',
  },
});
