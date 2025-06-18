import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as aftercareService from '@/services/aftercare.service';
import type { Aftercare } from '@/services/aftercare.service';
import { TouchableFix } from '@/components/TouchableFix';

export default function AftercareViewScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const [aftercare, setAftercare] = useState<Aftercare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAftercare() {
      try {
        setLoading(true);
        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        if (!id) return;
        const data = await aftercareService.getAftercare(id);
        setAftercare(data);
      } catch (err) {
        setError('Could not load aftercare.');
      } finally {
        setLoading(false);
      }
    }
    if (bookingId) fetchAftercare();
  }, [bookingId]);

  if (loading) return <ThemedView style={styles.center}><ThemedText>Loading aftercare...</ThemedText></ThemedView>;
  if (error) return <ThemedView style={styles.center}><ThemedText>{error}</ThemedText></ThemedView>;
  if (!aftercare) return null;

  return (
    <ThemedView style={styles.container}>
      <TouchableFix onPress={() => router.back()} style={styles.backButton}>
        <ThemedText style={styles.backButtonText}>{'< Back'}</ThemedText>
      </TouchableFix>
      <ThemedText type="title" style={styles.title}>Aftercare Instructions</ThemedText>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {aftercare.images && aftercare.images.length > 0 && (
          <ScrollView horizontal style={styles.imageRow}>
            {aftercare.images.map((img: string, idx: number) => (
              <Image key={img + '-' + idx} source={{ uri: img }} style={styles.image} />
            ))}
          </ScrollView>
        )}
        <ThemedText style={styles.description}>{aftercare.description}</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { marginTop: 48, marginBottom: 10, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8 },
  backButtonText: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  scrollContent: { paddingBottom: 32 },
  imageRow: { flexDirection: 'row', marginBottom: 16 },
  image: { width: 120, height: 120, borderRadius: 8, marginRight: 12 },
  description: { fontSize: 16, color: '#EFEFEF' },
});
