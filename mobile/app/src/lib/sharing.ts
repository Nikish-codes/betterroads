import { Platform, Alert, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import type { RoadAuthority } from './authorityLookup';
import { getAllShareMessages } from './shareTemplates';

export interface SharePhotoOptions {
  photoUri: string;
  authority: RoadAuthority;
  location: string;
}

/**
 * Share photo with pre-filled message using native share sheet
 */
export async function sharePhoto(options: SharePhotoOptions): Promise<boolean> {
  try {
    const { photoUri, authority, location } = options;

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this device. Please save the photo and share manually.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Get share messages
    const messages = getAllShareMessages({ authority, location, photoUri });

    // For Android and iOS, we can use the native share sheet
    // But expo-sharing doesn't support pre-filled text with images
    // So we'll share the image and user can add text manually

    // Share the photo
    await Sharing.shareAsync(photoUri, {
      mimeType: 'image/jpeg',
      dialogTitle: `Share bad road photo - ${authority.name}`,
      UTI: 'public.jpeg',
    });

    return true;
  } catch (error) {
    console.error('Failed to share photo:', error);
    Alert.alert(
      'Share Failed',
      error instanceof Error ? error.message : 'Failed to share photo. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

/**
 * Share text-only message (without photo)
 * Useful for quick sharing or when photo isn't ready
 */
export async function shareTextOnly(options: Omit<SharePhotoOptions, 'photoUri'>): Promise<boolean> {
  try {
    const { authority, location } = options;
    const messages = getAllShareMessages({ authority, location });

    // Use built-in Share API for text-only
    const result = await Share.share({
      message: messages.generic,
      title: `Bad road at ${location}`,
    });

    if (result.action === Share.sharedAction) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to share text:', error);
    Alert.alert(
      'Share Failed',
      error instanceof Error ? error.message : 'Failed to share. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

/**
 * Share to specific platform with custom message
 */
export async function shareToSpecificPlatform(
  options: SharePhotoOptions,
  platform: 'twitter' | 'instagram' | 'whatsapp' | 'facebook'
): Promise<boolean> {
  try {
    const { photoUri, authority, location } = options;
    const messages = getAllShareMessages({ authority, location, photoUri });

    let url: string;
    let message: string;

    switch (platform) {
      case 'twitter':
        message = encodeURIComponent(messages.twitter);
        url = `twitter://post?message=${message}`;
        break;

      case 'instagram':
        // Instagram doesn't support URL schemes with pre-filled text
        // We'll just share the photo and user adds caption
        return await sharePhoto(options);

      case 'whatsapp':
        message = encodeURIComponent(messages.whatsapp);
        url = `whatsapp://send?text=${message}`;
        break;

      case 'facebook':
        message = encodeURIComponent(messages.facebook);
        url = `fb://facewebmodal/f?href=https://www.facebook.com/sharer/sharer.php?quote=${message}`;
        break;

      default:
        return await sharePhoto(options);
    }

    // Try to open platform-specific app
    // If not installed, fall back to generic share
    const { Linking } = await import('react-native');
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback to generic share
      return await sharePhoto(options);
    }
  } catch (error) {
    console.error(`Failed to share to ${platform}:`, error);
    // Fallback to generic share
    return await sharePhoto(options);
  }
}

/**
 * Copy share message to clipboard
 */
export async function copyMessageToClipboard(options: Omit<SharePhotoOptions, 'photoUri'>): Promise<void> {
  try {
    const { authority, location } = options;
    const messages = getAllShareMessages({ authority, location });

    const { Clipboard } = await import('@react-native-clipboard/clipboard');
    await Clipboard.setString(messages.generic);

    Alert.alert('Copied!', 'Message copied to clipboard. You can now paste it when sharing.', [
      { text: 'OK' },
    ]);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    Alert.alert('Error', 'Failed to copy message. Please try again.', [{ text: 'OK' }]);
  }
}
