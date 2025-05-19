import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from 'react-native';

/**
 * Props for the TouchableFix component
 */
interface TouchableFixProps extends TouchableOpacityProps {
  // We're adding this prop to properly handle it via style
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

/**
 * TouchableFix
 * A wrapper around TouchableOpacity that properly handles the pointerEvents prop via style
 * to avoid React Native web deprecation warnings
 */
export function TouchableFix({
  style,
  pointerEvents,
  disabled,
  ...rest
}: TouchableFixProps) {
  // Create a style object for pointerEvents if needed
  const pointerEventsStyle: ViewStyle | null = pointerEvents 
    ? { pointerEvents } 
    : null;
  
  // Create a style object for disabled state if needed
  const disabledStyle: ViewStyle | null = disabled 
    ? { pointerEvents: 'none' } 
    : null;
  
  // Combine all styles
  const combinedStyle = [
    style,
    pointerEventsStyle,
    disabledStyle
  ].filter(Boolean); // Remove null values
  
  return (
    <TouchableOpacity
      style={combinedStyle}
      activeOpacity={0.7}
      disabled={disabled}
      {...rest}
    />
  );
} 