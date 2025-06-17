// (tabs)/artist/[id].tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Image, Modal, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { TouchableFix } from '@/components/TouchableFix';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as artistService from '@/services/artist.service';
import * as reviewService from '@/services/review.service';
import * as messageService from '@/services/message.service';
import { Artist } from '@/types/artist';
import { PortfolioItem, ArtistPortfolioAPIResponse } from '@/types/portfolio'; // Added ArtistPortfolioAPIResponse
import { ReviewStatsResponse } from '@/types/review';
import { StarRating } from '@/components/StarRating';
import { ArtistReviewsSection } from '@/components/ArtistReviewsSection';
// Import the BookingForm with its props interface
import BookingForm, { BookingFormProps } from '@/components/BookingForm';

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
  
  useEffect(() => {
    console.log('ArtistDetailScreen: EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
    const loadArtistData = async () => {
      try {
        setLoading(true);
        
        if (!id || typeof id !== 'string') {
          Alert.alert('Error', 'Invalid artist ID');
          router.back();
          return;
        }
        
        console.log(`Loading artist data for ID: ${id}`);
        
        // Fetch artist details
        const artistData = await artistService.getArtistById(id);
        setArtist(artistData);
        console.log('Artist data loaded:', artistData.name);
        
        // Fetch artist portfolio
        const rawPortfolioData: ArtistPortfolioAPIResponse = await artistService.getArtistPortfolio(id);
        console.log(`ArtistDetailScreen: Raw portfolioData for artist ID ${id}:`, JSON.stringify(rawPortfolioData, null, 2));
        
        if (rawPortfolioData && rawPortfolioData.images && Array.isArray(rawPortfolioData.images)) {
          const adaptedPortfolioItems: PortfolioItem[] = rawPortfolioData.images.map(image => ({
            id: image.id,
            artistId: rawPortfolioData.artistId, 
            imageUrl: image.url, 
            caption: image.caption, // Ensure caption is mapped
          }));
          setPortfolio(adaptedPortfolioItems);
          console.log(`Adapted and loaded ${adaptedPortfolioItems.length} portfolio items. First item:`, JSON.stringify(adaptedPortfolioItems[0], null, 2));
        } else {
          setPortfolio([]);
          console.log('No images found in portfolio data or portfolio data structure is not as expected.');
        }
        
        // Fetch review stats
        loadReviewStats(id);
      } catch (error) {
        console.error('Error loading artist data:', error);
        Alert.alert('Error', 'Failed to load artist information');
      } finally {
        setLoading(false);
      }
    };
    
    loadArtistData();
  }, [id]);
  
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
            {artist.avatarUrl ? (
              <Image 
                source={{ uri: artist.avatarUrl }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol name="person.fill" size={40} color="#555555" />
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
                  <View style={styles.ratingPlaceholder}>
                    <ThemedText style={styles.loadingText}>Loading ratings...</ThemedText>
                  </View>
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
            <ThemedText style={styles.bioText}>{artist.bio}</ThemedText>
            
            <ThemedText style={styles.sectionTitle}>Specialties</ThemedText>
            <View style={styles.badgeContainer}>
              {artist.specialties && artist.specialties.length > 0 ? (
                artist.specialties.map((specialty, index) => (
                  <Badge key={index} text={specialty} />
                ))
              ) : (
                <ThemedText style={styles.emptyText}>No specialties listed</ThemedText>
              )}
            </View>
            
            <ThemedText style={styles.sectionTitle}>Styles</ThemedText>
            <View style={styles.badgeContainer}>
              {artist.styles && artist.styles.length > 0 ? (
                artist.styles.map((style, index) => (
                  <Badge key={index} text={style} />
                ))
              ) : (
                <ThemedText style={styles.emptyText}>No styles listed</ThemedText>
              )}
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
              {portfolio.map((item, index) => {
                console.log(`ArtistDetailScreen: Processing adapted portfolio item ${index}:`, JSON.stringify(item, null, 2));
                
                const finalImageUrl = item.imageUrl.startsWith('http') 
                  ? item.imageUrl 
                  : `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}${item.imageUrl}`;
                
                console.log(`ArtistDetailScreen: Attempting to load portfolio image ${index}: ${finalImageUrl}`);

                return (
                  <TouchableFix key={item.id} style={styles.portfolioItem}>
                    <Image 
                      source={{ uri: finalImageUrl }} 
                      style={styles.portfolioImage} 
                      resizeMode="cover"
                      onError={(e) => {
                        console.error(`Failed to load portfolio image ${finalImageUrl}:`, e.nativeEvent.error);
                      }}
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
              canLeaveReview={true}
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
            
            <BookingForm
              artistId={artist.id}
              onSuccess={() => {
                setShowBookingForm(false);
                // Navigate to bookings page
                router.push('/(tabs)/bookings');
              }}
              onCancel={() => setShowBookingForm(false)}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  infoSection: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 6,
  },
  portfolioSection: {
    padding: 16,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  portfolioItem: {
    width: '48%', // Adjust for 2 columns with some spacing
    aspectRatio: 1, // Square items
    margin: '1%', // Spacing between items
    borderRadius: 8,
    overflow: 'hidden', // Important for borderRadius on Image to work with overlay
    backgroundColor: '#333', // Placeholder while image loads
    position: 'relative', // Needed for absolute positioning of caption overlay
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyPortfolioText: {
    fontStyle: 'italic',
    color: '#999999',
    marginTop: 8,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 12,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    minHeight: 54,
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    minHeight: 54,
  },
  messageButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 8,
    marginHorizontal: 16,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  ratingPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  noRatingText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
  reviewsSection: {
    padding: 16,
  },
});