import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Card } from './components/Card';
import { GhostButton } from './components/GhostButton';
import { Icon } from './components/Icon';
import { LengthStepper } from './components/LengthStepper';
import { PasswordOutput } from './components/PasswordOutput';
import { PrimaryButton } from './components/PrimaryButton';
import { ScrollEdge, useScrolled } from './components/ScrollEdge';
import { ToggleRow } from './components/ToggleRow';
import { useScreenInsets } from './components/insets';
import { alpha, colors, fills, fontSize, fontWeight, radius, spacing } from './theme';

export function PasswordGenerator({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState('16');
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('');
      return;
    }

    let newPassword = '';
    const passLength = parseInt(length, 10) || 16;

    // Generate an array of secure random values
    const randomValues = Crypto.getRandomValues(new Uint32Array(passLength));

    for (let i = 0; i < passLength; i++) {
      const randomIndex = randomValues[i] % charset.length;
      newPassword += charset[randomIndex];
    }
    setPassword(newPassword);
  };

  const insets = useScreenInsets();
  const { scrolled, onScroll } = useScrolled();

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        <Card style={styles.card}>
          <View style={styles.head}>
            <View style={styles.badge}>
              <Icon name="dice" size={20} color={colors.accent} />
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              Gerador de Senhas
            </Text>
          </View>

          <PasswordOutput value={password} placeholder="Senha gerada..." />

          <LengthStepper value={length} onChange={setLength} />

          <View style={styles.group}>
            <ToggleRow label="Letras maiúsculas" value={includeUppercase} onValueChange={setIncludeUppercase} />
            <ToggleRow divider label="Letras minúsculas" value={includeLowercase} onValueChange={setIncludeLowercase} />
            <ToggleRow divider label="Números" value={includeNumbers} onValueChange={setIncludeNumbers} />
            <ToggleRow divider label="Símbolos" value={includeSymbols} onValueChange={setIncludeSymbols} />
          </View>

          <View style={styles.actions}>
            <PrimaryButton title="Gerar Senha" icon="key" onPress={generatePassword} />
            <GhostButton title="Voltar" icon="chevron-left" iconColor={colors.muted} onPress={onClose} />
          </View>
        </Card>
      </ScrollView>
      <ScrollEdge visible={scrolled} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl },
  card: { padding: spacing.xl, gap: spacing.xl },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.accent, 0.14),
    borderWidth: 1,
    borderColor: alpha(colors.accent, 0.3),
  },
  title: { color: colors.text, fontSize: fontSize.heading, fontWeight: fontWeight.bold, letterSpacing: -0.22 },
  group: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: fills.field,
    overflow: 'hidden',
  },
  actions: { gap: spacing.sm },
});
