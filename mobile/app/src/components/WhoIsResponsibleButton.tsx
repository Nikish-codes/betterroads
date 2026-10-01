import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { theme, radii } from '@/theme';
import { lookupAuthority, reverseGeocode, type RoadAuthority } from '@/lib/authorityLookup';
import { AuthorityInfoModal } from './AuthorityInfoModal';

interface WhoIsResponsibleButtonProps {
  onTakePhoto?: (authorities: RoadAuthority[], location: any) => void;
}

export function WhoIsResponsibleButton({ onTakePhoto }: WhoIsResponsibleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [photoScreenVisible, setPhotoScreenVisible] = useState(false);
  const [authorities, setAuthorities] = useState<RoadAuthority[]>([]);
  const [matchType, setMatchType] = useState<'area' | 'city' | 'state' | 'national'>();
  const [location, setLocation] = useState<{ area: string | null; city: string | null; state: string | null }>();

  const handlePress = async () => {
    try {
      setLoading(true);

      // Check network connectivity (expo-network is already in dependencies)
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        Alert.alert(
          'No Internet Connection',
          'You need an internet connection to find the responsible authority. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Request location permission if not granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'BetterRoads needs location access to find the authority responsible for this road.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode to get location details
      const geocoded = await reverseGeocode(latitude, longitude);

      if (!geocoded || !geocoded.state) {
        Alert.alert(
          'Location Not Found',
          'Could not determine your location. Please try again or move to a different area.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Lookup authority
      const result = await lookupAuthority({
        lat: latitude,
        lon: longitude,
        state: geocoded.state,
        city: geocoded.city || undefined,
        area: geocoded.area || undefined,
      });

      if (!result.ok || !result.authorities || result.authorities.length === 0) {
        Alert.alert(
          'Authority Not Found',
          result.error || 'Could not find the responsible authority for this location. We\'re still building our database.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show modal with authority info
      setAuthorities(result.authorities);
      setMatchType(result.matchType);
      setLocation({
        area: geocoded.area,
        city: geocoded.city,
        state: geocoded.state,
      });
      setModalVisible(true);
    } catch (error) {
      console.error('Failed to find authority:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to find responsible authority. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    setModalVisible(false);
    setPhotoScreenVisible(true);
  };

  const handlePhotoTaken = async (photoUri: string) => {
    try {
      setPhotoScreenVisible(false);

      if (!authorities.length || !location) return;

      // Compress photo
      const compressedUri = await compressPhoto(photoUri);

      // Share photo with authority info
      const locationText = [location.area, location.city, location.state].filter(Boolean).join(', ');
      const shared = await sharePhoto({
        photoUri: compressedUri,
        authority: authorities[0],
        location: locationText,
      });

      if (shared) {
        Alert.alert(
          'Photo Shared!',
          'Thank you for reporting this bad road condition.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to process photo:', error);
      Alert.alert(
        'Error',
        'Failed to process photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
        )}
        <Text style={styles.buttonText}>
          {loading ? 'Finding Authority...' : "Who's Responsible?"}
        </Text>
      </Pressable>

      {authorities.length > 0 && (
        <>
          <AuthorityInfoModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            authorities={authorities}
            matchType={matchType}
            location={location}
            onTakePhoto={handleTakePhoto}
          />

          <PhotoCaptureScreen
            visible={photoScreenVisible}
            onClose={() => setPhotoScreenVisible(false)}
            authorities={authorities}
            location={location!}
            onPhotoTaken={handlePhotoTaken}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.saffronDeep,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radii.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});
