import { BASE_URL } from '../constants/api';

/**
 * Converts an image path to a full URL for React Native Image component
 * Handles various path formats and ensures it's a valid absolute URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  // If it's already a full URL, use it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

  // Construct full URL: BASE_URL + /api/uploads/ + path
  return `${BASE_URL}/api/uploads/${cleanPath}`;
};

