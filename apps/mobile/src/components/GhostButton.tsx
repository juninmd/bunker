import { Pressable, StyleSheet } from 'react-native';
import { colors, fills, radius, spacing } from '../theme';
import { ButtonContent } from './ButtonContent';
import type { ButtonProps } from './buttonTypes';

type Props = ButtonProps & {
  /** Label colour; defaults to the primary text colour. */
  color?: string;
  /** Icon colour; defaults to the gold accent. */
  iconColor?: string;
};

/** Transparent button for tertiary actions; a faint overlay while pressed. */
export function GhostButton({
  title,
  onPress,
  icon,
  disabled = false,
  color = colors.text,
  iconColor = colors.accent,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <ButtonContent title={title} icon={icon} color={color} iconColor={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: fills.pressed },
  disabled: { opacity: 0.5 },
});
