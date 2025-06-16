import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { StarRating } from '@/components/StarRating';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Artist } from '@/types/artist';
import { ReviewStatsResponse } from '@/types/review';
import * as reviewService from '@/services/review.service';
import { useAuth } from '@/contexts/AuthContext';

interface ArtistCardProps {
  artist: Artist;
  onPress: (artistId: string) => void;
  style?: any;
  showBookingButton?: boolean; // New prop
  showSendMessageButton?: boolean; // New prop to control Send Message button
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onPress,
  style,
  showBookingButton = true, // Default to true
  showSendMessageButton = true, // Default to true
}) => {
  const [reviewStats, setReviewStats] = useState<ReviewStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const { user: loggedInUser } = useAuth(); // Get the logged-in user

  useEffect(() => {
    fetchReviewStats();
  }, [artist.id]);

  const fetchReviewStats = async () => {
    try {
      const stats = await reviewService.getArtistReviewStats(artist.id);
      setReviewStats(stats);
    } catch (error) {
      console.error('Error fetching review stats for artist:', artist.id, error);
      setReviewStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const displayRating = reviewStats?.averageRating || artist.rating || 0;
  const displayReviewCount = reviewStats?.totalReviews || artist.reviewCount || 0;

  // Updated logic for checking if the current user is the artist of this card
  let isViewingOwnCard = false;
  if (loggedInUser && typeof loggedInUser.id !== 'undefined' && loggedInUser.id !== null &&
      artist && typeof artist.id !== 'undefined' && artist.id !== null) {
    if (String(loggedInUser.id) === String(artist.id)) {
      isViewingOwnCard = true;
    }
  }
  // For debugging, you could add:
  // console.log(`ArtistCard Debug: artist.id=${artist?.id} (type: ${typeof artist?.id}), loggedInUser.id=${loggedInUser?.id} (type: ${typeof loggedInUser?.id}), isViewingOwnCard=${isViewingOwnCard}`);

  return (
    <TouchableOpacity 
      style={[styles.artistCard, style]}
      onPress={() => onPress(artist.id)}
      activeOpacity={0.7}
    >
      <View style={styles.artistImageContainer}>
        {artist.avatarUrl ? (
          <Image 
            source={{ uri: artist.avatarUrl }} 
            style={styles.artistImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.artistImagePlaceholder}>
            <IconSymbol name="person.fill" size={40} color="#555555" />
          </View>
        )}
      </View>
      
      <View style={styles.artistInfo}>
        <ThemedText style={styles.artistName}>{artist.name}</ThemedText>
        <ThemedText style={styles.artistLocation}>{artist.location}</ThemedText>
        
        <View style={styles.artistSpecialties}>
          {artist.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <ThemedText style={styles.specialtyText}>{specialty}</ThemedText>
            </View>
          ))}
        </View>
        
        <View style={styles.artistRating}>
          {loadingStats ? (
            <View style={styles.ratingPlaceholder}>
              <ThemedText style={styles.loadingText}>Loading...</ThemedText>
            </View>
          ) : displayReviewCount > 0 ? (
            <>
              <StarRating 
                rating={Math.round(displayRating)} 
                size={14} 
                starColor="#FFD700"
                emptyStarColor="#555555"
              />
              <ThemedText style={styles.averageRating}>
                {displayRating.toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.reviewCount}>
                ({displayReviewCount})
              </ThemedText>
            </>
          ) : (
            <ThemedText style={styles.noReviewsText}>No reviews yet</ThemedText>
          )}
        </View>

        {!isViewingOwnCard && (showBookingButton || showSendMessageButton) && ( // Only show container if at least one button is visible
          <View style={styles.actionButtonsContainer}>
            {showBookingButton && ( // Conditionally render Book Appointment
              <TouchableOpacity style={styles.actionButton} onPress={() => console.log('Book Appointment with', artist.name)}>
                <IconSymbol name="calendar.badge.plus" size={16} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Book Appointment</ThemedText>
              </TouchableOpacity>
            )}
            {showSendMessageButton && ( // Conditionally render Send Message
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  !showBookingButton && styles.fullWidthButton // If booking button is hidden, let send message take full width
                ]} 
                onPress={() => console.log('Send Message to', artist.name)}
              >
                <IconSymbol name="message.fill" size={16} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Send Message</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  artistCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  artistImageContainer: {
    marginRight: 16,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  artistImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  artistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistLocation: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 8,
  },
  artistSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  specialtyTag: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  artistRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingPlaceholder: {
    height: 20,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#999999',
  },
  averageRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#BBBBBB',
  },
  noReviewsText: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 8, // Reduced from 10
    borderRadius: 8,
    minWidth: 0,
  },
  fullWidthButton: { 
    flex: 1, 
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 11, // Reduced from 12
    fontWeight: '600',
  },
});