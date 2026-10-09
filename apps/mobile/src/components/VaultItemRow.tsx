import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fills, fontSize, fontWeight, spacing } from '../theme';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { Icon } from './Icon';
import { KIND_LABEL, kindOf, titleOf, type VaultRowItem } from './vaultItem';

type Props = {
  item: VaultRowItem;
  /** The original row had no action; the prop is here for when it gets one. */
  onPress?: () => void;
};

/** One vault entry: avatar, title, username (or the item type), chevron. */
export function VaultItemRow({ item, onPress }: Props) {
  const kind = kindOf(item);
  const title = titleOf(item);
  const subtitle = item.username || (kind === 'password' ? '' : KIND_LABEL[kind]);
  return (
    <Pressable
      accessible
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {({ pressed }) => (
        <Card style={[styles.row, pressed && styles.rowPressed]}>
          <Avatar title={title} kind={kind} />
          <View style={styles.texts}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Icon name="chevron-right" size={18} color={colors.faint} />
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.985 }] },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
  },
  rowPressed: { backgroundColor: fills.pressed },
  texts: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: fontWeight.semibold, letterSpacing: -0.1 },
  subtitle: { color: colors.muted, fontSize: fontSize.label },
});
