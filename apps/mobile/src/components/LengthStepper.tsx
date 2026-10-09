import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fills, fontSize, fontWeight, minTouch, radius, spacing, tabular } from '../theme';
import { Icon, type IconName } from './Icon';

const MIN = 4;
const MAX = 64;
const DEFAULT = 16;

type StepProps = { icon: IconName; label: string; disabled: boolean; onPress: () => void };

function StepButton({ icon, label, disabled, onPress }: StepProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed, disabled && styles.stepOff]}
    >
      <Icon name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

type Props = {
  /** The length is kept as a string, like the original input: the field accepts any text. */
  value: string;
  onChange: (value: string) => void;
};

/** Length row: label on the left, minus / editable number / plus on the right. */
export function LengthStepper({ value, onChange }: Props) {
  const current = Number.parseInt(value, 10) || DEFAULT;
  const step = (delta: number) => onChange(String(Math.min(MAX, Math.max(MIN, current + delta))));
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.label}>Tamanho</Text>
        <Text style={styles.sub}>caracteres</Text>
      </View>
      <View style={styles.stepper}>
        <StepButton icon="minus" label="Diminuir tamanho" disabled={current <= MIN} onPress={() => step(-1)} />
        <TextInput
          accessibilityLabel="Tamanho da senha"
          keyboardType="numeric"
          keyboardAppearance="dark"
          selectTextOnFocus
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          value={value}
          onChangeText={onChange}
          style={styles.input}
        />
        <StepButton icon="plus" label="Aumentar tamanho" disabled={current >= MAX} onPress={() => step(1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.text, fontSize: fontSize.title, fontWeight: fontWeight.medium },
  sub: { marginTop: 1, color: colors.muted, fontSize: fontSize.label },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: fills.field,
  },
  step: { width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  stepPressed: { backgroundColor: colors.surface3 },
  stepOff: { opacity: 0.35 },
  input: {
    width: 56,
    height: minTouch,
    paddingHorizontal: spacing.xs,
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    fontVariant: tabular,
    textAlign: 'center',
  },
});
