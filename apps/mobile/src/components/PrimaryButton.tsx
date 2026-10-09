import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, colors, fills, gradients, radius, shadows, spacing } from '../theme';
import { ButtonContent } from './ButtonContent';
import type { ButtonProps } from './buttonTypes';

type Props = ButtonProps & { loading?: boolean };

/**
 * Gold call to action: gradient, ink label, glow. Pressed it sinks 1 px and loses the glow;
 * `loading` keeps the gold but blocks presses; `disabled` falls back to a tonal gold outline.
 */
export function PrimaryButton({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        !disabled && !pressed && { boxShadow: shadows.glow },
        pressed && styles.pressed,
        style,
      ]}
    >
      {({ pressed }) => (
        <View style={[styles.shell, disabled && styles.shellOff]}>
          {disabled ? null : (
            <LinearGradient
              colors={pressed ? gradients.primaryPressed : gradients.primary}
              style={StyleSheet.absoluteFill}
            />
          )}
          {disabled ? null : <View pointerEvents="none" style={styles.edge} />}
          <ButtonContent
            title={title}
            icon={icon}
            loading={loading}
            color={disabled ? alpha(colors.accent, 0.7) : colors.accentInk}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { borderRadius: radius.md },
  pressed: { transform: [{ translateY: 1 }] },
  shell: {
    minHeight: 52,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
  },
  shellOff: { backgroundColor: alpha(colors.accent, 0.1), borderWidth: 1, borderColor: alpha(colors.accent, 0.2) },
  edge: {
    position: 'absolute',
    top: 0,
    left: radius.md,
    right: radius.md,
    height: 1,
    backgroundColor: fills.highlight,
  },
});
