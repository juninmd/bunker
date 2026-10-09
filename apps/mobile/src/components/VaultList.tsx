import { FlatList, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';
import { colors, fontSize, spacing } from '../theme';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';
import { PrimaryButton } from './PrimaryButton';
import { ScrollEdge, useScrolled } from './ScrollEdge';
import { SecondaryButton } from './SecondaryButton';
import { StatusCard } from './StatusCard';
import { VaultItemRow } from './VaultItemRow';
import { useScreenInsets } from './insets';
import type { VaultRowItem } from './vaultItem';

type Props = {
  data: VaultRowItem[];
  isSyncing: boolean;
  /** Same handler the old "Sincronizar com Google Drive (CSV)" button used. */
  onSync: () => void;
  onOpenGenerator: () => void;
  hasAutofillSupport: boolean;
  isAutofillEnabled: boolean;
  onRequestAutofill: () => void;
};

const keyExtractor = (item: VaultRowItem) => item.id;
const renderItem = ({ item }: ListRenderItemInfo<VaultRowItem>) => <VaultItemRow item={item} />;
const Separator = () => <View style={styles.separator} />;

function Footnote() {
  return (
    <View style={styles.footnote}>
      <Icon name="cloud-done" size={15} color={colors.muted} />
      <Text style={styles.footnoteText}>Sincronização offline-first com Google Drive ativa.</Text>
    </View>
  );
}

/** Actions, autofill status and the item list, scrolling together under the fixed header. */
export function VaultList({
  data,
  isSyncing,
  onSync,
  onOpenGenerator,
  hasAutofillSupport,
  isAutofillEnabled,
  onRequestAutofill,
}: Props) {
  const insets = useScreenInsets();
  const { scrolled, onScroll } = useScrolled();
  const top = (
    <View style={styles.top}>
      <View style={styles.actions}>
        <PrimaryButton
          title="Sincronizar"
          icon="sync"
          loading={isSyncing}
          onPress={onSync}
          accessibilityLabel="Sincronizar com Google Drive"
          style={styles.primary}
        />
        <SecondaryButton
          title="Gerador"
          icon="dice"
          onPress={onOpenGenerator}
          accessibilityLabel="Abrir gerador de senhas"
          style={styles.secondary}
        />
      </View>
      {hasAutofillSupport ? (
        <StatusCard enabled={isAutofillEnabled} onPress={onRequestAutofill} />
      ) : null}
    </View>
  );
  return (
    <View style={styles.flex}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={top}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={<Footnote />}
        indicatorStyle="white"
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      />
      <ScrollEdge visible={scrolled} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl },
  top: { gap: spacing.md, marginBottom: spacing.xl },
  actions: { flexDirection: 'row', gap: spacing.md },
  primary: { flex: 1.3 },
  secondary: { flex: 1 },
  separator: { height: spacing.sm + 2 },
  footnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm - 2,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  footnoteText: { flexShrink: 1, color: colors.muted, fontSize: fontSize.caption, textAlign: 'center' },
});
