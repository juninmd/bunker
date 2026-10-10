import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  title: string;
  color: string;
  icon?: IconName;
  /** Icon colour; defaults to the label colour. */
  iconColor?: string;
  loading?: boolean;
};

/** Icon (or spinner) plus label, shared by the three button variants. */
export function ButtonContent({ title, color, icon, iconColor = color, loading = false }: Props) {
  return (
    <View style={styles.row}>
      {loading ? <ActivityIndicator size="small" color={iconColor} /> : null}
      {!loading && icon ? <Icon name={icon} size={20} color={iconColor} /> : null}
      <Text numberOfLines={1} maxFontSizeMultiplier={1.25} style={[styles.label, { color }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { fontSize: fontSize.title, fontWeight: fontWeight.semibold, letterSpacing: -0.1 },
});
