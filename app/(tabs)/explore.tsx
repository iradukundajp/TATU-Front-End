import { Image } from 'expo-image';
import { Platform, StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ExploreScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <ThemedView style={styles.headerTextView}>
          <ThemedText
            type="title"
            style={styles.headerText}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
          >
            TATU
          </ThemedText>
        </ThemedView>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Highlights</ThemedText>
        <ThemedView style={styles.placeholderBox}>
          <ThemedText style={styles.placeholderText}>Highlight 1</ThemedText>
        </ThemedView>
        <ThemedView style={styles.placeholderBox}>
          <ThemedText style={styles.placeholderText}>Highlight 2</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Featured Artists</ThemedText>
        <ThemedView style={styles.placeholderBox}>
          <ThemedText style={styles.placeholderText}>Artist Profile 1</ThemedText>
        </ThemedView>
        <ThemedView style={styles.placeholderBox}>
          <ThemedText style={styles.placeholderText}>Artist Profile 2</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Trending Tattoos</ThemedText>
        <ThemedView style={styles.placeholderBox}>
          <ThemedText style={styles.placeholderText}>Tattoo Image 1</ThemedText>
        </ThemedView>
        <ThemedView style={styles.placeholderBox}>
          <ThemedText style={styles.placeholderText}>Tattoo Image 2</ThemedText>
        </ThemedView>
      </ThemedView>

      
        
      
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerTextView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  placeholderBox: {
    backgroundColor: '#E0E0E0',
    padding: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  placeholderText: {
    color: '#333333',
    fontSize: 16,
  },
});
