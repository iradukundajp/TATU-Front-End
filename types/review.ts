export interface Review {
  id: string;
  userId: string;
  artistId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface CreateReviewRequest {
  artistId: string;
  rating: number;
  comment: string;
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}

export interface ReviewStatsResponse {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
} 