import { BASE_URL } from '../constants/api';

/**
 * Production server URL for images
 * Images are stored on production server, so we use this even in dev mode
 */
const PROD_IMAGE_BASE_URL = 'http://uat.medhome.courses:5000';

/**
 * Converts an image path to a full URL for React Native Image component
 * Handles various path formats and ensures it's a valid absolute URL
 * 
 * Note: Images are always fetched from production server (even in dev mode)
 * because they're stored there. API calls still use BASE_URL (localhost in dev).
 * 
 * Handles DB paths like:
 * - "uploads/course-images/..." -> converts to "PROD_IMAGE_BASE_URL/api/uploads/course-images/..."
 * - "/uploads/course-images/..." -> converts to "PROD_IMAGE_BASE_URL/api/uploads/course-images/..."
 * - Already full URLs are returned as-is
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  // If it's already a full URL, use it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Remove 'uploads/' prefix if present (DB stores paths like "uploads/course-images/...")
  let cleanPath = imagePath;
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.replace('uploads/', '');
  } else if (cleanPath.startsWith('/uploads/')) {
    cleanPath = cleanPath.replace('/uploads/', '');
  }

  // Remove leading slash if present
  cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

  // Use production server for images (even in dev mode, since images are stored there)
  // API calls still use BASE_URL which points to localhost in dev
  return `${PROD_IMAGE_BASE_URL}/api/uploads/${cleanPath}`;
};

