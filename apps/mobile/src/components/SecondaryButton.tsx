import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { ButtonContent } from './ButtonContent';
import type { ButtonProps } from './buttonTypes';

/** Quiet surface button (`surface-2` plus a hairline); `surface-3` while pressed. */
export function SecondaryButton({
  title,
  onPress,
  icon,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <ButtonContent title={title} icon={icon} color={colors.text} iconColor={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: { backgroundColor: colors.surface3, borderColor: colors.line2, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
});
