import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fills, fontSize, fontWeight, radius, shadows, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry' | 'placeholderTextColor'> & {
  label: string;
  /** Secret value: masked by default, with an eye button to reveal it. */
  secret?: boolean;
  /** Decorative glyph before the text; turns gold with the focus. */
  icon?: IconName;
};

/** Labelled field: 52 pt tall, hairline border that turns gold (plus a soft ring) while focused. */
export function TextField({ label, secret = false, icon, onFocus, onBlur, accessibilityLabel, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  return (
    <View>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={styles.label}
      >
        {label}
      </Text>
      <View style={[styles.field, focused && styles.focused]}>
        {icon ? (
          <Icon name={icon} size={20} color={focused ? colors.accent : colors.muted} style={styles.lead} />
        ) : null}
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardAppearance="dark"
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          placeholderTextColor={colors.muted}
          {...rest}
          accessibilityLabel={accessibilityLabel ?? label}
          secureTextEntry={secret && !revealed}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={styles.input}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={4}
            onPress={() => setRevealed((value) => !value)}
            style={({ pressed }) => [styles.eye, pressed && styles.eyePressed]}
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} size={22} color={revealed ? colors.accent : colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
    color: colors.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingLeft: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: fills.field,
  },
  focused: { borderColor: colors.accent, backgroundColor: fills.fieldFocus, boxShadow: shadows.focus },
  lead: { marginRight: spacing.md },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.medium,
  },
  eye: { width: 48, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  eyePressed: { backgroundColor: fills.pressed },
});
