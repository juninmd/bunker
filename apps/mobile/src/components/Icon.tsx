import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';
import { colors } from '../theme';

/**
 * Icons are tintable PNG masks rasterized from Ionicons (see assets/icons/LICENSE). `@expo/vector-icons`
 * cannot be imported from the app as installed: npm nests it under expo/node_modules, where Metro and tsc
 * do not resolve it, and no extra dependency was added for icons. Moving to an icon font later only touches this file.
 */
const sources = {
  card: require('../../assets/icons/card.png'),
  'check-circle': require('../../assets/icons/check-circle.png'),
  'chevron-left': require('../../assets/icons/chevron-left.png'),
  'chevron-right': require('../../assets/icons/chevron-right.png'),
  'cloud-done': require('../../assets/icons/cloud-done.png'),
  'cloud-download': require('../../assets/icons/cloud-download.png'),
  dice: require('../../assets/icons/dice.png'),
  eye: require('../../assets/icons/eye.png'),
  'eye-off': require('../../assets/icons/eye-off.png'),
  fingerprint: require('../../assets/icons/fingerprint.png'),
  key: require('../../assets/icons/key.png'),
  lock: require('../../assets/icons/lock.png'),
  minus: require('../../assets/icons/minus.png'),
  note: require('../../assets/icons/note.png'),
  pin: require('../../assets/icons/pin.png'),
  plus: require('../../assets/icons/plus.png'),
  sync: require('../../assets/icons/sync.png'),
  warning: require('../../assets/icons/warning.png'),
} satisfies Record<string, ImageSourcePropType>;

export type IconName = keyof typeof sources;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
};

/** Decorative glyph: hidden from screen readers; the control that holds it carries the label. */
export function Icon({ name, size = 20, color = colors.text, style }: Props) {
  return (
    <Image
      source={sources[name]}
      resizeMode="contain"
      accessible={false}
      importantForAccessibility="no"
      style={[{ width: size, height: size, tintColor: color }, style]}
    />
  );
}
