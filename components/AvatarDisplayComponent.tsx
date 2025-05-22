import React from 'react';
import { View, StyleSheet } from 'react-native'; // Removed Text as ThemedText is used
import { AvatarConfiguration } from '@/types/avatar';
import { ThemedText } from './ThemedText';

interface AvatarDisplayProps {
  avatarConfiguration?: AvatarConfiguration | null;
}

const AvatarDisplayComponent: React.FC<AvatarDisplayProps> = ({ avatarConfiguration }) => {
  if (!avatarConfiguration) {
    return <ThemedText>No avatar configuration set.</ThemedText>;
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Avatar Configuration:</ThemedText>
      <ThemedText>Base Mannequin ID: {avatarConfiguration.baseMannequinId}</ThemedText>
      {avatarConfiguration.tattoos && avatarConfiguration.tattoos.length > 0 ? (
        <>
          <ThemedText style={styles.subtitle}>Tattoos:</ThemedText>
          {avatarConfiguration.tattoos.map((tattoo, index) => (
            <View key={index} style={styles.tattooItem}>
              <ThemedText>Tattoo ID: {tattoo.tattooId}</ThemedText>
              <ThemedText>Position: (x: {tattoo.x}, y: {tattoo.y})</ThemedText>
              <ThemedText>Size: (width: {tattoo.width}, height: {tattoo.height})</ThemedText>
              <ThemedText>Rotation: {tattoo.rotation}°</ThemedText>
              <ThemedText>Layer (zIndex): {tattoo.zIndex}</ThemedText>
            </View>
          ))}
        </>
      ) : (
        <ThemedText>No tattoos selected.</ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  tattooItem: {
    marginLeft: 10,
    marginBottom: 5,
  },
});

export default AvatarDisplayComponent;
