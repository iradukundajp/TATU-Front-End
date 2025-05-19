import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, pointerEvents, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // Handle pointerEvents through style instead of as a direct prop
  const styleWithPointerEvents = pointerEvents 
    ? [{ backgroundColor, pointerEvents }, style] 
    : [{ backgroundColor }, style];

  return <View style={styleWithPointerEvents} {...otherProps} />;
}
