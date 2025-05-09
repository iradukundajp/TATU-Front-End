import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TattoosScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Tattoos</ThemedText>
      <ThemedText>This is the Tattoos screen.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
