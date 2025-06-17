import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, SafeAreaView, Platform, TextInput, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ArtistCard } from '@/components/ArtistCard';
import * as artistService from '@/services/artist.service';
import * as tattooService from '@/services/tattoo.service';
import * as messageService from '@/services/message.service';
import { Artist } from '@/types/artist';
import { TattooDesign } from '@/types/tattooDesign';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AuthContext, AuthState } from '@/contexts/AuthContext'; // Import AuthState for typing
import { Conversation } from '@/types/message'; // Import Conversation type

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const TATTOO_STYLES = [
  'Traditional', 'Realism', 'Watercolor', 'Tribal', 'New School', 
  'Neo-Traditional', 'Japanese', 'Blackwork', 'Geometric', 
  'Illustrative', 'Minimalist', 'Abstract', 'Dotwork', 'Script'
];

export default function SearchResultsScreen() {
  const { query: initialQuery = '' } = useLocalSearchParams<{ query?: string }>();
  const [currentSearchQuery, setCurrentSearchQuery] = useState(initialQuery);
  const [displayedQuery, setDisplayedQuery] = useState(initialQuery);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [designs, setDesigns] = useState<TattooDesign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showArtists, setShowArtists] = useState(true);
  const [showDesigns, setShowDesigns] = useState(true);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const auth = useContext(AuthContext) as AuthState; // Type assertion for auth context
  const user = auth?.user; // Get user from typed auth context

  const performSearch = useCallback(async (searchQuery: string, stylesToSearch: string[] = []) => {
    if (!searchQuery.trim() && stylesToSearch.length === 0) {
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
        // Only search artists if the main query is present, or if styles are not the only filter
        (searchQuery.trim() || stylesToSearch.length === 0) ? artistService.searchArtists({ name: searchQuery }) : Promise.resolve([]),
        tattooService.searchTattooDesigns(searchQuery, stylesToSearch), // Pass selected styles
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
      setCurrentSearchQuery(initialQuery);
      if (initialQuery || selectedStyles.length > 0) { // Trigger search if there's a query or selected styles
        performSearch(initialQuery, selectedStyles);
      } else {
        setArtists([]);
        setDesigns([]);
        setDisplayedQuery('');
      }
    }, [initialQuery, performSearch, selectedStyles]) // Add selectedStyles to dependencies
  );

  const handleSearchSubmit = () => {
    const trimmedQuery = currentSearchQuery.trim();
    // Update URL param to reflect new search, which will trigger useFocusEffect
    // Perform search directly if query changes or styles are selected
    if (trimmedQuery !== displayedQuery.trim() || selectedStyles.length > 0) {
        router.setParams({ query: trimmedQuery }); 
        // performSearch will be called by useFocusEffect due to param change or if selectedStyles changed
    } else if (trimmedQuery) {
        performSearch(trimmedQuery, selectedStyles);
    }
  };
  
  const handleToggleStyle = (style: string) => {
    setSelectedStyles(prevStyles => {
      const newStyles = prevStyles.includes(style)
        ? prevStyles.filter(s => s !== style)
        : [...prevStyles, style];
      // Immediately perform search with new styles and current query
      // If initialQuery is empty and we are only using style filters, we need to pass an empty string for the query
      performSearch(currentSearchQuery.trim() || initialQuery, newStyles); 
      return newStyles;
    });
  };

  const handleArtistPress = (artistId: string) => {
    const artistPath = `/artist/${artistId}` as const;
    router.push(artistPath as any);
  };

  const handleSendMessage = async (artistId: string) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to send messages.");
      return;
    }
    if (user.id === artistId) {
      Alert.alert("Error", "You cannot send a message to yourself.");
      return;
    }
    try {
      const conversation = await messageService.startConversation(artistId);
      if (conversation && conversation.id) {
        router.push(`/chat/${conversation.id}` as any);
      } else {
        const existingConversations: Conversation[] = await messageService.getUserConversations();
        const existingConvo = existingConversations.find(c => c.otherUser.id === artistId );
        
        if (existingConvo) {
            router.push(`/chat/${existingConvo.id}` as any);
        } else {
            Alert.alert("Error", "Could not start or find conversation. The backend might not have returned a conversation ID, or no existing conversation was found.");
        }
      }
    } catch (error) {
      console.error('Error starting or finding conversation:', error);
      Alert.alert("Error", "Failed to start or find conversation. Please try again.");
    }
  };

  const handleDesignPress = (design: TattooDesign) => {
    console.log('Design pressed:', design);
    alert(`Design: ${design.title}\\nStyle: ${design.style}`);
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
      onSendMessage={() => handleSendMessage(item.id)} // Use new handler
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
  const showInitialPrompt = !loading && !displayedQuery.trim() && artists.length === 0 && designs.length === 0 && selectedStyles.length === 0;

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
            Results for "{displayedQuery}"{selectedStyles.length > 0 ? ` (Styles: ${selectedStyles.join(', ')})` : ''}
          </ThemedText>
        )}
        {loading && (
             <View style={styles.loadingIndicatorContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <ThemedText style={{marginTop: 10, color: '#A0A0A0'}}>Searching for "{displayedQuery}"{selectedStyles.length > 0 ? ` with styles: ${selectedStyles.join(', ')}` : ''}...</ThemedText>
            </View>
        )}

        {!loading && (artists.length > 0 || designs.length > 0 || selectedStyles.length > 0) && (
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

        {!loading && (showArtists || showDesigns) && designs.length === 0 && artists.length === 0 && selectedStyles.length > 0 && !displayedQuery.trim() && (
            <ThemedView style={styles.containerCentered}>
                <ThemedText>No results found for selected styles: "{selectedStyles.join(', ')}".</ThemedText>
            </ThemedView>
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
            {/* Style Filters */}
            {showDesigns && ( // Only show style filters if designs are being shown
            <View style={styles.styleFilterSection}>
                <ThemedText type="subtitle" style={styles.styleFilterTitle}>Filter by Style</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleFilterContainer}>
                {TATTOO_STYLES.map(style => (
                    <TouchableOpacity
                    key={style}
                    style={[
                        styles.styleButton,
                        selectedStyles.includes(style) && styles.styleButtonActive,
                    ]}
                    onPress={() => handleToggleStyle(style)}
                    >
                    <ThemedText style={[
                        styles.styleButtonText,
                        selectedStyles.includes(style) && styles.styleButtonTextActive
                    ]}>{style}</ThemedText>
                    </TouchableOpacity>
                ))}
                </ScrollView>
            </View>
            )}

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
  },
  styleFilterSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  styleFilterTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#D0D0D0',
    marginBottom: 10,
  },
  styleFilterContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  styleButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleButtonActive: {
    backgroundColor: '#007AFF',
  },
  styleButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  styleButtonTextActive: {
    color: '#fff',
  },
});
