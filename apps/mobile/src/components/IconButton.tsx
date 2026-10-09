import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { colors, minTouch } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  /** Shows a gold spinner in place of the icon and blocks presses. */
  loading?: boolean;
};

/** Round 44 pt button on a `surface-2` disc. */
export function IconButton({ icon, onPress, accessibilityLabel, loading = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator size="small" color={colors.accent} /> : <Icon name={icon} size={22} color={colors.text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: minTouch,
    height: minTouch,
    borderRadius: minTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  pressed: { backgroundColor: colors.surface3, transform: [{ scale: 0.94 }] },
});
