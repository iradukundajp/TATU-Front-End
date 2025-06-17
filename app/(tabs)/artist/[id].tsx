// (tabs)/artist/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, /* Image, */ Modal, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native'; // Image from react-native commented out, Platform added
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { TouchableFix } from '@/components/TouchableFix';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as artistService from '@/services/artist.service';
import * as reviewService from '@/services/review.service';
import * as messageService from '@/services/message.service';
import { Artist } from '@/types/artist';
import { PortfolioItem, ArtistPortfolioAPIResponse } from '@/types/portfolio';
import { ReviewStatsResponse } from '@/types/review';
import { StarRating } from '@/components/StarRating';
import { ArtistReviewsSection } from '@/components/ArtistReviewsSection';
import BookingForm, { BookingFormProps } from '@/components/BookingForm';
import AvatarDisplayComponent from '@/components/AvatarDisplayComponent'; // Ensure AvatarDisplayComponent is imported
import { Image as ExpoImage } from 'expo-image'; // Added import for ExpoImage for portfolio items

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  // const [avatarLoadError, setAvatarLoadError] = useState(false); // Removed as it's for the old simple image avatar

  const loadArtistData = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      Alert.alert('Error', 'Invalid artist ID');
      if (router.canGoBack()) router.back(); else router.replace('/(tabs)/explore');
      return;
    }
    
    console.log(`ArtistDetailScreen: Focusing/Loading artist data for ID: ${id}`);
    setLoading(true);
    // setAvatarLoadError(false); // Removed

    try {
      const artistData = await artistService.getArtistById(id);
      setArtist(artistData);
      console.log('Artist data loaded:', artistData?.name);
      // Log the avatarConfiguration to check if it's coming from the backend
      console.log('ArtistDetailScreen: Received artist.avatarConfiguration:', JSON.stringify(artistData?.avatarConfiguration, null, 2));
      
      const rawPortfolioData: ArtistPortfolioAPIResponse = await artistService.getArtistPortfolio(id);
      console.log(`ArtistDetailScreen: Raw portfolioData for artist ID ${id}:`, JSON.stringify(rawPortfolioData, null, 2));
      
      if (rawPortfolioData && rawPortfolioData.images && Array.isArray(rawPortfolioData.images)) {
        const adaptedPortfolioItems: PortfolioItem[] = rawPortfolioData.images.map(image => ({
          id: image.id,
          artistId: rawPortfolioData.artistId, 
          imageUrl: image.url, 
          caption: image.caption,
        }));
        setPortfolio(adaptedPortfolioItems);
        console.log(`Adapted and loaded ${adaptedPortfolioItems.length} portfolio items.`);
      } else {
        setPortfolio([]);
        console.log('No images found in portfolio data or portfolio data structure is not as expected.');
      }
      
      // Fetch review stats
      loadReviewStats(id); // This function also sets its own loading states
    } catch (error) {
      console.error('Error loading artist data:', error);
      Alert.alert('Error', 'Failed to load artist information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      console.log('ArtistDetailScreen: Screen focused, triggering data load for ID:', id);
      loadArtistData();
      
      // Optional: If you want to check if the current artist is the logged-in user
      // and potentially use data directly from AuthContext for some fields,
      // you could add logic here. For now, always re-fetching.
      if (user && id === user.id) {
        console.log("Viewing own profile, data will be refreshed from server.");
      }

    }, [loadArtistData, id, user])
  );
  
  const loadReviewStats = async (artistId: string) => {
    try {
      setReviewsLoading(true);
      const stats = await reviewService.getArtistReviewStats(artistId);
      setReviewStats(stats);
      console.log('Review stats loaded:', stats);
    } catch (error) {
      console.error('Error loading review stats:', error);
      setReviewStats(null);
    } finally {
      setReviewsLoading(false);
    }
  };
  
  const handleBookPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required', 
        'Please log in to book an appointment',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Go to Login',
            onPress: () => router.push('/login')
          }
        ]
      );
      return;
    }
    
    if (!artist) {
      return;
    }
    
    // Check if user is trying to book themselves
    if (user && user.id === artist.id) {
      Alert.alert('Error', 'You cannot book yourself');
      return;
    }
    
    setShowBookingForm(true);
  };
  
  const handleMessagePress = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required', 
        'Please log in to send a message',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Go to Login',
            onPress: () => router.push('/login')
          }
        ]
      );
      return;
    }
    
    if (!artist) {
      return;
    }
    
    // Check if user is trying to message themselves
    if (user && user.id === artist.id) {
      Alert.alert('Error', 'You cannot message yourself');
      return;
    }

    try {
      // Start conversation with the artist
      const conversation = await messageService.startConversation(artist.id);
      
      // Try to navigate to the chat screen
      try {
        const chatPath = `/chat/${conversation.id}?otherUserId=${artist.id}&otherUserName=${encodeURIComponent(artist.name)}`;
        router.push(chatPath as any);
      } catch (navigationError) {
        // Fallback: navigate to messages tab where they can see the conversation
        console.log('Chat screen navigation failed, going to messages tab');
        router.push('/(tabs)/messages');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };
  
  const formatSpecialties = (specialties: string[]) => {
    return specialties.join(', ');
  };
  
  const formatRating = (rating?: number) => {
    if (!rating) return 'No ratings yet';
    return `${rating.toFixed(1)} ★`;
  };
  
  // Custom styled badge component
  const Badge = ({ text }: { text: string }) => (
    <View style={styles.badge}>
      <ThemedText style={styles.badgeText}>{text}</ThemedText>
    </View>
  );
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }
  
  if (!artist) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Artist not found</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableFix style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableFix>
        </View>
      
        {/* Artist Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            {/* Updated Avatar Display Logic */}
            {artist.avatarConfiguration ? (
              <AvatarDisplayComponent
                avatarConfiguration={artist.avatarConfiguration}
                isEditing={false}
                containerWidth={styles.avatar.width} 
                containerHeight={styles.avatar.height}
              />
            ) : artist.avatarUrl ? ( 
                // Fallback for old avatarUrl - consider if this is needed or just show "No Avatar"
                // For now, showing a distinct placeholder for legacy avatars.
                <View style={styles.avatarPlaceholder}>
                    <IconSymbol name="person.circle.fill" size={styles.avatar.width * 0.8} color="#888888" />
                    <ThemedText style={{fontSize: 10, color: '#888888', textAlign: 'center'}}>Legacy Avatar</ThemedText>
                </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol name="person.fill" size={styles.avatar.width * 0.8} color="#555555" />
                <ThemedText style={{fontSize: 10, color: '#555555', textAlign: 'center'}}>No Avatar</ThemedText>
              </View>
            )}
            
            <View style={styles.profileInfo}>
              <ThemedText type="title" style={styles.nameText}>{artist.name}</ThemedText>
              <View style={styles.locationContainer}>
                <IconSymbol name="mappin" size={14} color="#AAAAAA" />
                <ThemedText style={styles.locationText}>{artist.location || 'Location not specified'}</ThemedText>
              </View>
              
              <View style={styles.ratingContainer}>
                {reviewsLoading ? (
                  <View style={styles.ratingPlaceholder}><ThemedText style={styles.loadingText}>Loading ratings...</ThemedText></View>
                ) : reviewStats && reviewStats.totalReviews > 0 ? (
                  <>
                    <StarRating 
                      rating={Math.round(reviewStats.averageRating)} 
                      size={14} 
                      starColor="#FFD700"
                      emptyStarColor="#555555"
                    />
                    <ThemedText style={styles.ratingText}>
                      {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews})
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText style={styles.noRatingText}>No ratings yet</ThemedText>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <ThemedText style={styles.sectionTitle}>About</ThemedText>
            <ThemedText style={styles.bioText}>{artist.bio || 'No bio provided.'}</ThemedText>
            
            <ThemedText style={styles.sectionTitle}>Specialties</ThemedText>
            <View style={styles.badgeContainer}>
              {artist.specialties && artist.specialties.length > 0 ? 
                artist.specialties.map((specialty, index) => <Badge key={index} text={specialty} />) :
                <ThemedText style={styles.emptyText}>No specialties listed</ThemedText>}
            </View>
            
            <ThemedText style={styles.sectionTitle}>Styles</ThemedText>
            <View style={styles.badgeContainer}>
              {artist.styles && artist.styles.length > 0 ?
                artist.styles.map((style, index) => <Badge key={index} text={style} />) :
                <ThemedText style={styles.emptyText}>No styles listed</ThemedText>}
            </View>
            
            <View style={styles.rowInfo}>
              <View style={styles.infoItem}>
                <IconSymbol name="clock" size={16} color="#AAAAAA" />
                <ThemedText style={styles.infoText}>{artist.experience || 0} years experience</ThemedText>
              </View>
              <View style={styles.infoItem}>
                <IconSymbol name="dollarsign.circle" size={16} color="#AAAAAA" />
                <ThemedText style={styles.infoText}>${artist.hourlyRate || 0}/hour</ThemedText>
              </View>
            </View>
          </View>
        </View>
        
        {/* Portfolio Section */}
        <View style={styles.portfolioSection}>
          <ThemedText style={styles.sectionTitle}>Portfolio</ThemedText>
          
          {portfolio.length > 0 ? (
            <View style={styles.portfolioGrid}>
              {portfolio.map((item) => {
                const finalImageUrl = item.imageUrl.startsWith('http') 
                  ? item.imageUrl 
                  : `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}${item.imageUrl}`;
                return (
                  <TouchableFix key={item.id} style={styles.portfolioItem}>
                    <ExpoImage // Assuming ExpoImage is the intended component here
                      source={{ uri: finalImageUrl }} 
                      style={styles.portfolioImage} 
                      contentFit="cover" // Changed from resizeMode
                      onError={(e) => console.error(`Failed to load portfolio image ${finalImageUrl}:`, e.error)} // Corrected expo-image error logging
                    />
                    {/* Display the caption */}
                    {item.caption && (
                      <View style={styles.captionOverlay}>
                        <ThemedText style={styles.captionText} numberOfLines={2}>{item.caption}</ThemedText>
                      </View>
                    )}
                  </TouchableFix>
                );
              })}
            </View>
          ) : (
            <ThemedText style={styles.emptyPortfolioText}>No portfolio items yet</ThemedText>
          )}
        </View>
        
        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          {artist && (
            <ArtistReviewsSection 
              artistId={artist.id}
              artistName={artist.name}
              canLeaveReview={true} // This should probably be dynamic based on user relationship
              maxPreviewReviews={10}
            />
          )}
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableFix 
            style={styles.bookButton}
            onPress={handleBookPress}
          >
            <IconSymbol name="calendar.badge.plus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.bookButtonText}>Book Appointment</ThemedText>
          </TouchableFix>

          <TouchableFix 
            style={styles.messageButton}
            onPress={handleMessagePress}
          >
            <IconSymbol name="message" size={20} color="#007AFF" />
            <ThemedText style={styles.messageButtonText}>Send Message</ThemedText>
          </TouchableFix>
        </View>
      </ScrollView>
      
      {/* Booking Form Modal */}
      <Modal
        visible={showBookingForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowBookingForm(false)}
            >
              <IconSymbol name="xmark.circle.fill" size={24} color="#AAAAAA" />
            </TouchableOpacity>
            
            {artist && ( // Ensure artist is not null before rendering BookingForm
              <BookingForm
                artistId={artist.id}
                onSuccess={() => {
                  setShowBookingForm(false);
                  // Navigate to bookings page
                  router.push('/(tabs)/bookings');
                }}
                onCancel={() => setShowBookingForm(false)}
              />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, paddingTop: Platform.OS === 'android' ? 40 : 20 }, // Added paddingTop for status bar
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  profileSection: { paddingTop: 80 }, // Added paddingTop to account for absolute positioned header
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#333' }, // Added backgroundColor for placeholder
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center' },
  profileInfo: { marginLeft: 16, flex: 1 },
  nameText: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locationText: { fontSize: 14, color: '#AAAAAA', marginLeft: 4 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingPlaceholder: { /* Style for loading text if needed */ },
  loadingText: { color: '#AAAAAA', fontSize: 12 },
  ratingText: { fontSize: 14, color: '#AAAAAA', marginLeft: 4 },
  noRatingText: { fontSize: 14, color: '#AAAAAA', fontStyle: 'italic' },
  infoSection: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 20 }, // Darker background, more padding
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#EFEFF0' }, // Slightly bolder, lighter color
  bioText: { fontSize: 14, lineHeight: 21, marginBottom: 16, color: '#C7C7CC' }, // Lighter color
  emptyText: { fontSize: 14, color: '#8E8E93', fontStyle: 'italic', marginBottom: 8 }, // Adjusted color
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  badge: { backgroundColor: '#3A3A3C', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 }, // Darker badge
  badgeText: { fontSize: 12, color: '#EFEFF0' }, // Lighter text
  rowInfo: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }, // Space around for better distribution
  infoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 8, borderRadius: 8, flex: 1, marginHorizontal: 4 }, // Individual background, flex
  infoText: { fontSize: 14, marginLeft: 6, color: '#C7C7CC' }, // Lighter text
  portfolioSection: { paddingHorizontal: 16, marginBottom: 20 },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }, // Negative margin to counteract item margin
  portfolioItem: { width: '48%', aspectRatio: 1, margin: '1%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#333', position: 'relative' },
  portfolioImage: { width: '100%', height: '100%' },
  captionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 5, paddingHorizontal: 8 },
  captionText: { color: '#FFFFFF', fontSize: 11, textAlign: 'center' },
  emptyPortfolioText: { fontStyle: 'italic', color: '#8E8E93', marginTop: 8, textAlign: 'center', padding: 16 }, // Centered, more padding
  reviewsSection: { marginHorizontal: 16, marginBottom: 20 },
  actionButtonsContainer: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8, gap: 12 },
  bookButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A84FF', paddingVertical: 14, borderRadius: 12, minHeight: 50, elevation: 2, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  bookButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  messageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#0A84FF', paddingVertical: 14, borderRadius: 12, minHeight: 50 },
  messageButtonText: { color: '#0A84FF', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { 
    backgroundColor: '#1C1C1E', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 0, // Changed from padding: 20, BookingForm now handles its internal padding
    height: '85%', // Changed from maxHeight: '85%'
    width: '100%', // Ensure full width
  },
  closeButton: { alignSelf: 'flex-end', padding: 8, /* marginBottom: 10, */ position: 'absolute', top: 10, right: 10, zIndex: 1 }, // Removed marginBottom as padding is now in BookingForm
  // Added for ExpoImage in portfolio
  ExpoImage: { width: '100%', height: '100%' },
});