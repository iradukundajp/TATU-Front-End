import { User } from './auth';
import { AvatarConfiguration } from './avatar'; // Import AvatarConfiguration

export interface Artist extends User {
  id: string;
  name: string;
  bio: string;
  location: string;
  avatarUrl?: string; // Keep for potential fallback or simple image use elsewhere
  avatarConfiguration?: AvatarConfiguration; // Changed to match User interface
  specialties: string[];
  styles: string[];
  experience: number;
  hourlyRate: number;
  availability?: Availability[];
  rating?: number;
  reviewCount?: number;
}

export interface Availability {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface ArtistSearchParams {
  name?: string; // Added to allow searching by name
  location?: string;
  specialty?: string;
  style?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}