import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, fontWeight, radius, spacing, tabular } from '../theme';

type Kind = 'digit' | 'symbol' | 'letter';
type Run = { text: string; kind: Kind };

/** Digits in gold, symbols in blue, letters in the text colour. */
const RUN_COLOR: Record<Kind, string> = {
  digit: colors.accent,
  symbol: colors.info,
  letter: colors.text,
};

function kindOf(char: string): Kind {
  if (/[0-9]/.test(char)) return 'digit';
  return /[A-Za-z]/.test(char) ? 'letter' : 'symbol';
}

/** Groups consecutive characters of the same kind so a long password stays a handful of spans. */
export function splitRuns(value: string): Run[] {
  const runs: Run[] = [];
  for (const char of value) {
    const kind = kindOf(char);
    const last = runs[runs.length - 1];
    if (last && last.kind === kind) last.text += char;
    else runs.push({ text: char, kind });
  }
  return runs;
}

type Props = { value: string; placeholder: string };

/** Read-only, selectable (long-press to copy) monospace well with colourised characters. */
export function PasswordOutput({ value, placeholder }: Props) {
  const runs = useMemo(() => splitRuns(value), [value]);
  return (
    <View style={styles.well}>
      {value ? (
        <Text selectable accessibilityLabel={`Senha gerada: ${value}`} style={styles.text}>
          {runs.map((run, index) => (
            <Text key={index} style={{ color: RUN_COLOR[run.kind] }}>
              {run.text}
            </Text>
          ))}
        </Text>
      ) : (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    minHeight: 88,
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  text: {
    color: colors.text,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    lineHeight: 32,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.4,
    fontVariant: tabular,
  },
  placeholder: { color: colors.muted, fontSize: fontSize.title, textAlign: 'center' },
});
