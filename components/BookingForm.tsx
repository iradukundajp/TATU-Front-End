// components/BookingForm.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Alert, ActivityIndicator, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { TouchableFix } from './TouchableFix';
import { IconSymbol } from './ui/IconSymbol';
import * as artistService from '@/services/artist.service';
import * as bookingService from '@/services/booking.service';
import { Artist } from '@/types/artist';

// Explicitly define the component props interface
export interface BookingFormProps {
  artistId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BookingForm({ artistId, onSuccess, onCancel }: BookingFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Array<{ startHour: number; endHour: number }>>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [duration, setDuration] = useState('60'); // Default 60 minutes
  const [note, setNote] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // Generate array of dates for the next 30 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const dateOptions = generateDates();

  // Load artist data and available slots
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setApiError(null);
        
        console.log(`Loading artist data for ID: ${artistId}`);
        const artistData = await artistService.getArtistById(artistId);
        
        if (!artistData) {
          setApiError("Failed to load artist information");
          return;
        }
        
        setArtist(artistData);
        console.log("Artist data loaded:", artistData.name);
        
        await loadAvailableSlots(selectedDate);
      } catch (error) {
        console.error('Error loading artist data:', error);
        setApiError("Failed to connect to the server. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [artistId]);

  // Load available time slots for selected date
  const loadAvailableSlots = async (date: Date) => {
    try {
      // Format date to YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      console.log(`Loading available slots for artist ${artistId} on date ${formattedDate}`);
      const slots = await artistService.getAvailableTimeSlots(artistId, formattedDate);
      
      console.log('Loaded available slots:', slots);
      setAvailableSlots(slots);
      
      // If no slots are returned, use default business hours for the demo
      if (!slots || slots.length === 0) {
        setAvailableSlots([{startHour: 9, endHour: 18}]);
        console.log("No slots returned from API, using default business hours");
      }
      
      setSelectedTimeSlot(null); // Reset selected time when date changes
    } catch (error) {
      console.error('Error loading available slots:', error);
      setApiError("Failed to load available time slots. Please try a different date.");
      setAvailableSlots([]);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle date selection from modal
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDateModal(false);
    loadAvailableSlots(date);
  };

  // Generate time slot display text
  const getTimeDisplay = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  // Validate form before submission
  const validateForm = () => {
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return false;
    }

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return false;
    }

    return true;
  };

  // Handle booking submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setApiError(null);
      
      const bookingDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        selectedTimeSlot!,
        0, 0
      );
      
      const bookingData = {
        artistId,
        date: bookingDate.toISOString(),
        duration: parseInt(duration),
        note: note.trim()
      };
      
      console.log('Creating booking with data:', bookingData);
      
      // Use the createBooking method from booking service
      const booking = await bookingService.createBooking(bookingData);
      
      console.log('Booking created successfully:', booking);
      Alert.alert('Success', 'Your booking request has been sent');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setApiError("Failed to create booking. Please check your connection and try again.");
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show error message if API error occurs
  if (apiError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FFA500" />
          <ThemedText style={styles.errorTitle}>Connection Error</ThemedText>
          <ThemedText style={styles.errorText}>{apiError}</ThemedText>
          <TouchableFix
            style={styles.retryButton}
            onPress={() => {
              setApiError(null);
              // It's better to call loadData here to re-fetch artist info as well
              // if the initial load failed, not just slots.
              // For now, keeping as loadAvailableSlots if that was the primary failure point.
              // Consider a more robust retry mechanism if needed.
              const loadData = async () => { // Renamed from original to avoid conflict
                try {
                  setLoading(true);
                  setApiError(null);
                  const artistData = await artistService.getArtistById(artistId);
                  if (!artistData) {
                    setApiError("Failed to load artist information");
                    setLoading(false);
                    return;
                  }
                  setArtist(artistData);
                  await loadAvailableSlots(selectedDate);
                } catch (error) {
                  console.error('Error reloading data:', error);
                  setApiError("Failed to connect to the server. Please check your connection and try again.");
                } finally {
                  setLoading(false);
                }
              };
              loadData();
            }}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableFix>
          
          <TouchableFix
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableFix>
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading artist information...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.formContainer}> 
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle" style={styles.title}>
          {`Book an Appointment with ${artist?.name || 'the artist'}`}
        </ThemedText>
        
        {/* Date Selection */}
        <View style={styles.fieldGroup}>
          <ThemedText>Select Date</ThemedText>
          <TouchableFix style={styles.dateSelector} onPress={() => setShowDateModal(true)}>
            <ThemedText>
              {formatDate(selectedDate)}
            </ThemedText>
            <IconSymbol name="calendar" size={20} color="#007AFF" />
          </TouchableFix>
          
          {/* Custom Date Selection Modal */}
          <Modal
            visible={showDateModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDateModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Select Date</ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowDateModal(false)}
                    style={styles.closeButton}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.dateList}>
                  {dateOptions.map((date, index) => (
                    <TouchableFix
                      key={index}
                      style={[
                        styles.dateOption,
                        date.toDateString() === selectedDate.toDateString() && styles.selectedDateOption
                      ]}
                      onPress={() => handleDateSelect(date)}
                    >
                      <ThemedText
                        style={[
                          styles.dateOptionText,
                          date.toDateString() === selectedDate.toDateString() && styles.selectedDateOptionText
                        ]}
                      >
                        {formatDate(date)}
                      </ThemedText>
                    </TouchableFix>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
        
        {/* Time Slot Selection */}
        <View style={styles.fieldGroup}>
          <ThemedText>Select Time</ThemedText>
          
          {availableSlots.length > 0 ? (
            <View style={styles.timeSlotContainer}>
              {availableSlots.map(slot => (
                Array.from(
                  { length: slot.endHour - slot.startHour },
                  (_, i) => slot.startHour + i
                ).map(hour => (
                  <TouchableFix
                    key={hour}
                    style={[
                      styles.timeSlot,
                      selectedTimeSlot === hour && styles.selectedTimeSlot
                    ]}
                    onPress={() => setSelectedTimeSlot(hour)}
                  >
                    <ThemedText
                      style={[
                        styles.timeSlotText,
                        selectedTimeSlot === hour && styles.selectedTimeSlotText
                      ]}
                    >
                      {getTimeDisplay(hour)}
                    </ThemedText>
                  </TouchableFix>
                ))
              ))}
            </View>
          ) : (
            <ThemedText style={styles.noSlotsText}>
              No available time slots for this date
            </ThemedText>
          )}
        </View>
        
        {/* Duration */}
        <View style={styles.fieldGroup}>
          <ThemedText>Duration (minutes)</ThemedText>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="Enter duration (e.g., 60)"
            placeholderTextColor="#777"
          />
        </View>
        
        {/* Note */}
        <View style={styles.fieldGroup}>
          <ThemedText>Note (optional)</ThemedText>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Add any details about your appointment"
            placeholderTextColor="#777"
            multiline
            numberOfLines={4}
          />
        </View>
        
        {/* Submit Button */}
        <TouchableFix 
          style={[styles.button, styles.submitButton]} 
          onPress={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Book Appointment</ThemedText>
          )}
        </TouchableFix>
        
        {/* Cancel Button */}
        {onCancel && (
          <TouchableFix style={[styles.button, styles.cancelButton]} onPress={onCancel} disabled={submitting}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableFix>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  formContainer: { // New style for the root view of the form
    flex: 1, // Allows ScrollView to expand
    backgroundColor: '#1C1C1E', // Match modal background from [id].tsx
  },
  scrollView: {
    flex: 1, // Ensures ScrollView takes available space within formContainer
  },
  scrollViewContent: {
    padding: 20, // Replicates the padding from modalContent in [id].tsx
    paddingBottom: 40, // Extra padding at the bottom for scroll comfort
  },
  container: { // Original container style, might be used by loading/error states
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1C1C1E', // Match modal background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24, // Increased margin
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 20, // Increased margin
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 8,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EFEFF0',
  },
  closeButton: { // For the date picker modal's close button
     padding: 5,
  },
  dateList: {
    padding: 16,
  },
  dateOption: {
    padding: 12,
    paddingVertical: 15, // Increased padding
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#1f1f1f',
  },
  selectedDateOption: {
    backgroundColor: '#007AFF',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#EFEFF0',
  },
  selectedDateOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Better distribution
  },
  noSlotsText: { // Added definition for noSlotsText
    textAlign: 'center',
    color: '#AAAAAA',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  timeSlot: {
    padding: 10,
    paddingVertical: 12, // Increased padding
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#555555', // Clearer border
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '30%', // Ensure at least 3 slots per row
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    color: '#EFEFF0',
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#2C2C2E', // Darker input background
    color: '#EFEFF0', // Lighter text
    paddingHorizontal: 15, // Increased padding
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444', // Subtle border
    fontSize: 16,
  },
  button: {
    paddingVertical: 15, // Increased padding
    borderRadius: 10, // More rounded
    alignItems: 'center',
    marginTop: 10, // Spacing between buttons
  },
  submitButton: {
    backgroundColor: '#0A84FF', // Consistent with [id].tsx
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: { 
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0A84FF', // Consistent with [id].tsx message button
  },
  cancelButtonText: { 
    color: '#0A84FF', // Consistent with [id].tsx message button
    fontWeight: '600',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Gold/Yellow for error emphasis
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});