import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontWeight, radius } from '../theme';
import { avatarColors, avatarGlow, initialOf } from './avatarColor';
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
 * Squircle tile in the extension's recipe: a hue gradient taken from the title, white content, a 1 px inner
 * ring and a soft coloured shadow. Passwords show the site's first letter; notes, cards, addresses and
 * passkeys show their type icon. Decorative: the row already names the item.
 */
export function Avatar({ title, kind, size = 40 }: Props) {
  return (
    <LinearGradient
      colors={avatarColors(title)}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.tile, { width: size, height: size, boxShadow: avatarGlow(title) }]}
    >
      {kind === 'password' ? (
        <Text style={[styles.letter, { fontSize: Math.round(size * 0.4) }]} allowFontScaling={false}>
          {initialOf(title)}
        </Text>
      ) : (
        <Icon name={KIND_ICON[kind]} size={Math.round(size * 0.47)} color="#ffffff" />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderCurve: 'continuous',
  },
  letter: {
    color: '#ffffff',
    fontWeight: fontWeight.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
