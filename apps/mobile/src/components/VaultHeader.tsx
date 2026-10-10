import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors, fontSize, fontWeight, spacing, tabular } from '../theme';
import { IconButton } from './IconButton';

const mark: ImageSourcePropType = require('../../assets/splash-icon.png');

type Props = {
  count: number;
  isSyncing: boolean;
  /** Same handler the old "Sincronizar com Google Drive (CSV)" button used. */
  onSync: () => void;
};

/** Brand mark, "Bunker", item count with sync state, and the round sync button. */
export function VaultHeader({ count, isSyncing, onSync }: Props) {
  const items = count === 1 ? '1 item' : `${count} itens`;
  return (
    <View style={styles.row}>
      <Image source={mark} accessible={false} style={styles.mark} />
      <View style={styles.texts}>
        <Text accessibilityRole="header" style={styles.title}>
          Bunker
        </Text>
        <Text style={styles.subtitle}>
          {items} · {isSyncing ? 'sincronizando' : 'sincronizado'}
        </Text>
      </View>
      <IconButton
        icon="sync"
        loading={isSyncing}
        onPress={onSync}
        accessibilityLabel="Sincronizar com Google Drive"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  mark: { width: 44, height: 44 },
  texts: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.heading, fontWeight: fontWeight.bold, letterSpacing: -0.22 },
  subtitle: { marginTop: 1, color: colors.muted, fontSize: fontSize.label, fontVariant: tabular },
});
