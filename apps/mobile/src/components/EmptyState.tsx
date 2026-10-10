import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, colors, fontSize, fontWeight, spacing } from '../theme';
import { Icon } from './Icon';

/** Empty vault: a gold-lit disc with halo rings, then the hint to sync. */
export function EmptyState() {
  return (
    <View accessible accessibilityLabel="Nenhuma senha. Clique em Sincronizar." style={styles.wrap}>
      <View style={styles.stage}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringInner]} />
        <LinearGradient
          colors={[alpha(colors.accent, 0.22), alpha(colors.accent, 0.06)]}
          style={styles.disc}
        >
          <Icon name="cloud-download" size={36} color={colors.accent} />
        </LinearGradient>
      </View>
      <Text style={styles.title}>Nenhuma senha</Text>
      <Text style={styles.body}>Clique em Sincronizar.</Text>
    </View>
  );
}

const DISC = 88;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: spacing.xxxl, paddingBottom: spacing.xl },
  stage: { width: 200, height: 160, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: alpha(colors.accent, 0.1) },
  ringOuter: { width: 168, height: 168, borderRadius: 84, backgroundColor: alpha(colors.accent, 0.025) },
  ringInner: { width: 128, height: 128, borderRadius: 64, borderColor: alpha(colors.accent, 0.16) },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: alpha(colors.accent, 0.32),
    boxShadow: '0 0 44px 0 rgba(243, 188, 78, 0.3)',
  },
  title: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.1,
  },
  body: { marginTop: spacing.xs, color: colors.muted, fontSize: fontSize.body },
});
