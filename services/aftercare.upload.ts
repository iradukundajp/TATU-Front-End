import { storage } from './auth.service';
import { Platform } from 'react-native';

// Upload a single aftercare image (returns URL)
export const uploadAftercareImage = async (file: { uri: string; name: string; type: string }): Promise<string> => {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // Fetch the file as a blob for web
    const res = await fetch(file.uri);
    const blob = await res.blob();
    const webFile = new File([blob], file.name, { type: file.type });
    formData.append('file', webFile);
  } else {
    // Native: append as is
    formData.append('file', file as any);
  }
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const token = await storage.getItem('tatu_auth_token');
  const response = await fetch(`${API_BASE_URL}/api/aftercare/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // DO NOT set Content-Type here!
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Upload failed');
  return data.filePath;
};
