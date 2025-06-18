import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableFix } from '@/components/TouchableFix';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as aftercareService from '@/services/aftercare.service';
import * as aftercareUpload from '@/services/aftercare.upload';
import * as ImagePicker from 'expo-image-picker';

export default function AftercareSuggestScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<{ uri: string; uploading: boolean }[]>([]);
  const [isUpdate, setIsUpdate] = useState(false);

  // Fetch aftercare if exists (for update)
  useEffect(() => {
    const fetchAftercare = async () => {
      try {
        const aftercare = await aftercareService.getAftercare(bookingId as string);
        if (aftercare) {
          setDescription(aftercare.description || '');
          setImages(aftercare.images || []);
          setImagePreviews((aftercare.images || []).map(uri => ({ uri, uploading: false })));
          setIsUpdate(true);
        }
      } catch (err) {
        setIsUpdate(false);
      }
    };
    fetchAftercare();
  }, [bookingId]);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Use new API
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      setUploading(true);
      const files = result.assets || [];
      // Show local previews immediately
      setImagePreviews(prev => [
        ...prev,
        ...files.map(asset => ({ uri: asset.uri, uploading: true }))
      ]);
      for (const asset of files) {
        const uri = asset.uri;
        const name = asset.fileName || uri.split('/').pop() || `image_${Date.now()}.jpg`;
        const type = asset.type || 'image/jpeg';
        // Ensure file object is correct for React Native
        const file: any = {
          uri,
          name,
          type,
        };
        try {
          const url = await aftercareUpload.uploadAftercareImage(file);
          setImages(prev => [...prev, url]);
          // Replace preview with uploaded image
          setImagePreviews(prev => prev.map(p => p.uri === uri ? { uri: url, uploading: false } : p));
        } catch (err) {
          Alert.alert('Image upload failed', 'Could not upload one of the images.');
          setImagePreviews(prev => prev.filter(p => p.uri !== uri));
        }
      }
    } catch (err) {
      Alert.alert('Image picker error', 'Could not pick image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Please enter a description.');
      return;
    }
    setSubmitting(true);
    try {
      if (isUpdate) {
        await aftercareService.updateAftercare(bookingId as string, { description, images });
        Alert.alert('Aftercare updated!');
      } else {
        await aftercareService.createAftercare(bookingId as string, { description, images });
        Alert.alert('Aftercare submitted!');
      }
      router.replace('/(tabs)/manage-bookings');
    } catch (err) {
      Alert.alert('Failed to submit aftercare.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableFix onPress={() => router.back()} style={styles.backButton}>
        <ThemedText style={styles.backButtonText}>{'< Back'}</ThemedText>
      </TouchableFix>
      <ThemedText type="title" style={styles.title}>{isUpdate ? 'Update Aftercare' : 'Suggest Aftercare'}</ThemedText>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe aftercare instructions and recommended products..."
          multiline
        />
        <ThemedText style={styles.label}>Product Images (optional)</ThemedText>
        <TouchableFix style={styles.imagePickerButton} onPress={handlePickImage} disabled={uploading}>
          <ThemedText style={styles.submitButtonText}>{uploading ? 'Uploading...' : 'Add Images'}</ThemedText>
        </TouchableFix>
        <ScrollView horizontal style={styles.imageRow}>
          {imagePreviews.map((img, idx) => (
            <View key={(img.uri || '') + '-' + idx} style={{ position: 'relative' }}>
              <Image source={{ uri: img.uri }} style={styles.image} />
              {/* Remove button */}
              {!img.uploading && (
                <TouchableFix
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                    setImages(prev => prev.filter((url, i) => i !== idx));
                  }}
                >
                  <ThemedText style={styles.removeImageButtonText}>✕</ThemedText>
                </TouchableFix>
              )}
              {img.uploading && (
                <View style={styles.loadingOverlay}>
                  <ThemedText style={styles.loadingText}>Uploading...</ThemedText>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        <TouchableFix style={styles.submitButton} onPress={handleSubmit} disabled={submitting || uploading}>
          <ThemedText style={styles.submitButtonText}>{submitting ? (isUpdate ? 'Updating...' : 'Submitting...') : (isUpdate ? 'Update Aftercare' : 'Submit Aftercare')}</ThemedText>
        </TouchableFix>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backButton: { marginTop: 12, marginBottom: 4, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8 },
  backButtonText: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  scrollContent: { paddingBottom: 32 },
  label: { fontSize: 16, marginBottom: 8, color: '#EFEFEF' },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 12, minHeight: 80, marginBottom: 16 },
  imageRow: { flexDirection: 'row', marginBottom: 16 },
  image: { width: 100, height: 100, borderRadius: 8, marginRight: 12 },
  submitButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  imagePickerButton: { backgroundColor: '#444', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  loadingText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  // Add styles for remove image button
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});
