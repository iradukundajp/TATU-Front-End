import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Alert, TouchableOpacity, View, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PortfolioItem } from '@/types/portfolio';
import * as portfolioService from '@/services/portfolio.service';

export default function PortfolioScreen() {
  const { user, isAuthenticated, isArtist } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState('');

  useEffect(() => {
    // Check if user is an artist, if not redirect
    if (isAuthenticated && !isArtist) {
      Alert.alert('Access Denied', 'This section is only for artists');
      router.replace('/(tabs)/profile');
      return;
    }

    // Fetch artist portfolio
    fetchPortfolio();
  }, [isAuthenticated, isArtist]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      console.log("Fetching portfolio...");
      const data = await portfolioService.getMyPortfolio();
      console.log("Portfolio data received:", data);
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      Alert.alert('Error', 'Failed to load portfolio items');
    } finally {
      setLoading(false);
    }
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
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleAddImage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!newCaption.trim()) {
      Alert.alert('Error', 'Please provide a caption for the image');
      return;
    }

    setSubmitting(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      
      // Platform-specific handling for image upload
      if (Platform.OS === 'web') {
        // For web, we need to fetch the image as a Blob first
        try {
          console.log("Web upload - original image URI:", selectedImage);
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          console.log("Web upload - blob created:", blob.type, blob.size);
          
          // Make sure to set the correct filename with extension
          const filename = 'portfolio-image' + (blob.type === 'image/png' ? '.png' : blob.type === 'image/gif' ? '.gif' : '.jpg');
          
          // Explicitly set the fields that multer expects
          formData.append('image', blob, filename);
          console.log("Web upload - appended image to FormData with filename:", filename);
        } catch (error) {
          console.error('Error converting image to blob:', error);
          Alert.alert('Error', 'Failed to process the selected image');
          setSubmitting(false);
          return;
        }
      } else {
        // For mobile platforms
        const imageInfo = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: 'portfolio-image.jpg'
        };
        console.log("Mobile upload - image info:", imageInfo);
        formData.append('image', imageInfo as any);
      }
      
      // Add the caption field
      formData.append('caption', newCaption.trim());
      
      console.log("FormData created:", formData);
      
      // Upload the image
      const uploadResult = await portfolioService.uploadPortfolioImage(formData);
      
      // Reset form
      setNewCaption('');
      setSelectedImage(null);
      
      // Refresh portfolio
      fetchPortfolio();
      
      Alert.alert('Success', 'Image added to portfolio');
    } catch (error) {
      console.error('Error adding image:', error);
      Alert.alert('Error', 'Failed to add image to portfolio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    console.log("Delete requested for item ID:", id);
    
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this image from your portfolio?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setLoading(true);
            try {
              console.log("Proceeding with deletion of item ID:", id);
              await portfolioService.deletePortfolioItem(id);
              console.log("Item successfully deleted, updating UI");
              setPortfolio(current => current.filter(item => item.id !== id));
              Alert.alert('Success', 'Image removed from portfolio');
            } catch (error) {
              console.error('Error deleting image:', error);
              Alert.alert(
                'Error', 
                'Failed to remove image. Please try again or contact support.'
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditImage = (item: PortfolioItem) => {
    setEditingId(item.id);
    setEditingCaption(item.caption);
  };

  const handleSaveEdit = async (item: PortfolioItem) => {
    try {
      await portfolioService.updatePortfolioItem(item.id, { caption: editingCaption });
      setPortfolio(current => current.map(i => i.id === item.id ? { ...i, caption: editingCaption } : i));
      setEditingId(null);
      setEditingCaption('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update caption');
    }
  };

  const renderItem = ({ item }: { item: PortfolioItem }) => {
    const imageUrl = item.imageUrl.startsWith('http') 
      ? item.imageUrl 
      : `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.imageUrl}`;
    return (
      <TouchableOpacity
        onPress={() => handleEditImage(item)}
        activeOpacity={0.85}
        style={styles.imageContainer}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.captionContainer}>
          {editingId === item.id ? (
            <>
              <TextInput
                style={styles.editInput}
                value={editingCaption}
                onChangeText={setEditingCaption}
                autoFocus
                onSubmitEditing={() => handleSaveEdit(item)}
                onBlur={() => setEditingId(null)}
              />
              <TouchableOpacity onPress={() => handleSaveEdit(item)} style={styles.iconButton}>
                <IconSymbol name="checkmark" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ThemedText style={styles.caption}>{item.caption}</ThemedText>
              <View style={styles.iconRow}>
                <TouchableOpacity onPress={() => handleEditImage(item)} style={styles.iconButton}>
                  <IconSymbol name="pencil" size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteImage(item.id)} style={styles.iconButton}>
                  <IconSymbol name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && portfolio.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>My Portfolio</ThemedText>
      
      <View style={styles.uploadSection}>
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.imagePreview} 
              contentFit="cover"
            />
            <TouchableFix style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
              <IconSymbol name="xmark.circle.fill" size={24} color="#FFFFFF" />
            </TouchableFix>
          </View>
        ) : (
          <TouchableFix style={styles.imagePicker} onPress={pickImage} disabled={submitting}>
            <IconSymbol name="photo" size={32} color="#007AFF" />
            <ThemedText style={styles.imagePickerText}>Select Image</ThemedText>
          </TouchableFix>
        )}
        
        <TextInput
          style={styles.captionInput}
          placeholder="Enter image caption..."
          value={newCaption}
          onChangeText={setNewCaption}
          multiline
          editable={!submitting}
        />
        
        <TouchableFix 
          style={[styles.addButton, (!selectedImage || !newCaption.trim() || submitting) && styles.addButtonDisabled]} 
          onPress={handleAddImage}
          disabled={!selectedImage || !newCaption.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Add to Portfolio</ThemedText>
            </>
          )}
        </TouchableFix>
      </View>
      
      {portfolio.length > 0 ? (
        <FlatList
          data={portfolio}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchPortfolio}
        />
      ) : (
        <View style={styles.emptyState}>
          <IconSymbol name="photo.on.rectangle.angled" size={60} color="#555555" />
          <ThemedText style={styles.emptyStateText}>Your portfolio is empty</ThemedText>
          <ThemedText style={styles.emptyStateSubtext}>Add images above to showcase your work</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  uploadSection: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  imagePicker: {
    height: 150,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePickerText: {
    marginTop: 8,
    color: '#007AFF',
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  captionInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyStateText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: 'bold',
    color: '#555555',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#555555',
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1f1f1f',
  },
  image: {
    width: '100%',
    height: 200,
  },
  captionContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caption: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconButton: {
    marginLeft: 8,
    padding: 4,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 4,
    padding: 6,
    marginRight: 8,
  },
}); 