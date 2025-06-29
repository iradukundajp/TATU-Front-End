import type { Aftercare } from '../services/aftercare.service';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  artistId: string;
  clientId: string;
  clientName: string;
  artistName: string;
  artistAvatar?: string;
  date: string; // ISO date string
  duration: number; // minutes
  status: BookingStatus;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  aftercare?: Aftercare; // Optional aftercare property
}

export interface CreateBookingData {
  artistId: string;
  date: string;
  duration: number;
  note?: string;
}

export interface UpdateBookingStatusData {
  status: BookingStatus;
}