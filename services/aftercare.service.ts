import { api } from './api.service';

export interface Aftercare {
  id: string;
  images: string[];
  description: string;
  artistId: string;
  bookingId: string;
}

export interface CreateAftercareData {
  images: string[];
  description: string;
}

// Artist: create aftercare for a booking
export const createAftercare = async (bookingId: string, data: CreateAftercareData): Promise<Aftercare> => {
  return api.post<Aftercare>(`/api/bookings/${bookingId}/aftercare`, data);
};

// User/Artist: get aftercare for a booking
export const getAftercare = async (bookingId: string): Promise<Aftercare> => {
  return api.get<Aftercare>(`/api/bookings/${bookingId}/aftercare`);
};

// Artist: update aftercare for a booking
export const updateAftercare = async (bookingId: string, data: CreateAftercareData): Promise<Aftercare> => {
  return api.put<Aftercare>(`/api/bookings/${bookingId}/aftercare`, data);
};
