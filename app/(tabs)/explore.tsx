import { Image } from 'expo-image';
import React, { useState, useEffect, useContext } from 'react';
import { Platform, StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, ImageBackground } from 'react-native';
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
import * as messageService from '@/services/message.service';
import { Artist } from '@/types/artist';
import { TattooDesign } from '@/types/tattooDesign';
import { AuthContext, AuthState } from '@/contexts/AuthContext';
import { Conversation } from '@/types/message';

export default function ExploreScreen() {
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [recentDesigns, setRecentDesigns] = useState<TattooDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [designsLoading, setDesignsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const auth = useContext(AuthContext) as AuthState;
  const user = auth?.user;

  const HeaderImage = () => (
    <View style={styles.headerContainer}>
      <View style={styles.backgroundContainer}>
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1920&h=1080&fit=crop&crop=center' }} 
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.gradientOverlay} />
        </ImageBackground>
      </View>
      
      {/* Modern Title Design */}
      <View style={styles.titleContainer}>
        <View style={styles.titleWrapper}>
          <ThemedText style={styles.mainTitle}>TATU</ThemedText>
          <View style={styles.titleUnderline} />
        </View>
        <ThemedText style={styles.subtitle}>
          Find, Preview & Book the Best Tattoo Artists
        </ThemedText>
        
        {/* Decorative elements */}
        <View style={styles.decorativeElements}>
          <View style={styles.decorativeDot} />
          <View style={styles.decorativeLine} />
          <View style={styles.decorativeDot} />
        </View>
      </View>
    </View>
  );

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
    const tattoosPath = '/tattoos' as const;
    router.push(tattoosPath as any);
    
    Alert.alert(
      design.title,
      `${design.description || 'No description'}\n\nStyle: ${design.style}\n${design.price ? `Price: $${design.price}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const renderArtistCard = ({ item }: { item: Artist }) => {
    console.log(`ExploreScreen: Rendering ArtistCard for ${item.name} (ID: ${item.id}). Avatar Config:`, item.avatarConfiguration ? 'Present' : 'Absent', 'Full artist object:', item);
    return (
      <ArtistCard
        artist={item}
        onPress={handleArtistPress}
        showBookingButton={false}
        showSendMessageButton={true}
        onSendMessage={() => handleSendMessage(item.id)}
      />
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#000000', dark: '#000000' }}
      headerImage={<HeaderImage />}
    >
      
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
      
      <View style={styles.sectionContainer}>
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
      </View>

      <View style={styles.sectionContainer}>
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
          <View style={styles.emptyStateContainer}>
            <IconSymbol name="person.2.slash" size={40} color="#555555" />
            <ThemedText style={styles.emptyStateText}>No artists found</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.sectionContainer}>
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
                onPress={() => {
                  if (design.artist && design.artist.id) {
                    router.push(`/artist/${design.artist.id}`);
                  }
                }}
              >
                <Image 
                  source={{ 
                    uri: design.imageUrl.startsWith('http')
                      ? design.imageUrl
                      : `${process.env.EXPO_PUBLIC_API_BASE_URL}${design.imageUrl}`
                  }} 
                  style={styles.designImage}
                  contentFit="cover"
                />
                <View style={styles.designOverlay}>
                  <ThemedText style={styles.designTitle}>{design.title}</ThemedText>
                  {design.artist && design.artist.name && (
                    <ThemedText style={{ color: '#3b82f6', marginTop: 4, fontSize: 12 }}>
                      By {design.artist.name}
                    </ThemedText>
                  )}
                </View>
              </TouchableFix>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <IconSymbol name="photo.stack" size={40} color="#555555" />
            <ThemedText style={styles.emptyStateText}>No designs found</ThemedText>
          </View>
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
    textDecorationLine: 'none',
  },
  titleUnderline: {
    width: 120,
    height: 4,
    backgroundColor: '#FFD700',
    marginTop: 8,
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8, 
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    lineHeight: 24,
  },
  decorativeElements: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    marginHorizontal: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6, 
  },
  decorativeLine: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
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