// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Mapping from SF Symbols to Material Icons
 */
const ICON_MAPPING: Record<string, MaterialIconName> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'line.3.horizontal': 'menu',
  'xmark': 'close',
  'safari.fill': 'explore',
  'pencil.tip': 'edit',
  'calendar': 'event',
  'photo.on.rectangle': 'photo-album',
  'calendar.badge.clock': 'event-note',
  'message.fill': 'message',
  'person.fill': 'person',
  'rectangle.portrait.and.arrow.right': 'logout',
  'star.fill': 'star',
  'magnifyingglass': 'search',
  'xmark.circle.fill': 'cancel',
  'flame.fill': 'whatshot',
  'sparkles': 'auto-awesome',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Use the mapped icon name or a default icon if no mapping exists
  const iconName: MaterialIconName = ICON_MAPPING[name] || 'help-outline';
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
