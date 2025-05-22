import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import * as authService from '../services/auth.service';
import { AuthState, User, RegisterUserData, LoginResponse, UpdateProfileData, UpdatePasswordData } from '../types/auth';
import { AvatarConfiguration } from '../types/avatar'; // Import AvatarConfiguration

// Create the auth context with proper typing
const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedToken = await authService.getToken();
        const userData = await authService.getCurrentUser();
        console.log('AuthContext useEffect: Loaded user data from storage:', JSON.stringify(userData, null, 2)); // Existing log
        console.log('AuthContext useEffect: avatarConfiguration from storage:', userData ? userData.avatarConfiguration : 'userData is null'); // Added log for avatarConfiguration
        
        if (storedToken && userData) {
          setToken(storedToken);
          setUser(userData as User);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password) as LoginResponse;
      console.log('AuthContext login: User data from authService.login:', JSON.stringify(response.user, null, 2)); // Added log
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterUserData) => {
    try {
      const response = await authService.register(userData) as LoginResponse;
      console.log('AuthContext register: User data from authService.register:', JSON.stringify(response.user, null, 2)); // Added log
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    console.log('Logout function called');
    try {
      console.log('Clearing auth data...');
      await authService.logout();
      console.log('Auth data cleared, updating state');
      
      // Clear state first
      setUser(null);
      setToken(null);
      
      console.log('Redirecting to login screen');
      // Use a more direct approach for navigation
      if (Platform.OS === 'web') {
        // For web, use direct navigation 
        window.location.href = '/login';
      } else {
        // For native, directly navigate to login
        try {
          router.navigate('/login');
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback if router.navigate fails
          try {
            router.replace('/login');
          } catch (replaceError) {
            console.error('Replace navigation error:', replaceError);
          }
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user data locally
  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) return;
      await authService.updateUserData({...user, ...userData});
      setUser(prev => prev ? {...prev, ...userData} : null);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Update profile via API
  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Update password via API
  const updatePassword = async (passwordData: UpdatePasswordData) => {
    try {
      return await authService.updatePassword(passwordData);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  // Upload avatar via API
  const uploadAvatar = async (formData: FormData) => {
    try {
      const updatedUser = await authService.uploadAvatar(formData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  };

  // Update avatar configuration via API
  const updateAvatarConfiguration = async (config: AvatarConfiguration) => {
    try {
      const updatedUser = await authService.updateAvatarConfiguration(config);
      setUser(updatedUser);
      // Optionally, update local storage as well if you rely on it for quick reloads
      await authService.updateUserData(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update avatar configuration error in AuthContext:', error);
      throw error;
    }
  };

  // Check if user is an artist
  const isArtist = () => {
    return user?.isArtist === true;
  };

  // Value object to be provided to consumers
  const authContextValue: AuthState = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isArtist: isArtist(), // Corrected: call isArtist as a function
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    updatePassword,
    uploadAvatar,
    updateAvatarConfiguration, // Added this line
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context; // Ensure the context is returned
};