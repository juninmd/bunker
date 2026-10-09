import { Pressable, StyleSheet, Switch, Text } from 'react-native';
import { colors, fills, fontSize, fontWeight, spacing } from '../theme';

type Props = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Hairline above the row, for the 2nd row onwards of a group. */
  divider?: boolean;
};

/**
 * Whole-row switch (52 pt): the row is the touch target and the accessible "switch";
 * the native Switch only mirrors the state, so a tap can never toggle twice.
 */
export function ToggleRow({ label, value, onValueChange, divider = false }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
      <Switch
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        value={value}
        trackColor={{ false: colors.surface3, true: colors.accent }}
        thumbColor={value ? colors.text : colors.muted}
        ios_backgroundColor={colors.surface3}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  pressed: { backgroundColor: fills.pressed },
  label: { color: colors.text, fontSize: fontSize.title, fontWeight: fontWeight.medium },
});
