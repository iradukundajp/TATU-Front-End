import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Image, Alert, TouchableOpacity, Switch, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { UpdateProfileData, User } from '@/types/auth';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, isAuthenticated, isArtist, logout, updateProfile, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Profile data state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  
  // Artist-specific data
  const [specialties, setSpecialties] = useState<string[]>(user?.specialties || []);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [tattooStyles, setTattooStyles] = useState<string[]>(user?.styles || []);
  const [newStyle, setNewStyle] = useState('');
  const [experience, setExperience] = useState(user?.experience?.toString() || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate?.toString() || '');

  // Update state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setSpecialties(Array.isArray(user.specialties) ? user.specialties : []);
      setTattooStyles(Array.isArray(user.styles) ? user.styles : []);
      setExperience(user.experience?.toString() || '');
      setHourlyRate(user.hourlyRate?.toString() || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    
    try {
      const profileData: UpdateProfileData = {
        name,
        bio,
        location,
      };
      
      // Add artist-specific fields if user is an artist
      if (isArtist) {
        profileData.specialties = specialties;
        profileData.styles = tattooStyles;
        profileData.experience = experience ? parseInt(experience, 10) : undefined;
        profileData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : undefined;
      }
      
      await updateProfile(profileData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const handleAddStyle = () => {
    if (newStyle.trim() && !tattooStyles.includes(newStyle.trim())) {
      setTattooStyles([...tattooStyles, newStyle.trim()]);
      setNewStyle('');
    }
  };

  const handleRemoveStyle = (style: string) => {
    setTattooStyles(tattooStyles.filter(s => s !== style));
  };

  const handleLogout = () => {
    console.log('Logout button clicked');
    
    // For web, implement a direct solution without alert dialog
    if (Platform.OS === 'web') {
      console.log('Web platform detected, performing direct logout');
      // Clear data from localStorage
      localStorage.removeItem('tatu_auth_token');
      localStorage.removeItem('tatu_user_data');
      
      // Force redirect to login page
      console.log('Redirecting to login page');
      window.location.href = '/login';
      return;
    }
    
    // For native platforms, use the alert dialog approach
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            console.log('Logout confirmed');
            try {
              if (logout) {
                console.log('Calling logout function');
                await logout();
                
                // Direct navigation if context navigation fails
                console.log('Fallback navigation to login');
                if (Platform.OS === 'web') {
                  window.location.href = '/login';
                } else {
                  const { router } = require('expo-router');
                  router.replace('/login');
                }
              } else {
                console.error('Logout function is undefined');
              }
            } catch (error) {
              console.error('Logout error in profile:', error);
            }
          } 
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        setLoading(true);
        
        // Create form data for upload
        const formData = new FormData();
        formData.append('avatar', {
          uri: selectedAsset.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg'
        } as any);
        
        await uploadAvatar(formData);
        Alert.alert('Success', 'Avatar updated successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please log in to view your profile</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={loading || !isEditing}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol name="person.fill" size={50} color="#777777" />
              </View>
            )}
            {isEditing && (
              <View style={styles.editAvatarOverlay}>
                <IconSymbol name="camera.fill" size={24} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.nameContainer}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                editable={!loading}
              />
            ) : (
              <ThemedText type="title" style={styles.name}>{user.name}</ThemedText>
            )}
            <ThemedText style={styles.role}>{user.isArtist ? 'Tattoo Artist' : 'Tattoo Enthusiast'}</ThemedText>
          </View>
        </View>
        
        <View style={styles.actions}>
          {isEditing ? (
            <>
              <TouchableFix 
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Save</ThemedText>
              </TouchableFix>
              <TouchableFix 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
                disabled={loading}
              >
                <IconSymbol name="xmark" size={16} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableFix>
            </>
          ) : (
            <>
              <TouchableFix 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <IconSymbol name="pencil" size={16} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
              </TouchableFix>
              <TouchableFix 
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <IconSymbol name="arrow.right.square" size={16} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Logout</ThemedText>
              </TouchableFix>
            </>
          )}
        </View>
        
        <View style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          {isEditing ? (
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          ) : (
            <ThemedText style={styles.bio}>{user.bio || "No bio provided"}</ThemedText>
          )}
        </View>
        
        <View style={styles.section}>
          <ThemedText type="subtitle">Location</ThemedText>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Your location"
              editable={!loading}
            />
          ) : (
            <ThemedText style={styles.detail}>{user.location || "No location provided"}</ThemedText>
          )}
        </View>
        
        {isArtist && (
          <>
            <View style={styles.section}>
              <ThemedText type="subtitle">Specialties</ThemedText>
              
              {isEditing ? (
                <>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={styles.tagInput}
                      value={newSpecialty}
                      onChangeText={setNewSpecialty}
                      placeholder="Add specialty"
                      editable={!loading}
                    />
                    <TouchableFix
                      style={styles.addButton}
                      onPress={handleAddSpecialty}
                      disabled={loading || !newSpecialty.trim()}
                    >
                      <IconSymbol name="plus" size={16} color="#FFFFFF" />
                    </TouchableFix>
                  </View>
                  <View style={styles.tagsList}>
                    {specialties && specialties.length > 0 ? (
                      specialties.map((specialty, index) => (
                        <View key={index} style={styles.tag}>
                          <ThemedText style={styles.tagText}>{specialty}</ThemedText>
                          <TouchableOpacity 
                            onPress={() => handleRemoveSpecialty(specialty)}
                            disabled={loading}
                            style={styles.removeTag}
                          >
                            <IconSymbol name="xmark.circle.fill" size={16} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <ThemedText style={styles.detail}>Add your first specialty</ThemedText>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.tagsList}>
                  {(user.specialties && user.specialties.length > 0) ? (
                    user.specialties.map((specialty, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{specialty}</ThemedText>
                      </View>
                    ))
                  ) : (
                    <ThemedText style={styles.detail}>No specialties listed</ThemedText>
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.section}>
              <ThemedText type="subtitle">Tattoo Styles</ThemedText>
              
              {isEditing ? (
                <>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={styles.tagInput}
                      value={newStyle}
                      onChangeText={setNewStyle}
                      placeholder="Add style"
                      editable={!loading}
                    />
                    <TouchableFix
                      style={styles.addButton}
                      onPress={handleAddStyle}
                      disabled={loading || !newStyle.trim()}
                    >
                      <IconSymbol name="plus" size={16} color="#FFFFFF" />
                    </TouchableFix>
                  </View>
                  <View style={styles.tagsList}>
                    {tattooStyles && tattooStyles.length > 0 ? (
                      tattooStyles.map((style, index) => (
                        <View key={index} style={styles.tag}>
                          <ThemedText style={styles.tagText}>{style}</ThemedText>
                          <TouchableOpacity 
                            onPress={() => handleRemoveStyle(style)}
                            disabled={loading}
                            style={styles.removeTag}
                          >
                            <IconSymbol name="xmark.circle.fill" size={16} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <ThemedText style={styles.detail}>Add your first style</ThemedText>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.tagsList}>
                  {(user.styles && user.styles.length > 0) ? (
                    user.styles.map((style, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{style}</ThemedText>
                      </View>
                    ))
                  ) : (
                    <ThemedText style={styles.detail}>No styles listed</ThemedText>
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.section}>
              <ThemedText type="subtitle">Experience</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="Years of experience"
                  keyboardType="numeric"
                  editable={!loading}
                />
              ) : (
                <ThemedText style={styles.detail}>
                  {user.experience ? `${user.experience} years` : "Not specified"}
                </ThemedText>
              )}
            </View>
            
            <View style={styles.section}>
              <ThemedText type="subtitle">Hourly Rate</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="Your hourly rate"
                  keyboardType="numeric"
                  editable={!loading}
                />
              ) : (
                <ThemedText style={styles.detail}>
                  {user.hourlyRate ? `$${user.hourlyRate}/hour` : "Not specified"}
                </ThemedText>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatar: {
    width: 100,
    height: 100,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#333333',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    padding: 8,
    fontSize: 18,
    color: '#FFF',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#AAA',
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    color: '#FFF',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  input: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    color: '#FFF',
  },
  detail: {
    fontSize: 16,
  },
  inputWithButton: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    color: '#FFF',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFF',
  },
  removeTag: {
    marginLeft: 4,
  },
});
