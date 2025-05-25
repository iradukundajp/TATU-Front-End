import { api } from './api.service';
import { Review, CreateReviewRequest, ReviewStatsResponse } from '@/types/review';

/**
 * Review service for handling review-related API calls
 */

/**
 * Create a new review
 * @param reviewData - The review data to create
 * @returns Promise<Review> - The created review
 */
export async function createReview(reviewData: CreateReviewRequest): Promise<Review> {
  try {
    console.log('Creating review:', reviewData);
    
    const response = await api.post<Review>('/api/reviews', reviewData);
    console.log('Review created successfully:', response);
    
    return response;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Get reviews for a specific artist
 * @param artistId - The artist ID to get reviews for
 * @returns Promise<Review[]> - Array of reviews
 */
export async function getArtistReviews(artistId: string): Promise<Review[]> {
  try {
    console.log(`Fetching reviews for artist: ${artistId}`);
    
    const response = await api.get<{
      reviews: Review[];
      averageRating: number;
      totalReviews: number;
    }>(`/api/reviews/artist/${artistId}`);
    
    console.log('Artist reviews fetched:', response);
    
    // Return just the reviews array
    return response.reviews;
  } catch (error) {
    console.error('Error fetching artist reviews:', error);
    throw error;
  }
}

/**
 * Get reviews by the current user
 * @returns Promise<Review[]> - Array of user's reviews
 */
export async function getMyReviews(): Promise<Review[]> {
  try {
    console.log('Fetching user reviews');
    
    const response = await api.get<Review[]>('/api/reviews/my-reviews');
    console.log('User reviews fetched:', response);
    
    return response;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
}

/**
 * Get review statistics for an artist
 * @param artistId - The artist ID to get stats for
 * @returns Promise<ReviewStatsResponse> - Review statistics
 */
export async function getArtistReviewStats(artistId: string): Promise<ReviewStatsResponse> {
  try {
    console.log(`Fetching review stats for artist: ${artistId}`);
    
    // Use the existing artist reviews endpoint which includes stats
    const response = await api.get<{
      reviews: Review[];
      averageRating: number;
      totalReviews: number;
    }>(`/api/reviews/artist/${artistId}`);
    
    console.log('Artist review stats fetched:', response);
    
    // Calculate rating distribution from reviews
    const ratingDistribution: { [key: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    response.reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });
    
    const stats: ReviewStatsResponse = {
      averageRating: response.averageRating,
      totalReviews: response.totalReviews,
      ratingDistribution
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching artist review stats:', error);
    throw error;
  }
}

/**
 * Update an existing review
 * @param reviewId - The review ID to update
 * @param reviewData - The updated review data
 * @returns Promise<Review> - The updated review
 */
export async function updateReview(reviewId: string, reviewData: Partial<CreateReviewRequest>): Promise<Review> {
  try {
    console.log(`Updating review ${reviewId}:`, reviewData);
    
    const response = await api.put<Review>(`/api/reviews/${reviewId}`, reviewData);
    console.log('Review updated successfully:', response);
    
    return response;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

/**
 * Delete a review
 * @param reviewId - The review ID to delete
 * @returns Promise<void>
 */
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    console.log(`Deleting review: ${reviewId}`);
    
    await api.delete(`/api/reviews/${reviewId}`);
    console.log('Review deleted successfully');
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
} 