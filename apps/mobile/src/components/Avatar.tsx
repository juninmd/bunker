import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, fontWeight, typeColors } from '../theme';
import { avatarColors, initialOf } from './avatarColor';
import { Icon, type IconName } from './Icon';
import type { VaultItemKind } from './vaultItem';

const KIND_ICON: Record<Exclude<VaultItemKind, 'password'>, IconName> = {
  note: 'note',
  card: 'card',
  address: 'pin',
  passkey: 'key',
};

type Props = {
  title: string;
  kind: VaultItemKind;
  size?: number;
};

/**
 * Squircle tile. Passwords get the first letter of the site over a hue gradient derived from the title;
 * notes, cards, addresses and passkeys get their type icon in the type colour (docs/DESIGN.md "selo de tipo").
 */
export function Avatar({ title, kind, size = 44 }: Props) {
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.32) };
  if (kind !== 'password') {
    const tone = typeColors[kind];
    return (
      <View
        style={[styles.base, box, { backgroundColor: alpha(tone, 0.14), borderColor: alpha(tone, 0.3) }]}
      >
        <Icon name={KIND_ICON[kind]} size={Math.round(size * 0.5)} color={tone} />
      </View>
    );
  }
  return (
    <LinearGradient
      colors={avatarColors(title)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, box, styles.gradientEdge]}
    >
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.42) }]} allowFontScaling={false}>
        {initialOf(title)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderCurve: 'continuous' },
  gradientEdge: { borderColor: 'rgba(255, 255, 255, 0.16)' },
  letter: { color: '#ffffff', fontWeight: fontWeight.bold },
});
