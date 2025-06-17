import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import * as authService from '../services/auth.service';
import { User, RegisterUserData, LoginResponse, UpdateProfileData, UpdatePasswordData } from '../types/auth';
import { AvatarConfiguration } from '../types/avatar';

// Define AuthState interface directly in this file
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isArtist: () => boolean; // Changed to a function type
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (userData: RegisterUserData) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateProfile: (profileData: UpdateProfileData) => Promise<User>;
  updatePassword: (passwordData: UpdatePasswordData) => Promise<any>; 
  uploadAvatar: (formData: FormData) => Promise<User>;
  updateAvatarConfiguration: (config: AvatarConfiguration) => Promise<User>;
  fetchUser: () => Promise<void>; // Added fetchUser here
}

const AuthContext = createContext<AuthState | null>(null); // This was not exported

// Add export here
export { AuthContext }; 

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    console.log("AuthContext: fetchUser called");
    try {
      const currentUserData = await authService.getCurrentUser();
      console.log('AuthContext fetchUser: Fetched user data:', JSON.stringify(currentUserData, null, 2));
      if (currentUserData) {
        setUser(currentUserData as User);
      }
    } catch (error) {
      console.error('Error fetching user data in fetchUser:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const storedToken = await authService.getToken();
        if (storedToken) {
          setToken(storedToken);
          await fetchUser(); 
        } else {
          setUser(null); 
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password) as LoginResponse;
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterUserData) => {
    try {
      const response = await authService.register(userData) as LoginResponse;
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
      if (Platform.OS === 'web') {
        window.location.href = '/login';
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      await authService.updateUserData(updatedUser); // Add this line
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updatePassword = async (passwordData: UpdatePasswordData) => {
    try {
      return await authService.updatePassword(passwordData);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

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

  const updateAvatarConfiguration = async (config: AvatarConfiguration) => {
    try {
      const updatedUser = await authService.updateAvatarConfiguration(config);
      setUser(updatedUser);
      await authService.updateUserData(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update avatar configuration error in AuthContext:', error);
      throw error;
    }
  };

  const isArtist = () => {
    return user?.isArtist === true; // Uses isArtist field from User type
  };

  const authContextValue: AuthState = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isArtist, // isArtist is now a function
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    updatePassword,
    uploadAvatar,
    updateAvatarConfiguration,
    fetchUser, 
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};