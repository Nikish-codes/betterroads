import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme, radii } from '@/theme';
import type { RoadAuthority } from '@/lib/authorityLookup';

interface PhotoCaptureScreenProps {
  visible: boolean;
  onClose: () => void;
  authorities: RoadAuthority[];
  location: { area: string | null; city: string | null; state: string | null };
  onPhotoTaken: (uri: string) => void;
}

export function PhotoCaptureScreen({
  visible,
  onClose,
  authorities,
  location,
  onPhotoTaken,
}: PhotoCaptureScreenProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onPhotoTaken(capturedPhoto);
      setCapturedPhoto(null);
    }
  };

  const handleClose = () => {
    setCapturedPhoto(null);
    onClose();
  };

  if (!visible) return null;

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.saffronDeep} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.ink2} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            BetterRoads needs camera access to capture photos of bad road conditions.
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Preview mode
  if (capturedPhoto) {
    const locationText = [location.area, location.city, location.state].filter(Boolean).join(', ');

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          {/* Header */}
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </Pressable>
          </View>

          {/* Photo Preview */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedPhoto }} style={styles.previewImage} resizeMode="contain" />
            {/* Location overlay */}
            <View style={styles.locationOverlay}>
              <Text style={styles.locationOverlayText}>{locationText}</Text>
            </View>
          </View>

          {/* Authority Info */}
          <View style={styles.previewInfo}>
            <Text style={styles.previewInfoTitle}>Sharing with:</Text>
            <Text style={styles.previewInfoAuthority}>{authorities[0].name}</Text>
            {authorities[0].twitterHandle && (
              <Text style={styles.previewInfoHandle}>{authorities[0].twitterHandle}</Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.previewActions}>
            <Pressable style={styles.retakeButton} onPress={handleRetake}>
              <Ionicons name="camera-reverse" size={20} color={theme.ink} />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.confirmButtonText}>Use Photo</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Camera mode
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Header */}
        <SafeAreaView style={styles.cameraHeader}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#ffffff" />
          </Pressable>
        </SafeAreaView>

        {/* Location indicator */}
        <View style={styles.locationIndicator}>
          <Ionicons name="location" size={16} color="#ffffff" />
          <Text style={styles.locationText}>
            {[location.area, location.city].filter(Boolean).join(', ') || location.state || 'Location'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            style={styles.flipButton}
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse" size={32} color="#ffffff" />
          </Pressable>

          <Pressable
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </Pressable>

          <View style={{ width: 60 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Capture a clear photo of the bad road condition
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.bg,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.ink,
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: theme.ink2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: theme.saffronDeep,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radii.full,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.ink2,
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: radii.full,
  },
  locationIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    alignSelf: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  controls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
  },
  instructions: {
    position: 'absolute',
    bottom: 160,
    left: 32,
    right: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
    borderRadius: radii.lg,
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  locationOverlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  previewInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  previewInfoAuthority: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  previewInfoHandle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.saffronDeep,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.saffronDeep,
    paddingVertical: 14,
    borderRadius: radii.full,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
