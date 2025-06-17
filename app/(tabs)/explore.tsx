import { Image } from 'expo-image';
import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { Platform, StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { ArtistCard } from '@/components/ArtistCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as artistService from '@/services/artist.service';
import * as tattooService from '@/services/tattoo.service';
import * as messageService from '@/services/message.service'; // Added messageService
import { Artist } from '@/types/artist';
import { TattooDesign } from '@/types/tattooDesign';
import { AuthContext, AuthState } from '@/contexts/AuthContext'; // Added AuthContext and AuthState
import { Conversation } from '@/types/message'; // Added Conversation

export default function ExploreScreen() {
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [recentDesigns, setRecentDesigns] = useState<TattooDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [designsLoading, setDesignsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const auth = useContext(AuthContext) as AuthState; // Type assertion for auth context
  const user = auth?.user; // Get user from typed auth context

  useEffect(() => {
    Promise.all([
      fetchFeaturedArtists(),
      fetchRecentDesigns()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchFeaturedArtists = async () => {
    try {
      console.log("Fetching featured artists...");
      const artists = await artistService.getFeaturedArtists(6);
      console.log("Received featured artists:", artists);
      setFeaturedArtists(artists);
    } catch (error) {
      console.error('Error fetching featured artists:', error);
    }
  };

  const fetchRecentDesigns = async () => {
    setDesignsLoading(true);
    try {
      // Get the latest designs, sorted by creation date
      const response = await tattooService.getAllTattooDesigns({
        limit: 3,
        page: 1,
      });
      setRecentDesigns(response.designs);
    } catch (error) {
      console.error('Error fetching recent designs:', error);
    } finally {
      setDesignsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchPath = `/search?query=${encodeURIComponent(searchQuery.trim())}` as const;
      router.push(searchPath as any);
    }
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
        // Fallback to check existing conversations
        const existingConversations: Conversation[] = await messageService.getUserConversations();
        const existingConvo = existingConversations.find(c => c.otherUser.id === artistId);

        if (existingConvo) {
            router.push(`/chat/${existingConvo.id}` as any);
        } else {
            Alert.alert("Error", "Could not start or find conversation.");
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    }
  };

  const handleDesignPress = (design: TattooDesign) => {
    // Navigate to tattoos screen instead of non-existent artist detail page
    const tattoosPath = '/tattoos' as const;
    router.push(tattoosPath as any);
    
    // Alert with design information for now
    Alert.alert(
      design.title,
      `${design.description || 'No description'}\n\nStyle: ${design.style}\n${design.price ? `Price: $${design.price}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const renderArtistCard = ({ item }: { item: Artist }) => (
    <ArtistCard
      artist={item}
      onPress={handleArtistPress}
      showBookingButton={false} // Explicitly hide Book Appointment button
      showSendMessageButton={true} // Keep Send Message button visible
      onSendMessage={() => handleSendMessage(item.id)} // Use new handler
    />
  );

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
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artists, styles, or locations..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Popular Categories</ThemedText>
        <View style={styles.categoriesContainer}>
          <TouchableFix 
            style={styles.categoryButton}
            onPress={() => {
              const path = '/search?specialty=Traditional' as const;
              router.push(path as any);
            }}
          >
            <IconSymbol name="flame.fill" size={24} color="#FF6B6B" />
            <ThemedText style={styles.categoryText}>Traditional</ThemedText>
          </TouchableFix>
          
          <TouchableFix 
            style={styles.categoryButton}
            onPress={() => {
              const path = '/search?specialty=Minimalist' as const;
              router.push(path as any);
            }}
          >
            <IconSymbol name="sparkles" size={24} color="#4ECDC4" />
            <ThemedText style={styles.categoryText}>Minimalist</ThemedText>
          </TouchableFix>
          
          <TouchableFix 
            style={styles.categoryButton}
            onPress={() => {
              const path = '/search?specialty=Realism' as const;
              router.push(path as any);
            }}
          >
            <IconSymbol name="person.fill" size={24} color="#FFD166" />
            <ThemedText style={styles.categoryText}>Realism</ThemedText>
          </TouchableFix>
          
          <TouchableFix 
            style={styles.categoryButton}
            onPress={() => {
              const path = '/search?specialty=Watercolor' as const;
              router.push(path as any);
            }}
          >
            <IconSymbol name="drop.fill" size={24} color="#6A8EAE" />
            <ThemedText style={styles.categoryText}>Watercolor</ThemedText>
          </TouchableFix>
        </View>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Featured Artists</ThemedText>
          <TouchableFix onPress={() => {
            const path = '/artists' as const;
            router.push(path as any);
          }}>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </TouchableFix>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : featuredArtists.length > 0 ? (
          <View style={styles.artistListContainer}>
            {featuredArtists.map((item) => (
              <View key={item.id}>
                {renderArtistCard({ item })}
              </View>
            ))}
          </View>
        ) : (
          <ThemedView style={styles.emptyStateContainer}>
            <IconSymbol name="person.2.slash" size={40} color="#555555" />
            <ThemedText style={styles.emptyStateText}>No artists found</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>New Designs</ThemedText>
          <TouchableFix onPress={() => {
            const path = '/tattoos' as const;
            router.push(path as any);
          }}>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </TouchableFix>
        </View>
        
        {designsLoading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : recentDesigns.length > 0 ? (
          <View style={styles.designsContainer}>
            {recentDesigns.map((design) => (
              <TouchableFix
                key={design.id}
                style={styles.designCard}
                onPress={() => handleDesignPress(design)}
              >
                <Image 
                  source={{ 
                    uri: `${design.imageUrl.startsWith('http') ? '' : 'http://localhost:5000'}${design.imageUrl}` 
                  }} 
                  style={styles.designImage}
                  contentFit="cover"
                />
                <View style={styles.designOverlay}>
                  <ThemedText style={styles.designTitle}>{design.title}</ThemedText>
                </View>
              </TouchableFix>
            ))}
          </View>
        ) : (
          <ThemedView style={styles.emptyStateContainer}>
            <IconSymbol name="photo.stack" size={40} color="#555555" />
            <ThemedText style={styles.emptyStateText}>No designs found</ThemedText>
          </ThemedView>
        )}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryButton: {
    width: '48%',
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 20,
  },
  artistListContainer: {
    paddingVertical: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#777777',
  },
  designsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  designCard: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  designImage: {
    width: '100%',
    height: '100%',
  },
  designOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  designTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
