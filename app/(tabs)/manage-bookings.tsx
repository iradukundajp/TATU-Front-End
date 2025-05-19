import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import { Booking } from '@/types/booking';
import * as bookingService from '@/services/booking.service';

export default function ManageBookingsScreen() {
  const { isAuthenticated, isArtist } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check if user is an artist, if not redirect
    if (isAuthenticated && !isArtist) {
      Alert.alert('Access Denied', 'This section is only for artists');
      router.replace('/(tabs)/profile');
      return;
    }

    // Fetch bookings
    fetchBookings();
  }, [isAuthenticated, isArtist]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getArtistBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    try {
      let updatedBooking;
      
      switch (newStatus) {
        case 'confirmed':
          updatedBooking = await bookingService.confirmBooking(id);
          break;
        case 'completed':
          updatedBooking = await bookingService.completeBooking(id);
          break;
        case 'cancelled':
          updatedBooking = await bookingService.cancelBooking(id);
          break;
        default:
          throw new Error(`Invalid status: ${newStatus}`);
      }
      
      setBookings(current =>
        current.map(booking =>
          booking.id === id ? updatedBooking : booking
        )
      );
      
      Alert.alert('Success', `Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error(`Error updating booking to ${newStatus}:`, error);
      Alert.alert('Error', `Failed to update booking status to ${newStatus}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <ThemedText style={styles.clientName}>{item.clientName}</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText style={styles.statusText}>{item.status}</ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.dateText}>{formatDate(item.date)}</ThemedText>
      <ThemedText style={styles.durationText}>{item.duration} minutes</ThemedText>
      
      {item.note && (
        <ThemedText style={styles.noteText}>{item.note}</ThemedText>
      )}
      
      <View style={styles.actionsContainer}>
        {item.status === 'pending' && (
          <>
            <TouchableFix 
              style={[styles.actionButton, styles.confirmButton]} 
              onPress={() => handleStatusChange(item.id, 'confirmed')}
            >
              <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Confirm</ThemedText>
            </TouchableFix>
            
            <TouchableFix 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={() => handleStatusChange(item.id, 'cancelled')}
            >
              <IconSymbol name="xmark.circle.fill" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Cancel</ThemedText>
            </TouchableFix>
          </>
        )}
        
        {item.status === 'confirmed' && (
          <TouchableFix 
            style={[styles.actionButton, styles.completeButton]} 
            onPress={() => handleStatusChange(item.id, 'completed')}
          >
            <IconSymbol name="flag.checkered" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Mark Complete</ThemedText>
          </TouchableFix>
        )}
      </View>
    </View>
  );

  if (loading && bookings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Manage Bookings</ThemedText>
      
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyState}>
          <IconSymbol name="calendar.badge.clock" size={60} color="#555555" />
          <ThemedText style={styles.emptyStateText}>No bookings yet</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>When clients book with you, they will appear here</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyStateText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: 'bold',
    color: '#555555',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#555555',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#BBBBBB',
  },
  noteText: {
    fontSize: 14,
    marginBottom: 12,
    color: '#AAAAAA',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
}); 