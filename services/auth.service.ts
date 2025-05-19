import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, LoginResponse, RegisterUserData, UpdateProfileData, UpdatePasswordData } from '../types/auth';

// Constants for storage keys
const TOKEN_KEY = 'tatu_auth_token';
const USER_KEY = 'tatu_user_data';

// Check if we're running on web
const isWeb = Platform.OS === 'web';

// Get the base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

/**
 * Storage adapter that uses SecureStore on native and localStorage on web
 */
export const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  },
  
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }
};

// Helper function for API requests that don't require a token
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured');
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set default headers
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API error');
  }
  
  return data as T;
};

/**
 * Register a new user
 * @param userData - User data including name, email, password, and optional isArtist flag
 * @returns Promise with user and token
 */
export const register = async (userData: RegisterUserData): Promise<LoginResponse> => {
  try {
    const data = await apiRequest<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Save auth data if successful
    await saveAuthData(data);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * @param email - User email
 * @param password - User password
 * @returns Promise with user and token
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const data = await apiRequest<LoginResponse>(
      '/api/auth/login', 
      { 
        method: 'POST',
        body: JSON.stringify({ email, password })
      }
    );
    
    // Save auth data if successful
    await saveAuthData(data);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user - clear stored credentials
 */
export const logout = async (): Promise<boolean> => {
  try {
    console.log('Auth service: removing token from storage');
    await storage.removeItem(TOKEN_KEY);
    console.log('Auth service: removing user data from storage');
    await storage.removeItem(USER_KEY);
    console.log('Auth service: logout complete');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Save authentication data to secure storage
 * @param data - Authentication data with user and token
 */
const saveAuthData = async (data: LoginResponse): Promise<void> => {
  try {
    await storage.setItem(TOKEN_KEY, data.token);
    await storage.setItem(USER_KEY, JSON.stringify(data.user));
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw error;
  }
};

/**
 * Get the current authentication token
 * @returns The stored token or null
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await storage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Get the current user data
 * @returns The stored user data or null
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userData = await storage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns Whether the user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

/**
 * Check if current user is an artist
 * @returns Whether the current user is an artist
 */
export const isArtist = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user ? user.isArtist : false;
};

/**
 * Update user data in storage after profile changes
 * @param userData - Updated user data
 */
export const updateUserData = async (userData: Partial<User>): Promise<void> => {
  try {
    const currentUserData = await getCurrentUser();
    if (!currentUserData) {
      throw new Error("No user data found");
    }
    
    // Merge current user data with updates
    const updatedUser = { ...currentUserData, ...userData };
    await storage.setItem(USER_KEY, JSON.stringify(updatedUser));
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// For non-auth operations, import the api from api.service
import { api } from './api.service';

/**
 * Update user profile via API
 * @param profileData - Profile data to update
 * @returns Promise with the updated user
 */
export const updateProfile = async (profileData: UpdateProfileData): Promise<User> => {
  try {
    const user = await api.patch<User>('/api/users/profile', profileData);
    
    // Update local storage
    await updateUserData(user);
    
    return user;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Update user password
 * @param passwordData - Password update data
 * @returns Promise with success message
 */
export const updatePassword = async (passwordData: UpdatePasswordData): Promise<{ message: string }> => {
  try {
    return await api.post<{ message: string }>('/api/users/password', passwordData);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Upload a profile avatar
 * @param formData - FormData with the avatar file
 * @returns Promise with the updated user including avatarUrl
 */
export const uploadAvatar = async (formData: FormData): Promise<User> => {
  try {
    const headers = new Headers();
    // Don't set content-type, let the browser set it with the boundary parameter
    
    const user = await api.post<User>('/api/users/avatar', formData, {
      headers,
    });
    
    // Update local storage
    await updateUserData(user);
    
    return user;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}; 