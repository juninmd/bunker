import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from './Icon';

/** Props shared by PrimaryButton, SecondaryButton and GhostButton. */
export type ButtonProps = {
  title: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};
