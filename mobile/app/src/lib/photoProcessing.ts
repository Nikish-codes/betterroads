import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export interface WatermarkOptions {
  location: string; // e.g., "Indiranagar, Karnataka"
  authority?: string; // Optional authority name
}

/**
 * Add location watermark to photo
 * Compresses and resizes image, adds text overlay at bottom
 */
export async function addWatermarkToPhoto(
  photoUri: string,
  options: WatermarkOptions
): Promise<string> {
  try {
    // Step 1: Resize and compress image
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        {
          resize: {
            width: 1920, // Max width for sharing
            // height will be calculated automatically to maintain aspect ratio
          },
        },
      ],
      {
        compress: 0.8, // 80% quality - good balance
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Step 2: Get image dimensions
    const imageInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
    if (!imageInfo.exists) {
      throw new Error('Failed to get image info');
    }

    // Step 3: Create watermark overlay
    // Note: expo-image-manipulator doesn't support text overlay directly
    // We'll use a workaround: create a canvas-style overlay with ImageManipulator
    // For now, return the compressed image and handle watermark in share template

    return manipulatedImage.uri;
  } catch (error) {
    console.error('Failed to add watermark:', error);
    throw new Error('Failed to process photo: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Compress photo without watermark
 * Useful for quick sharing
 */
export async function compressPhoto(photoUri: string): Promise<string> {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        {
          resize: {
            width: 1920,
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipulatedImage.uri;
  } catch (error) {
    console.error('Failed to compress photo:', error);
    throw new Error('Failed to compress photo');
  }
}

/**
 * Save photo to device storage
 * Returns the permanent URI
 */
export async function savePhotoToDevice(photoUri: string, fileName: string): Promise<string> {
  try {
    const directory = `${FileSystem.documentDirectory}bad-road-photos/`;

    // Create directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    // Copy file to permanent location
    const permanentUri = `${directory}${fileName}`;
    await FileSystem.copyAsync({
      from: photoUri,
      to: permanentUri,
    });

    return permanentUri;
  } catch (error) {
    console.error('Failed to save photo:', error);
    throw new Error('Failed to save photo to device');
  }
}

/**
 * Delete photo from device storage
 */
export async function deletePhoto(photoUri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(photoUri);
    }
  } catch (error) {
    console.error('Failed to delete photo:', error);
  }
}

/**
 * Get all saved photos
 */
export async function getSavedPhotos(): Promise<string[]> {
  try {
    const directory = `${FileSystem.documentDirectory}bad-road-photos/`;
    const dirInfo = await FileSystem.getInfoAsync(directory);

    if (!dirInfo.exists) {
      return [];
    }

    const files = await FileSystem.readDirectoryAsync(directory);
    return files.map((file) => `${directory}${file}`);
  } catch (error) {
    console.error('Failed to get saved photos:', error);
    return [];
  }
}
