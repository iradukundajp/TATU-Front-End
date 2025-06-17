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
  onSendMessage?: (artistId: string) => void; // New prop
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onPress,
  style,
  showBookingButton = true, // Default to true
  showSendMessageButton = true, // Default to true
  onSendMessage, // Destructure new prop
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
        
        {/* Display Specialties */}
        {artist.specialties && artist.specialties.length > 0 && (
          <View style={styles.detailRow}>
            <IconSymbol name="sparkles" size={14} color={styles.detailIcon.color} style={styles.detailIcon} />
            <ThemedText style={styles.detailText}>Specialties: {artist.specialties.join(', ')}</ThemedText>
          </View>
        )}

        {/* Display Styles */}
        {artist.styles && artist.styles.length > 0 && (
          <View style={styles.detailRow}>
            <IconSymbol name="paintbrush.fill" size={14} color={styles.detailIcon.color} style={styles.detailIcon} />
            <ThemedText style={styles.detailText}>Styles: {artist.styles.join(', ')}</ThemedText>
          </View>
        )}

        {/* Display Experience */}
        {artist.experience !== null && artist.experience !== undefined && (
          <View style={styles.detailRow}>
            <IconSymbol name="briefcase.fill" size={14} color={styles.detailIcon.color} style={styles.detailIcon} />
            <ThemedText style={styles.detailText}>Experience: {artist.experience} year{artist.experience !== 1 ? 's' : ''}</ThemedText>
          </View>
        )}

        {/* Display Hourly Rate */}
        {artist.hourlyRate !== null && artist.hourlyRate !== undefined && (
          <View style={styles.detailRow}>
            <IconSymbol name="creditcard.fill" size={14} color={styles.detailIcon.color} style={styles.detailIcon} />
            <ThemedText style={styles.detailText}>Rate: ${artist.hourlyRate}/hr</ThemedText>
          </View>
        )}
        
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
                onPress={() => {
                  if (onSendMessage) {
                    onSendMessage(artist.id); // Use the new prop
                  } else {
                    console.log('Send Message to', artist.name); // Fallback if not provided
                  }
                }}
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
    backgroundColor: '#2C2C2C', // Darker card background
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
    shadowOpacity: 0.2, // Slightly more visible shadow on dark
    shadowRadius: 4,
    elevation: 4, // Slightly more elevation
  },
  artistImageContainer: {
    marginRight: 16,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#444444', // Placeholder while image loads
  },
  artistImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#444444', // Darker placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
    // Removed justifyContent: 'space-between' to allow natural flow
  },
  artistName: {
    fontSize: 20, // Slightly larger name
    fontWeight: 'bold',
    color: '#EFEFEF', // Lighter text for name
    marginBottom: 4,
  },
  artistLocation: {
    fontSize: 14,
    color: '#B0B0B0', // Lighter gray for location
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5, // Space between detail rows
  },
  detailIcon: {
    marginRight: 6,
    color: '#A0A0A0', // Icon color for details
  },
  detailText: {
    fontSize: 13,
    color: '#C0C0C0', // Text color for details
    flexShrink: 1, // Allow text to wrap if needed
  },
  artistSpecialties: { // This style is for the old tag display, can be removed if not used
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  specialtyTag: { // This style is for the old tag display, can be removed if not used
    backgroundColor: '#444444', // Darker tag
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: { // This style is for the old tag display, can be removed if not used
    fontSize: 12,
    color: '#E0E0E0',
  },
  artistRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Add some margin top if details are above
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
    color: '#EFEFEF', // Lighter text
    marginLeft: 6,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#B0B0B0', // Lighter gray
  },
  noReviewsText: {
    fontSize: 12,
    color: '#999999', // Adjusted for dark theme
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Changed to space-around for better spacing
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexGrow: 1, // Allow buttons to grow and share space
    flexBasis: 0, // Distribute space evenly
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A84FF', // Primary action color (dark theme accent)
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 0,
  },
  fullWidthButton: { 
    flexGrow: 1, 
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 8, // Increased margin
    fontSize: 13, // Slightly larger text
    fontWeight: '600',
  },
});