import { Pressable, StyleSheet, Text, View } from 'react-native';
import { alpha, colors, fontSize, fontWeight, radius, spacing } from '../theme';
import { Card } from './Card';
import { Icon } from './Icon';

type Props = {
  enabled: boolean;
  /** Same handler in both states: it opens the system autofill settings. */
  onPress: () => void;
};

/** Android autofill status: green with a check when active, orange with a hint when it still needs enabling. */
export function StatusCard({ enabled, onPress }: Props) {
  const tone = enabled ? colors.ok : colors.warn;
  const title = enabled ? 'Preenchimento automático ativado' : 'Ativar preenchimento automático';
  const hint = 'Ao clicar, selecione o Bunker na lista do sistema.';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={enabled ? title : `${title}. ${hint}`}
      accessibilityHint="Abre as configurações de preenchimento automático do Android"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card tint={tone} style={styles.card}>
        <View style={[styles.tile, { backgroundColor: alpha(tone, 0.16) }]}>
          <Icon name={enabled ? 'check-circle' : 'warning'} size={22} color={tone} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          {enabled ? null : <Text style={styles.hint}>{hint}</Text>}
        </View>
        {enabled ? null : <Icon name="chevron-right" size={18} color={alpha(tone, 0.8)} />}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  card: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: fontSize.body, fontWeight: fontWeight.semibold, lineHeight: 20 },
  hint: { color: colors.muted, fontSize: fontSize.label, lineHeight: 18 },
});
