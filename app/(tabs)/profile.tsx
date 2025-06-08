import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Image, Alert, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { UpdateProfileData } from '@/types/auth';
import * as ImagePicker from 'expo-image-picker';
import AvatarDisplayComponent from '../../components/AvatarDisplayComponent';
import { router } from 'expo-router'; // Import router for navigation

export default function ProfileScreen() {
  const { user, isAuthenticated, isArtist, logout, updateProfile, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  
  const [specialties, setSpecialties] = useState<string[]>(user?.specialties || []);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [tattooStyles, setTattooStyles] = useState<string[]>(user?.styles || []);
  const [newStyle, setNewStyle] = useState('');
  const [experience, setExperience] = useState(user?.experience?.toString() || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate?.toString() ?? '');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setSpecialties(Array.isArray(user.specialties) ? user.specialties : []);
      setTattooStyles(Array.isArray(user.styles) ? user.styles : []);
      setExperience(user.experience?.toString() || '');
      setHourlyRate(user.hourlyRate?.toString() ?? ''); // Ensure it's a string or empty string
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
      if (isArtist()) { // Changed: isArtist called as a function
        profileData.specialties = specialties;
        profileData.styles = tattooStyles;
        profileData.experience = experience ? parseInt(experience, 10) : undefined;
        // Parse hourlyRate only if it's a non-empty string
        profileData.hourlyRate = hourlyRate.trim() ? parseFloat(hourlyRate) : undefined;
      }
      await updateProfile(profileData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Failed to update profile.';
      if (error instanceof Error) {
        errorMessage += ` (${error.message}) - ${error.stack}`;
      }
      Alert.alert('Error', errorMessage);
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
    if (Platform.OS === 'web') {
      localStorage.removeItem('tatu_auth_token');
      localStorage.removeItem('tatu_user_data');
      window.location.href = '/login';
      return;
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              if (logout) {
                await logout();
                if (Platform.OS === 'web') {
                  window.location.href = '/login';
                } else {
                  if (router) {
                    router.replace('/login');
                  } else {
                    console.error("Expo router is not available for navigation after logout.");
                  }
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
        const formData = new FormData();
        formData.append('avatar', {
          uri: selectedAsset.uri,
          type: selectedAsset.type || 'image/jpeg', // Ensure type is provided
          name: selectedAsset.fileName || 'avatar.jpg' // Ensure name is provided
        } as any);
        if (uploadAvatar) { // Check if uploadAvatar is available from context
          await uploadAvatar(formData);
          Alert.alert('Success', 'Avatar updated successfully');
        } else {
          Alert.alert('Error', 'uploadAvatar function is not available.');
        }
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
      <ThemedView style={styles.containerCenter}>
        <ThemedText>Please log in to view your profile</ThemedText>
        <TouchableFix onPress={() => router.replace('/login')} style={styles.loginButton}>
          <ThemedText style={styles.buttonText}>Go to Login</ThemedText>
        </TouchableFix>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          {/* Replace current avatar with AvatarDisplayComponent */}
          <TouchableOpacity 
            style={styles.mannequinAvatarHeaderContainer} 
            onPress={() => router.push('/avatar-config')}
            disabled={loading} // Optionally disable while loading or editing other parts
          >
            <AvatarDisplayComponent 
              avatarConfiguration={user.avatarConfiguration} 
              isEditing={false} // This is a preview
              containerWidth={styles.mannequinAvatarHeader.width} // Use style for size
              containerHeight={styles.mannequinAvatarHeader.height} // Use style for size
              // You might need a prop to hint at a "face zoom" if the component supports it
            />
            {/* Optionally, add an edit icon overlay if desired, similar to editAvatarOverlay */}
            {/* For simplicity, tapping anywhere on the avatar will navigate */}
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
              <ThemedText type="title" style={styles.name}>{user.name || 'User Name'}</ThemedText>
            )}
            <ThemedText style={styles.role}>{user.isArtist ? 'Tattoo Artist' : 'Tattoo Enthusiast'}</ThemedText>
          </View>
        </View>
        
        {/* About Me Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle">About Me</ThemedText>
          {isEditing ? (
            <TextInput
              style={styles.inputBio}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          ) : (
            <ThemedText style={styles.textBlock}>{user.bio || 'No bio provided.'}</ThemedText>
          )}
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Location</ThemedText>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Your Location"
              editable={!loading}
            />
          ) : (
            <ThemedText style={styles.textBlock}>{user.location || 'Location not set.'}</ThemedText>
          )}
        </View>

        {/* Artist Specific Fields */}
        {isArtist() && ( // Changed: isArtist called as a function
          <>
            <View style={styles.section}> {/* Specialties */}
              <ThemedText type="subtitle">Specialties</ThemedText>
              {isEditing ? (
                <>
                  <View style={styles.tagContainer}>
                    {specialties.map((spec, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{spec}</ThemedText>
                        <TouchableOpacity onPress={() => handleRemoveSpecialty(spec)} style={styles.removeTagButton}>
                          <IconSymbol name="xmark.circle.fill" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.inputFlex}
                      value={newSpecialty}
                      onChangeText={setNewSpecialty}
                      placeholder="Add specialty (e.g., Realism)"
                      editable={!loading}
                    />
                    <TouchableFix onPress={handleAddSpecialty} style={styles.addButton} disabled={loading}>
                      <ThemedText style={styles.addButtonText}>Add</ThemedText>
                    </TouchableFix>
                  </View>
                </>
              ) : (
                <View style={styles.tagContainer}>
                  {user.specialties && user.specialties.length > 0 ? (
                    user.specialties.map((spec, index) => (
                      <View key={index} style={styles.tagView}>
                        <ThemedText style={styles.tagText}>{spec}</ThemedText>
                      </View>
                    ))
                  ) : (
                    <ThemedText style={styles.textBlock}>No specialties listed.</ThemedText>
                  )}
                </View>
              )}
            </View> {/* End Specialties Section */}
            
            <View style={styles.section}> {/* Tattoo Styles */}
              <ThemedText type="subtitle">Tattoo Styles</ThemedText>
              {isEditing ? (
                <>
                  <View style={styles.tagContainer}>
                    {tattooStyles.map((style, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{style}</ThemedText>
                        <TouchableOpacity onPress={() => handleRemoveStyle(style)} style={styles.removeTagButton}>
                          <IconSymbol name="xmark.circle.fill" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.inputFlex}
                      value={newStyle}
                      onChangeText={setNewStyle}
                      placeholder="Add style (e.g., Neo-Traditional)"
                      editable={!loading}
                    />
                    <TouchableFix onPress={handleAddStyle} style={styles.addButton} disabled={loading}>
                      <ThemedText style={styles.addButtonText}>Add</ThemedText>
                    </TouchableFix>
                  </View>
                </>
              ) : (
                <View style={styles.tagContainer}>
                  {user.styles && user.styles.length > 0 ? (
                    user.styles.map((style, index) => (
                      <View key={index} style={styles.tagView}>
                        <ThemedText style={styles.tagText}>{style}</ThemedText>
                      </View>
                    ))
                  ) : (
                    <ThemedText style={styles.textBlock}>No tattoo styles listed.</ThemedText>
                  )}
                </View>
              )}
            </View> {/* End Tattoo Styles Section */}

            <View style={styles.section}> {/* Years of Experience */}
              <ThemedText type="subtitle">Years of Experience</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="e.g., 5"
                  keyboardType="numeric"
                  editable={!loading}
                />
              ) : (
                <ThemedText style={styles.textBlock}>{user.experience !== null && user.experience !== undefined ? `${user.experience} years` : 'Not specified'}</ThemedText>
              )}
            </View> {/* End Years of Experience Section */}

            <View style={styles.section}> {/* Hourly Rate */}
              <ThemedText type="subtitle">Hourly Rate</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="e.g., 150 (USD)"
                  keyboardType="numeric"
                  editable={!loading}
                />
              ) : (
                <ThemedText style={styles.textBlock}>{user.hourlyRate ? `$${user.hourlyRate}/hr` : 'Not specified'}</ThemedText>
              )}
            </View> {/* End Hourly Rate Section */}
          </>
        )} {/* Corrected: Added missing closing parenthesis */}
        {/* Artist Specific Fields */}

        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableFix onPress={handleSaveProfile} style={[styles.button, styles.saveButton]} disabled={loading}>
                <ThemedText style={styles.buttonText}>{loading ? 'Saving...' : 'Save Profile'}</ThemedText>
              </TouchableFix>
              <TouchableFix onPress={() => setIsEditing(false)} style={[styles.button, styles.cancelButton]} disabled={loading}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableFix>
            </>
          ) : (
            <TouchableFix onPress={() => setIsEditing(true)} style={[styles.button, styles.editButton]}>
              <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
            </TouchableFix>
          )}
        </View>

        <TouchableFix onPress={handleLogout} style={[styles.button, styles.logoutButton]} disabled={loading}>
          <ThemedText style={styles.buttonText}>Logout</ThemedText>
        </TouchableFix>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background for the whole screen
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30, // Ensure space for logout button
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    marginBottom: 20,
  },
  mannequinAvatarHeaderContainer: { // New style for the tappable avatar display in header
    marginRight: 20,
    // Add other styling as needed, e.g., for border or shadow
    borderRadius: 10, // Example: if you want rounded corners for the container
    overflow: 'hidden', // Important if AvatarDisplayComponent itself doesn't have rounded corners
    borderColor: '#007AFF', // Example border
    borderWidth: 2, // Example border
  },
  mannequinAvatarHeader: { // Style for the size of the AvatarDisplayComponent in the header
    width: 100, // Increased size
    height: 120, // Increased size, adjust aspect ratio as needed for "face zoom"
    // backgroundColor: '#E0E0E0', // Placeholder background if needed
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 5,
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#555555',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    color: '#333333',
  },
  inputBio: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333333',
  },
  textBlock: {
    fontSize: 16,
    color: '#444444',
    lineHeight: 22,
    marginTop: 5,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagView: { // For non-editable tags
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  removeTagButton: {
    marginLeft: 8,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  inputFlex: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#28A745', // Green color for add button
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
    marginHorizontal: 5, // Add some space between buttons if they wrap
  },
  editButton: {
    backgroundColor: '#007AFF', // Blue for edit
  },
  saveButton: {
    backgroundColor: '#28A745', // Green for save
  },
  cancelButton: {
    backgroundColor: '#FFC107', // Orange for cancel
  },
  logoutButton: {
    backgroundColor: '#DC3545', // Red for logout
    marginTop: 15, // Add some margin above the logout button
    alignSelf: 'center', // Center the logout button
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
