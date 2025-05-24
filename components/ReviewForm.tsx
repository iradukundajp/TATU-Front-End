import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { StarRating } from '@/components/StarRating';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ReviewFormData } from '@/types/review';

interface ReviewFormProps {
  onSubmit: (reviewData: ReviewFormData) => Promise<void>;
  isSubmitting?: boolean;
  artistName?: string;
  initialData?: Partial<ReviewFormData>;
  submitButtonText?: string;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  isSubmitting = false,
  artistName,
  initialData,
  submitButtonText = 'Submit Review',
  onCancel,
}) => {
  const [rating, setRating] = useState<number>(initialData?.rating || 0);
  const [comment, setComment] = useState<string>(initialData?.comment || '');
  const [errors, setErrors] = useState<{rating?: string; comment?: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {rating?: string; comment?: string} = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters long';
    }

    if (comment.trim().length > 500) {
      newErrors.comment = 'Comment must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        'Failed to submit review. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: undefined }));
    }
  };

  const handleCommentChange = (text: string) => {
    setComment(text);
    if (errors.comment && text.trim().length >= 10) {
      setErrors(prev => ({ ...prev, comment: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.formContainer}>
          {artistName && (
            <View style={styles.header}>
              <IconSymbol name="star.fill" size={24} color="#FFD700" />
              <ThemedText style={styles.headerText}>
                Review {artistName}
              </ThemedText>
            </View>
          )}

          {/* Rating Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Rating *</ThemedText>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={rating}
                interactive={true}
                onRatingChange={handleRatingChange}
                size={32}
              />
              <ThemedText style={styles.ratingText}>
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Tap to rate'}
              </ThemedText>
            </View>
            {errors.rating && (
              <ThemedText style={styles.errorText}>{errors.rating}</ThemedText>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Comment *</ThemedText>
            <TextInput
              style={[
                styles.commentInput,
                errors.comment && styles.inputError,
              ]}
              multiline
              numberOfLines={6}
              placeholder="Share your experience with this artist..."
              value={comment}
              onChangeText={handleCommentChange}
              maxLength={500}
              editable={!isSubmitting}
              textAlignVertical="top"
            />
            <View style={styles.commentFooter}>
              <ThemedText style={styles.characterCount}>
                {comment.length}/500 characters
              </ThemedText>
              {errors.comment && (
                <ThemedText style={styles.errorText}>{errors.comment}</ThemedText>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableFix
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableFix>
            )}

            <TouchableFix
              style={[
                styles.button,
                styles.submitButton,
                (isSubmitting || rating === 0) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>Submitting...</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.submitButtonText}>{submitButtonText}</ThemedText>
              )}
            </TouchableFix>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ratingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#CCCCCC',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#F44336',
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#555555',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 