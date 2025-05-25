import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ReviewForm } from '@/components/ReviewForm';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ReviewFormData } from '@/types/review';
import * as reviewService from '@/services/review.service';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  artistId,
  artistName,
  onReviewSubmitted,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (reviewData: ReviewFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await reviewService.createReview({
        artistId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });

      console.log('Review submitted successfully:', result);

      // Show success state briefly, then close modal
      setShowSuccess(true);
      
      setTimeout(() => {
        onClose();
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
        // Reset states after modal is closed
        setTimeout(() => {
          setShowSuccess(false);
          setIsSubmitting(false);
        }, 300);
      }, 1500); // Show success for 1.5 seconds

    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      let errorMessage = 'Failed to submit review. Please try again.';
      
      if (error?.status === 400) {
        errorMessage = error?.data?.message || 'Invalid review data. Please check your inputs.';
      } else if (error?.status === 401) {
        errorMessage = 'You need to be logged in to submit a review.';
      } else if (error?.status === 409) {
        errorMessage = 'You have already reviewed this artist.';
      }

      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
      setIsSubmitting(false);
    }
  };

  const handleDirectClose = () => {
    onClose();
  };

  const handleCancel = () => {
    if (isSubmitting && !showSuccess) {
      return;
    }

    if (showSuccess) {
      // Allow immediate close if showing success
      onClose();
      setTimeout(() => {
        setShowSuccess(false);
        setIsSubmitting(false);
      }, 300);
      return;
    }

    // Direct close without confirmation for better UX
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDirectClose}
    >
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              disabled={isSubmitting && !showSuccess}
            >
              <IconSymbol name="xmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <ThemedText style={styles.headerTitle}>
              {showSuccess ? 'Success' : 'Write Review'}
            </ThemedText>
            
            <View style={styles.headerSpacer} />
          </View>

          {/* Review Form */}
          {showSuccess ? (
            <View style={styles.successContainer}>
              <IconSymbol name="checkmark.circle.fill" size={64} color="#4CAF50" />
              <ThemedText style={styles.successTitle}>Review Submitted!</ThemedText>
              <ThemedText style={styles.successMessage}>
                Thank you for your feedback!
              </ThemedText>
            </View>
          ) : (
            <ReviewForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              artistName={artistName}
              onCancel={handleCancel}
            />
          )}
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 36,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#CCCCCC',
  },
}); 