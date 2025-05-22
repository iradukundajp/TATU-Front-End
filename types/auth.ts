import { AvatarConfiguration } from './avatar';

export interface User {
  id: string;
  name: string;
  email: string;
  isArtist: boolean;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  avatarConfiguration?: AvatarConfiguration;
  createdAt?: string;
  // Artist-specific fields
  specialties?: string[];
  styles?: string[];
  experience?: number; // years
  hourlyRate?: number;
  availability?: Availability[];
}

export interface Availability {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isArtist: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: RegisterUserData) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateProfile: (profileData: UpdateProfileData) => Promise<User>;
  updatePassword: (passwordData: UpdatePasswordData) => Promise<any>;
  uploadAvatar: (formData: FormData) => Promise<User>;
  updateAvatarConfiguration: (config: AvatarConfiguration) => Promise<User>; // Added this line
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  isArtist?: boolean;
  bio?: string;
  location?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  // Artist-specific fields
  specialties?: string[];
  styles?: string[];
  experience?: number;
  hourlyRate?: number;
  availability?: Availability[];
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}