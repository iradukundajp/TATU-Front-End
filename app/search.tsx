import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, SafeAreaView, Platform, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ArtistCard } from '@/components/ArtistCard';
import * as artistService from '@/services/artist.service';
import * as tattooService from '@/services/tattoo.service';
import { Artist } from '@/types/artist';
import { TattooDesign } from '@/types/tattooDesign';
import { IconSymbol } from '@/components/ui/IconSymbol';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function SearchResultsScreen() {
  const { query: initialQuery = '' } = useLocalSearchParams<{ query?: string }>();
  const [currentSearchQuery, setCurrentSearchQuery] = useState(initialQuery);
  const [displayedQuery, setDisplayedQuery] = useState(initialQuery);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [designs, setDesigns] = useState<TattooDesign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showArtists, setShowArtists] = useState(true);
  const [showDesigns, setShowDesigns] = useState(true);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setArtists([]);
      setDesigns([]);
      setLoading(false);
      setDisplayedQuery(searchQuery);
      return;
    }
    setLoading(true);
    setDisplayedQuery(searchQuery);
    try {
      const [artistResults, designResultsObject] = await Promise.all([
        artistService.searchArtists({ name: searchQuery }),
        tattooService.searchTattooDesigns(searchQuery),
      ]);
      setArtists(artistResults || []); // Ensure artists is an array
      setDesigns(designResultsObject.designs || []);
    } catch (error) {
      console.error('Error performing search:', error);
      setArtists([]);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Sync input with initial query from params when screen focuses or initialQuery changes
      setCurrentSearchQuery(initialQuery);
      if (initialQuery) {
        performSearch(initialQuery);
      } else {
        setArtists([]);
        setDesigns([]);
        setDisplayedQuery('');
      }
    }, [initialQuery, performSearch])
  );

  const handleSearchSubmit = () => {
    const trimmedQuery = currentSearchQuery.trim();
    if (trimmedQuery !== displayedQuery.trim()) {
      // Update URL param to reflect new search, which will trigger useFocusEffect
      router.setParams({ query: trimmedQuery }); 
    } else if (trimmedQuery) {
      // If search query is the same, but user presses search, re-trigger
      performSearch(trimmedQuery);
    }
  };

  const handleArtistPress = (artistId: string) => {
    const artistPath = `/artist/${artistId}` as const;
    router.push(artistPath as any);
  };

  const handleDesignPress = (design: TattooDesign) => {
    console.log('Design pressed:', design);
    alert(`Design: ${design.title}\nStyle: ${design.style}`);
  };

  const toggleArtistsFilter = () => {
    if (!showArtists || showDesigns) {
      setShowArtists(!showArtists);
    } else {
      alert("At least one filter (Artists or Designs) must be active.");
    }
  };

  const toggleDesignsFilter = () => {
    if (!showDesigns || showArtists) {
      setShowDesigns(!showDesigns);
    } else {
      alert("At least one filter (Artists or Designs) must be active.");
    }
  };

  const renderArtistCard = ({ item }: { item: Artist }) => (
    <ArtistCard
      artist={item}
      onPress={handleArtistPress}
      showBookingButton={false} 
      showSendMessageButton={true}
    />
  );

  const renderDesignCard = ({ item }: { item: TattooDesign }) => {
    const fullImageUrl = item.imageUrl && !item.imageUrl.startsWith('http') 
      ? `${API_BASE_URL}${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}` 
      : item.imageUrl;

    return (
      <TouchableOpacity onPress={() => handleDesignPress(item)} style={styles.designCard}>
        <Image 
          source={{ uri: fullImageUrl }}
          style={styles.designImage} 
          contentFit="cover"
          placeholder={require('@/assets/images/icon.png')}
        />
        <ThemedText style={styles.designTitle} numberOfLines={1}>{item.title}</ThemedText>
        <ThemedText style={styles.designStyle} numberOfLines={1}>{item.style}</ThemedText>
      </TouchableOpacity>
    );
  };  

  const noResultsAfterLoad = !loading && artists.length === 0 && designs.length === 0 && !!displayedQuery.trim();
  const showArtistResults = showArtists && artists.length > 0;
  const showDesignResults = showDesigns && designs.length > 0;
  const showNoArtistsMessage = showArtists && artists.length === 0 && !loading && !!displayedQuery.trim();
  const showNoDesignsMessage = showDesigns && designs.length === 0 && !loading && !!displayedQuery.trim();
  const showInitialPrompt = !loading && !displayedQuery.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/explore')} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color="#E0E0E0" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchBar}
            placeholder="Search artists or designs..."
            placeholderTextColor="#888"
            value={currentSearchQuery}
            onChangeText={setCurrentSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {!!displayedQuery.trim() && !loading && (
          <ThemedText type="title" style={styles.title}>
            Results for "{displayedQuery}"
          </ThemedText>
        )}
        {loading && (
             <View style={styles.loadingIndicatorContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <ThemedText style={{marginTop: 10, color: '#A0A0A0'}}>Searching for "{displayedQuery}"...</ThemedText>
            </View>
        )}

        {!loading && (artists.length > 0 || designs.length > 0) && (
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, showArtists && styles.filterButtonActive]} 
              onPress={toggleArtistsFilter}
            >
              <ThemedText style={[styles.filterButtonText, showArtists && styles.filterButtonTextActive]}>Artists ({artists.length})</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, showDesigns && styles.filterButtonActive]} 
              onPress={toggleDesignsFilter}
            >
              <ThemedText style={[styles.filterButtonText, showDesigns && styles.filterButtonTextActive]}>Designs ({designs.length})</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        {showInitialPrompt && (
          <ThemedView style={styles.containerCentered}>
            <ThemedText style={styles.promptText}>Enter a search term to find artists and designs.</ThemedText>
          </ThemedView>
        )}

        {noResultsAfterLoad && (
          <ThemedView style={styles.containerCentered}>
              <ThemedText>No results found for "{displayedQuery}".</ThemedText>
          </ThemedView>
        )}

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {showArtistResults && (
            <>
                <ThemedText type="subtitle" style={styles.subtitle}>Artists</ThemedText>
                <FlatList
                  data={artists}
                  renderItem={renderArtistCard}
                  keyExtractor={(item) => `artist-${item.id.toString()}` }
                  scrollEnabled={false}
                />
            </>
            )}
            {showNoArtistsMessage && !showArtistResults && (designs.length > 0 || !showDesigns) && (
                 <ThemedText style={styles.noResultsText}>No artists found for "{displayedQuery}".</ThemedText>
            )}
            
            {showDesignResults && (
            <>
                <ThemedText type="subtitle" style={[styles.subtitle, { marginTop: showArtistResults ? 20 : 0 }]}>Tattoo Designs</ThemedText>
                <FlatList
                  data={designs}
                  renderItem={renderDesignCard}
                  keyExtractor={(item) => `design-${item.id.toString()}` }
                  numColumns={2} 
                  columnWrapperStyle={styles.row}
                  scrollEnabled={false}
                />
            </>
            )}
            {showNoDesignsMessage && !showDesignResults && (artists.length > 0 || !showArtists) && (
                <ThemedText style={styles.noResultsText}>No tattoo designs found for "{displayedQuery}".</ThemedText>
            )}
        </ScrollView>

      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#161618', // Dark background for the safe area
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Adjust for Android status bar
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: '#161618', // Dark background
  },
  promptText: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 25 : 15, // Increased top padding for Android
    paddingBottom: 10,
    backgroundColor: '#1C1C1C', 
    marginHorizontal: -16, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backButton: {
    padding: 5, // Added padding for easier touch
    marginRight: 8, // Space between button and search bar
  },
  searchBar: {
    flex: 1,
    height: 44, 
    backgroundColor: '#2C2C2C', 
    borderRadius: 22, 
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#E0E0E0', 
  },
  title: {
    marginTop: 20, // Add margin after header
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 20, 
    color: '#E0E0E0',
  },
  loadingIndicatorContainer: {
    flex: 1, // Make it take available space if results are not yet loaded
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, // Increased margin
    flexWrap: 'wrap', 
    gap: 10, 
  },
  filterButton: {
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    borderRadius: 20, 
    borderWidth: 1.5, // Slightly thicker border
    borderColor: '#007AFF',
    alignItems: 'center', 
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#007AFF',
    textAlign: 'center', 
    fontWeight: '600', // Bolder text
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  containerCentered: {
    flex: 1, // Make it take available space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 19, // Slightly larger subtitle
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 12,
    marginTop: 10, // Adjusted top margin
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 25, // Increased margin
    fontSize: 16,
    color: '#A0A0A0', 
  },
  designCard: {
    flex: 0.5, 
    margin: 6, // Slightly increased margin
    padding: 10, 
    borderWidth: 1,
    borderColor: '#333', 
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1C1C1C', 
  },
  designImage: {
    width: '100%', 
    aspectRatio: 1, 
    borderRadius: 6, // Slightly more rounded
    marginBottom: 10,
    backgroundColor: '#2C2C2C', 
  },
  designTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15, // Slightly larger
    color: '#E0E0E0', 
    marginBottom: 2,
  },
  designStyle: {
    fontSize: 13, // Slightly larger
    color: '#A0A0A0', 
    textAlign: 'center',
  },
  row: {
    // justifyContent: "space-around" // Not needed due to flex: 0.5 on card
  },
  scrollViewContent: {
    paddingBottom: 20, // Add padding to the bottom of the scroll view
  }
});
