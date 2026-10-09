import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { alpha, colors, fontSize, fontWeight, spacing } from '../theme';
import { GhostButton } from './GhostButton';
import { PrimaryButton } from './PrimaryButton';
import { ScreenBackground } from './ScreenBackground';
import { TextField } from './TextField';
import { useScreenInsets } from './insets';

const mark: ImageSourcePropType = require('../../assets/splash-icon.png');

type Props = {
  masterPassword: string;
  onChangePassword: (value: string) => void;
  onUnlock: () => void;
  onBiometric: () => void;
};

/** Lock screen: brand mark with a gold halo, wordmark, master-password field, unlock actions. */
export function LockScreen({ masterPassword, onChangePassword, onUnlock, onBiometric }: Props) {
  const insets = useScreenInsets();
  return (
    <ScreenBackground>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl * 2 }]}
        >
          <View style={styles.brand}>
            <View style={styles.halo}>
              <View style={[styles.ring, styles.ringOuter]} />
              <View style={[styles.ring, styles.ringInner]} />
              <View style={[styles.ring, styles.ringCore]} />
              <Image source={mark} accessible={false} style={styles.mark} />
            </View>
            <Text accessibilityRole="header" style={styles.wordmark}>
              Bunker
            </Text>
            <Text style={styles.hint}>Digite sua senha mestra para desbloquear o cofre offline.</Text>
          </View>
          <View style={styles.form}>
            <TextField
              label="Senha mestra"
              icon="lock"
              secret
              value={masterPassword}
              onChangeText={onChangePassword}
            />
            <View style={styles.actions}>
              <PrimaryButton
                title="Desbloquear"
                onPress={onUnlock}
                disabled={masterPassword.length === 0}
              />
              <GhostButton title="Desbloquear com biometria" icon="fingerprint" onPress={onBiometric} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxxl + spacing.sm },
  halo: { width: 184, height: 184, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: alpha(colors.accent, 0.1) },
  ringOuter: { width: 184, height: 184, borderRadius: 92, backgroundColor: alpha(colors.accent, 0.025) },
  ringInner: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderColor: alpha(colors.accent, 0.16),
    backgroundColor: alpha(colors.accent, 0.04),
  },
  ringCore: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderColor: alpha(colors.accent, 0.2),
    backgroundColor: alpha(colors.accent, 0.07),
  },
  mark: { width: 112, height: 112 },
  wordmark: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.32,
  },
  hint: {
    marginTop: spacing.sm,
    maxWidth: 280,
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 21,
    textAlign: 'center',
  },
  form: { gap: spacing.xl },
  actions: { gap: spacing.sm },
});
